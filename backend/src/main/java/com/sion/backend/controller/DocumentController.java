package com.sion.backend.controller;

import com.sion.backend.dto.response.DocumentResponse;
import com.sion.backend.dto.response.MessageResponse;
import com.sion.backend.model.AppDocument;
import com.sion.backend.model.User;
import com.sion.backend.service.DocumentService;
import com.sion.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final UserService userService;

    @PostMapping("/upload")
    public ResponseEntity<DocumentResponse> upload(
            @RequestParam("inscriptionId") String inscriptionId,
            @RequestParam("docType") String docType,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        AppDocument doc = documentService.upload(inscriptionId, docType, file, user.getId());
        return ResponseEntity.ok(DocumentResponse.fromDocument(doc));
    }

    @GetMapping("/{inscriptionId}")
    public ResponseEntity<List<DocumentResponse>> getByInscription(@PathVariable String inscriptionId) {
        List<DocumentResponse> docs = documentService.findByInscriptionId(inscriptionId).stream()
                .map(DocumentResponse::fromDocument)
                .toList();
        return ResponseEntity.ok(docs);
    }

    @GetMapping("/doc/{id}")
    public ResponseEntity<DocumentResponse> getById(@PathVariable String id) {
        AppDocument doc = documentService.findById(id);
        return ResponseEntity.ok(DocumentResponse.fromDocument(doc));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> delete(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        documentService.delete(id, user.getId());
        return ResponseEntity.ok(new MessageResponse("Documento eliminado"));
    }
}
