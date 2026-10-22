package com.sion.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Bloque inmutable de la cadena de credenciales.
 *
 * IMPORTANTE (Ley 1581 / Habeas Data): este bloque es PUBLICO y solo debe
 * contener hashes y referencias opacas. Nunca datos personales sensibles.
 * Los metadatos reales viven off-chain en {@link Credential}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ledger_blocks")
public class LedgerBlock {

    @Id
    private String id;

    /** Posicion en la cadena (0 = genesis). */
    private long index;

    /** SHA-256 del contenido de la credencial (off-chain). */
    private String dataHash;

    /** Hash del bloque anterior ("0" en el genesis). */
    private String previousHash;

    /** HMAC-SHA256 firmado por la autoridad institucional (equivale a PoA). */
    private String authoritySignature;

    /** SHA-256(index|timestamp|dataHash|previousHash|authoritySignature). */
    private String hash;

    /** UUID opaco de la credencial. No expone datos personales. */
    private String credentialRef;

    /** Tipo de bloque: genesis | credential | revocation. */
    private String type;

    private LocalDateTime createdAt = LocalDateTime.now();
}
