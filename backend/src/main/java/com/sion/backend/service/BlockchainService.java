package com.sion.backend.service;

import com.sion.backend.exception.ConflictException;
import com.sion.backend.exception.ResourceNotFoundException;
import com.sion.backend.model.Credential;
import com.sion.backend.model.LedgerBlock;
import com.sion.backend.repository.CredentialRepository;
import com.sion.backend.repository.LedgerBlockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Ledger inmutable de credenciales academicas (Fase Piloto UNAC).
 *
 * Diseno alineado a la propuesta blockchain de la UNAC:
 *  - Off-chain: los datos del titular viven en {@code credentials}; la cadena
 *    solo ancla hashes SHA-256 (Ley 1581 de 2012 / Habeas Data).
 *  - PoA simulado: cada bloque se firma con HMAC-SHA256 usando la llave
 *    institucional, de modo que solo la autoridad puede anclar bloques.
 *  - Integridad verificable: {@link #verify(String)} recalcula la cadena
 *    completa desde el genesis y detecta cualquier alteracion.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BlockchainService {

    private static final String GENESIS_PREV_HASH = "0".repeat(64);
    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * MongoDB trunca los nanosegundos de LocalDateTime al persistir. Si el hash
     * se calcula con nanosegundos y luego se recalcula desde la BD (milisegundos),
     * nunca coincide. Por eso TODA fecha que entra en un hash se normaliza a
     * milisegundos antes de formatearse.
     */
    private LocalDateTime nowNormalized() {
        return LocalDateTime.now().truncatedTo(java.time.temporal.ChronoUnit.MILLIS);
    }

    private final LedgerBlockRepository blockRepository;
    private final CredentialRepository credentialRepository;

    /** Llave institucional que firma los bloques (equivale a la autoridad PoA). */
    @Value("${app.blockchain.authority-key:sion-unac-authority-key-2026}")
    private String authorityKey;

    /** Firma de la autoridad sobre el contenido del bloque. */
    public String authoritySignature(String dataHash, String previousHash) {
        return hmacSha256(authorityKey, dataHash + previousHash);
    }

    /**
     * Emite una credencial y ancla su hash en la cadena.
     */
    public Credential issue(String type, String title, String holderName, String holderDocument,
                            String holderEmail, String inscriptionId, String program,
                            String period, String issuedBy) {

        if (credentialRepository.existsByInscriptionIdAndType(inscriptionId, type)) {
            throw new ConflictException("Ya existe una credencial de tipo '" + type + "' para esta inscripcion");
        }

        LocalDateTime now = nowNormalized();

        Credential credential = new Credential();
        credential.setId(java.util.UUID.randomUUID().toString());
        credential.setVerificationCode(generateCode(type));
        credential.setType(type);
        credential.setTitle(title);
        credential.setHolderName(holderName);
        credential.setHolderDocument(holderDocument);
        credential.setHolderEmail(holderEmail);
        credential.setInscriptionId(inscriptionId);
        credential.setProgram(program);
        credential.setPeriod(period);
        credential.setIssuedAt(now);
        credential.setIssuedBy(issuedBy);
        credential.setStatus("active");

        String contentHash = sha256(canonicalContent(credential));
        credential.setContentHash(contentHash);

        LedgerBlock block = appendBlock(credential.getId(), contentHash, "credential");
        credential.setAnchorHash(block.getHash());

        Credential saved = credentialRepository.save(credential);
        log.info("[blockchain] Credencial emitida: {} ({}), bloque #{}, hash {}",
                saved.getVerificationCode(), type, block.getIndex(), shortHash(block.getHash()));
        return saved;
    }

    /**
     * Revoca una credencial anclando un bloque de revocacion encadenado al anterior.
     */
    public Credential revoke(String id, String reason) {
        Credential credential = credentialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Credencial no encontrada"));

        if ("revoked".equals(credential.getStatus())) {
            throw new ConflictException("La credencial ya esta revocada");
        }

        credential.setStatus("revoked");
        credential.setRevocationReason(reason);
        credential.setRevokedAt(nowNormalized());

        // La cadena conserva la integridad: se ancla un bloque de revocacion.
        String revocationHash = sha256(credential.getId() + "|" + reason + "|" + credential.getRevokedAt().format(ISO));
        appendBlock(credential.getId(), revocationHash, "revocation");

        Credential saved = credentialRepository.save(credential);
        log.info("[blockchain] Credencial revocada: {} ({})", saved.getVerificationCode(), reason);
        return saved;
    }

    /**
     * Verificacion publica: valida la integridad de la cadena y devuelve el estado.
     * No requiere autenticacion.
     */
    public VerificationResult verify(String code) {
        Credential credential = credentialRepository.findByVerificationCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Credencial no encontrada"));

        ChainValidation chain = validateChain();

        boolean contentMatches = sha256(canonicalContent(credential)).equals(credential.getContentHash());

        boolean anchored = chain.valid
                && blockRepository.findByCredentialRef(credential.getId())
                        .map(b -> b.getHash().equals(credential.getAnchorHash()))
                        .orElse(false);

        return new VerificationResult(credential, chain.valid, contentMatches, anchored, chain.totalBlocks, chain.message);
    }

    /**
     * Recorre toda la cadena desde el genesis recalculando hashes y firmas.
     */
    public ChainValidation validateChain() {
        var blocks = blockRepository.findAll().stream()
                .sorted(java.util.Comparator.comparingLong(LedgerBlock::getIndex))
                .toList();

        if (blocks.isEmpty()) {
            return new ChainValidation(true, 0, "Cadena vacia (sin credenciales emitidas aun)");
        }

        String expectedPrev = GENESIS_PREV_HASH;
        for (LedgerBlock block : blocks) {
            if (!expectedPrev.equals(block.getPreviousHash())) {
                return new ChainValidation(false, blocks.size(),
                        "Cadena rota en el bloque #" + block.getIndex() + ": previousHash no coincide");
            }

            String expectedHash = sha256(String.join("|",
                    String.valueOf(block.getIndex()),
                    block.getCreatedAt().format(ISO),
                    block.getDataHash(),
                    block.getPreviousHash(),
                    block.getAuthoritySignature()));

            if (!expectedHash.equals(block.getHash())) {
                return new ChainValidation(false, blocks.size(),
                        "Bloque #" + block.getIndex() + " alterado: el hash no se puede recalcular");
            }

            String expectedSig = authoritySignature(block.getDataHash(), block.getPreviousHash());
            if (!expectedSig.equals(block.getAuthoritySignature())) {
                return new ChainValidation(false, blocks.size(),
                        "Bloque #" + block.getIndex() + " con firma de autoridad invalida");
            }

            expectedPrev = block.getHash();
        }

        return new ChainValidation(true, blocks.size(),
                "Cadena integra: " + blocks.size() + " bloque(s) verificados");
    }

    /**
     * Estado general del ledger para el panel administrativo.
     */
    public Map<String, Object> ledgerStatus() {
        long total = blockRepository.count();
        long credentials = credentialRepository.count();
        long revoked = credentialRepository.findByStatus("revoked",
                org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();

        Optional<LedgerBlock> head = blockRepository.findTopByOrderByIndexDesc();
        ChainValidation validation = validateChain();

        Map<String, Object> status = new LinkedHashMap<>();
        status.put("totalBlocks", total);
        status.put("totalCredentials", credentials);
        status.put("revokedCredentials", revoked);
        status.put("headIndex", head.map(LedgerBlock::getIndex).orElse(-1L));
        status.put("headHash", head.map(LedgerBlock::getHash).orElse(GENESIS_PREV_HASH));
        status.put("chainValid", validation.valid());
        status.put("chainMessage", validation.message());
        return status;
    }

    /**
     * Historial de bloques (solo datos anonimos: indices y hashes).
     */
    public java.util.List<Map<String, Object>> listBlocks(int limit) {
        int safeLimit = Math.min(200, Math.max(1, limit));
        return blockRepository.findAll().stream()
                .sorted(java.util.Comparator.comparingLong(LedgerBlock::getIndex).reversed())
                .limit(safeLimit)
                .map(b -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("index", b.getIndex());
                    m.put("type", b.getType());
                    m.put("hash", b.getHash());
                    m.put("previousHash", b.getPreviousHash());
                    m.put("dataHash", b.getDataHash());
                    m.put("credentialRef", b.getCredentialRef());
                    m.put("createdAt", b.getCreatedAt().format(ISO));
                    return m;
                })
                .toList();
    }

    public Optional<Credential> findById(String id) {
        return credentialRepository.findById(id);
    }

    public Optional<Credential> findByCode(String code) {
        return credentialRepository.findByVerificationCode(code);
    }

    public java.util.List<Credential> findByHolderEmail(String email) {
        return credentialRepository.findByHolderEmailOrderByIssuedAtDesc(email);
    }

    public org.springframework.data.domain.Page<Credential> findAll(int page, int limit, String type) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(100, Math.max(1, limit));
        var pageRequest = org.springframework.data.domain.PageRequest.of(safePage - 1, safeLimit);
        if (type != null && !type.isEmpty()) {
            return credentialRepository.findByType(type, pageRequest);
        }
        return credentialRepository.findAll(pageRequest);
    }

    // ── Internos ──────────────────────────────────────────────────────────

    private LedgerBlock appendBlock(String credentialRef, String dataHash, String type) {
        long nextIndex = blockRepository.findTopByOrderByIndexDesc()
                .map(b -> b.getIndex() + 1)
                .orElse(0L);

        String previousHash = blockRepository.findTopByOrderByIndexDesc()
                .map(LedgerBlock::getHash)
                .orElse(GENESIS_PREV_HASH);

        LocalDateTime now = nowNormalized();
        String signature = authoritySignature(dataHash, previousHash);

        String hash = sha256(String.join("|",
                String.valueOf(nextIndex),
                now.format(ISO),
                dataHash,
                previousHash,
                signature));

        LedgerBlock block = new LedgerBlock();
        block.setId(java.util.UUID.randomUUID().toString());
        block.setIndex(nextIndex);
        block.setDataHash(dataHash);
        block.setPreviousHash(previousHash);
        block.setAuthoritySignature(signature);
        block.setHash(hash);
        block.setCredentialRef(credentialRef);
        block.setType(type);
        block.setCreatedAt(now);
        return blockRepository.save(block);
    }

    /**
     * Contenido canonico usado para el hash de integridad.
     * El orden es fijo para que el recalculo siempre sea identico.
     */
    private String canonicalContent(Credential c) {
        return String.join("|",
                nullSafe(c.getId()),
                nullSafe(c.getType()),
                nullSafe(c.getTitle()),
                nullSafe(c.getHolderName()),
                nullSafe(c.getHolderDocument()),
                nullSafe(c.getHolderEmail()),
                nullSafe(c.getInscriptionId()),
                nullSafe(c.getProgram()),
                nullSafe(c.getPeriod()),
                c.getIssuedAt() != null ? c.getIssuedAt().format(ISO) : "");
    }

    private String generateCode(String type) {
        String prefix = switch (type) {
            case Credential.TYPE_ACTA -> "ACTA";
            case Credential.TYPE_DIPLOMA -> "DIPLO";
            case Credential.TYPE_CERTIFICADO -> "CERTI";
            case Credential.TYPE_ADMISION -> "ADMI";
            default -> "CRED";
        };
        // 8 caracteres aleatorios, legibles y sin caracteres ambiguos.
        String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 8; i++) {
            sb.append(alphabet.charAt(RANDOM.nextInt(alphabet.length())));
        }
        return prefix + "-" + sb;
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo calcular SHA-256", e);
        }
    }

    private String hmacSha256(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo firmar con HMAC-SHA256", e);
        }
    }

    private String nullSafe(String s) {
        return s == null ? "" : s;
    }

    private String shortHash(String hash) {
        return hash == null || hash.length() < 12 ? hash : hash.substring(0, 12) + "…";
    }

    /** Resultado de la validacion de la cadena. */
    public record ChainValidation(boolean valid, int totalBlocks, String message) {}

    /** Resultado de la verificacion publica de una credencial. */
    public record VerificationResult(
            Credential credential,
            boolean chainValid,
            boolean contentMatches,
            boolean anchored,
            int totalBlocks,
            String chainMessage) {

        public boolean isAuthentic() {
            return chainValid && contentMatches && anchored;
        }
    }
}
