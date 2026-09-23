package com.sion.backend.service;

import com.sion.backend.exception.ResourceNotFoundException;
import com.sion.backend.exception.UnauthorizedException;
import com.sion.backend.model.AppDocument;
import com.sion.backend.model.Inscription;
import com.sion.backend.repository.DocumentRepository;
import com.sion.backend.repository.InscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final InscriptionRepository inscriptionRepository;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    private static final List<String> VALID_DOC_TYPES = Arrays.asList(
        "identity", "icfes", "diploma", "acta", "adicional",
        "cc_front", "cc_back", "highschool", "saber11",
        "photo", "medical", "residence", "acta_grado", "libre_materia"
    );
    private static final List<String> ALLOWED_TYPES = Arrays.asList(
        "application/pdf", "image/jpeg", "image/png"
    );

    public AppDocument upload(String inscriptionId, String docType, MultipartFile file, String userId) {
        if (!VALID_DOC_TYPES.contains(docType)) {
            throw new IllegalArgumentException("Tipo de documento no valido");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Archivo requerido");
        }

        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Tipo de archivo no permitido. Solo PDF, JPEG, PNG");
        }

        Inscription inscription = inscriptionRepository.findById(inscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Inscripcion no encontrada"));

        if (!inscription.getUserId().equals(userId)) {
            throw new UnauthorizedException("No autorizado para subir documentos a esta inscripcion");
        }

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String filename = System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 9)
                    + getExtension(file.getOriginalFilename());
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            AppDocument doc = new AppDocument();
            doc.setInscriptionId(inscriptionId);
            doc.setDocType(docType);
            doc.setFileUrl("/uploads/" + filename);
            doc.setStatus("uploaded");
            doc.setUploadedAt(LocalDateTime.now());

            return documentRepository.save(doc);
        } catch (IOException e) {
            throw new RuntimeException("Error al guardar el archivo", e);
        }
    }

    public List<AppDocument> findByInscriptionId(String inscriptionId) {
        if (inscriptionRepository.findById(inscriptionId).isEmpty()) {
            throw new ResourceNotFoundException("Inscripcion no encontrada");
        }
        return documentRepository.findByInscriptionIdOrderByUploadedAtDesc(inscriptionId);
    }

    public AppDocument findById(String id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento no encontrado"));
    }

    public void delete(String id, String userId) {
        AppDocument doc = findById(id);
        Inscription inscription = inscriptionRepository.findById(doc.getInscriptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Inscripcion no encontrada"));

        if (!inscription.getUserId().equals(userId)) {
            throw new UnauthorizedException("No autorizado para eliminar este documento");
        }

        documentRepository.deleteById(id);
    }

    private String getExtension(String filename) {
        if (filename == null) return ".bin";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : ".bin";
    }
}
