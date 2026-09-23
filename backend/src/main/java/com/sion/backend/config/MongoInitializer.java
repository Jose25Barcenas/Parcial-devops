package com.sion.backend.config;

import com.sion.backend.model.*;
import com.sion.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class MongoInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(MongoInitializer.class);

    private final UserRepository userRepository;
    private final InscriptionRepository inscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final DocumentRepository documentRepository;
    private final AdmissionResultRepository admissionResultRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Base de datos ya tiene datos, omitiendo seed");
            return;
        }

        log.info("Creando datos iniciales...");

        // Admin
        User admin = new User();
        admin.setFullName("Admin SION");
        admin.setEmail("admin@sion.edu.co");
        admin.setPasswordHash(passwordEncoder.encode("admin123"));
        admin.setRole("admin");
        admin.setCreatedAt(LocalDateTime.now());
        admin.setUpdatedAt(LocalDateTime.now());
        userRepository.save(admin);

        // Aspirante 1
        User maria = new User();
        maria.setFullName("Maria Garcia");
        maria.setEmail("maria.garcia@correo.com");
        maria.setPasswordHash(passwordEncoder.encode("maria123"));
        maria.setPhone("300 123 4567");
        maria.setRole("aspirant");
        maria.setCreatedAt(LocalDateTime.now());
        maria.setUpdatedAt(LocalDateTime.now());
        userRepository.save(maria);

        // Aspirante 2
        User carlos = new User();
        carlos.setFullName("Carlos Lopez");
        carlos.setEmail("carlos.lopez@correo.com");
        carlos.setPasswordHash(passwordEncoder.encode("carlos123"));
        carlos.setPhone("300 987 6543");
        carlos.setRole("aspirant");
        carlos.setCreatedAt(LocalDateTime.now());
        carlos.setUpdatedAt(LocalDateTime.now());
        userRepository.save(carlos);

        // Inscripciones para Maria
        Inscription ins1 = new Inscription();
        ins1.setUserId(maria.getId());
        ins1.setProgram("Ingenieria de Sistemas");
        ins1.setSchedule("Diurna");
        ins1.setStatus("completed");
        ins1.setCreatedAt(LocalDateTime.now().minusDays(5));
        ins1.setUpdatedAt(LocalDateTime.now().minusDays(3));
        inscriptionRepository.save(ins1);

        Inscription ins2 = new Inscription();
        ins2.setUserId(maria.getId());
        ins2.setProgram("Administracion de Empresas");
        ins2.setSchedule("Nocturna");
        ins2.setStatus("completed");
        ins2.setCreatedAt(LocalDateTime.now().minusDays(2));
        ins2.setUpdatedAt(LocalDateTime.now().minusDays(1));
        inscriptionRepository.save(ins2);

        // Pagos
        Payment pay1 = new Payment();
        pay1.setInscriptionId(ins1.getId());
        pay1.setAmount(80000.0);
        pay1.setMethod("pse");
        pay1.setStatus("completed");
        pay1.setTransactionId("TXN-PSE-001");
        pay1.setPaidAt(LocalDateTime.now().minusDays(4));
        pay1.setCreatedAt(LocalDateTime.now().minusDays(5));
        paymentRepository.save(pay1);

        Payment pay2 = new Payment();
        pay2.setInscriptionId(ins2.getId());
        pay2.setAmount(80000.0);
        pay2.setMethod("tarjeta");
        pay2.setStatus("completed");
        pay2.setTransactionId("TXN-TAR-002");
        pay2.setPaidAt(LocalDateTime.now().minusDays(1));
        pay2.setCreatedAt(LocalDateTime.now().minusDays(2));
        paymentRepository.save(pay2);

        // Documentos
        String[] docTypes = {"identity", "icfes", "diploma"};
        for (String docType : docTypes) {
            AppDocument doc = new AppDocument();
            doc.setInscriptionId(ins1.getId());
            doc.setDocType(docType);
            doc.setFileUrl("/uploads/sample-" + docType + ".pdf");
            doc.setStatus("uploaded");
            doc.setUploadedAt(LocalDateTime.now().minusDays(3));
            documentRepository.save(doc);
        }

        for (String docType : docTypes) {
            AppDocument doc = new AppDocument();
            doc.setInscriptionId(ins2.getId());
            doc.setDocType(docType);
            doc.setFileUrl("/uploads/sample-" + docType + "-2.pdf");
            doc.setStatus("uploaded");
            doc.setUploadedAt(LocalDateTime.now().minusDays(1));
            documentRepository.save(doc);
        }

        // Resultados de admision
        AdmissionResult res1 = new AdmissionResult();
        res1.setInscriptionId(ins1.getId());
        res1.setDecision("admitted");
        res1.setPeriod("2026-II");
        res1.setNotes("Admitido con excelencia academica");
        res1.setEvaluatedAt(LocalDateTime.now().minusDays(2));
        admissionResultRepository.save(res1);

        AdmissionResult res2 = new AdmissionResult();
        res2.setInscriptionId(ins2.getId());
        res2.setDecision("admitted");
        res2.setPeriod("2026-II");
        res2.setNotes("Admitido con excelencia academica");
        res2.setEvaluatedAt(LocalDateTime.now().minusDays(1));
        admissionResultRepository.save(res2);

        log.info("Seed completado: 3 usuarios, 2 inscripciones, 2 pagos, 6 documentos, 2 resultados");
    }
}
