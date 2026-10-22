package com.sion.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Credencial academica verificable.
 *
 * Esta coleccion es OFF-CHAIN: aqui si se guardan los datos del titular,
 * pero el hash de integridad esta anclado en la cadena ({@link LedgerBlock}).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "credentials")
public class Credential {

    /** Tipos validos alineados a la Fase Piloto del documento UNAC. */
    public static final String TYPE_ACTA = "acta_grado";
    public static final String TYPE_DIPLOMA = "diploma";
    public static final String TYPE_CERTIFICADO = "certificado_notas";
    public static final String TYPE_ADMISION = "carta_admision";

    @Id
    private String id;

    /** Codigo corto mostrable al titular y al verificador externo. */
    @Indexed(unique = true)
    private String verificationCode;

    private String type;

    private String title;

    private String holderName;

    /** Numero de documento del titular (solo off-chain). */
    private String holderDocument;

    private String holderEmail;

    private String inscriptionId;

    private String program;

    private String period;

    /** SHA-256 del contenido canonico de la credencial. */
    private String contentHash;

    /** Hash del bloque en la cadena que ancla esta credencial. */
    private String anchorHash;

    /** active | revoked. */
    private String status = "active";

    private String revocationReason;

    private LocalDateTime issuedAt = LocalDateTime.now();

    private LocalDateTime revokedAt;

    private String issuedBy;
}
