package com.splittrip.trip.application;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.splittrip.common.storage.FileStorageService;
import com.splittrip.trip.domain.ExpenseAttachment;
import com.splittrip.trip.infrastructure.*;

@Service
public class ExpenseAttachmentService {
    private static final long MAX_SIZE = 10 * 1024 * 1024;
    private final ExpenseAttachmentRepository repository;
    private final ExpenseRepository expenseRepository;
    private final TripMemberRepository memberRepository;
    private final FileStorageService storage;

    public ExpenseAttachmentService(ExpenseAttachmentRepository repository, ExpenseRepository expenseRepository,
            TripMemberRepository memberRepository, FileStorageService storage) {
        this.repository = repository; this.expenseRepository = expenseRepository;
        this.memberRepository = memberRepository; this.storage = storage;
    }

    @Transactional
    public List<AttachmentView> upload(UUID tripId, UUID expenseId, UUID userId, List<MultipartFile> files) {
        var membership = requireMembership(tripId, userId);
        var expense = expenseRepository.findByIdAndTripIdWithShares(expenseId, tripId)
                .orElseThrow(() -> new InvalidExpenseException("Expense not found."));
        if (files == null || files.isEmpty()) throw new InvalidExpenseException("Choose at least one document.");
        if (files.size() > 5) throw new InvalidExpenseException("Upload at most five documents at a time.");
        var created = new ArrayList<ExpenseAttachment>();
        var storedKeys = new ArrayList<String>();
        try {
            for (var file : files) {
                var detected = inspect(file);
                var key = "%s/%s/%s.%s".formatted(tripId, expenseId, UUID.randomUUID(), detected.extension());
                storage.store(key, file.getInputStream());
                storedKeys.add(key);
                created.add(repository.save(ExpenseAttachment.create(expense, membership.getUser(), safeName(file.getOriginalFilename()),
                        key, detected.contentType(), file.getSize())));
            }
            return created.stream().map(this::toView).toList();
        } catch (IOException exception) {
            cleanup(storedKeys);
            throw new InvalidExpenseException("The document could not be uploaded.");
        } catch (RuntimeException exception) {
            cleanup(storedKeys);
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public AttachmentDownload download(UUID tripId, UUID expenseId, UUID attachmentId, UUID userId) {
        requireMembership(tripId, userId);
        var attachment = requireAttachment(tripId, expenseId, attachmentId);
        var stored = storage.read(attachment.getStorageKey());
        return new AttachmentDownload(attachment.getOriginalName(), attachment.getContentType(), stored.content(), stored.size());
    }

    @Transactional
    public void delete(UUID tripId, UUID expenseId, UUID attachmentId, UUID userId) {
        var actor = requireMembership(tripId, userId);
        var attachment = requireAttachment(tripId, expenseId, attachmentId);
        var canDelete = actor.getRole() == com.splittrip.trip.domain.TripMemberRole.OWNER
                || attachment.getUploadedBy().getId().equals(userId)
                || attachment.getExpense().getCreatedBy().getId().equals(userId);
        if (!canDelete) throw new TripAccessDeniedException("Only the uploader, expense creator, or trip owner can delete this document.");
        storage.delete(attachment.getStorageKey());
        repository.delete(attachment);
    }

    private AttachmentType inspect(MultipartFile file) throws IOException {
        if (file.isEmpty() || file.getSize() <= 0) throw new InvalidExpenseException("Empty documents cannot be uploaded.");
        if (file.getSize() > MAX_SIZE) throw new InvalidExpenseException("Each document must be 10 MB or smaller.");
        byte[] header;
        try (var input = file.getInputStream()) { header = input.readNBytes(12); }
        if (starts(header, new byte[]{(byte)0xFF,(byte)0xD8,(byte)0xFF})) return new AttachmentType("image/jpeg", "jpg");
        if (starts(header, new byte[]{(byte)0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A})) return new AttachmentType("image/png", "png");
        if (header.length >= 12 && new String(header, 0, 4, StandardCharsets.US_ASCII).equals("RIFF")
                && new String(header, 8, 4, StandardCharsets.US_ASCII).equals("WEBP")) return new AttachmentType("image/webp", "webp");
        if (starts(header, "%PDF-".getBytes(StandardCharsets.US_ASCII))) return new AttachmentType("application/pdf", "pdf");
        throw new InvalidExpenseException("Only JPG, PNG, WebP, and PDF documents are supported.");
    }

    private boolean starts(byte[] value, byte[] prefix) {
        if (value.length < prefix.length) return false;
        for (int index = 0; index < prefix.length; index++) if (value[index] != prefix[index]) return false;
        return true;
    }
    private String safeName(String name) {
        var value = name == null ? "document" : PathLike.name(name).replaceAll("[\\r\\n\\u0000]", "_").trim();
        if (value.isBlank()) value = "document";
        return value.length() > 255 ? value.substring(value.length() - 255) : value;
    }
    private void cleanup(List<String> keys) {
        keys.forEach(key -> { try { storage.delete(key); } catch (RuntimeException ignored) { /* keep original failure */ } });
    }
    private com.splittrip.trip.domain.TripMember requireMembership(UUID tripId, UUID userId) {
        return memberRepository.findActiveMembership(tripId, userId).orElseThrow(TripNotFoundException::new);
    }
    private ExpenseAttachment requireAttachment(UUID tripId, UUID expenseId, UUID attachmentId) {
        return repository.findByIdAndExpenseAndTrip(attachmentId, expenseId, tripId)
                .orElseThrow(() -> new InvalidExpenseException("Document not found."));
    }
    public AttachmentView toView(ExpenseAttachment value) { return new AttachmentView(value.getId(), value.getOriginalName(), value.getContentType(), value.getSizeBytes(), value.getUploadedBy().getDisplayName(), value.getCreatedAt()); }
    private record AttachmentType(String contentType, String extension) {}
    private static final class PathLike { static String name(String value) { return value.replace('\\', '/').substring(value.replace('\\', '/').lastIndexOf('/') + 1); } }
    public record AttachmentView(UUID id, String originalName, String contentType, long sizeBytes, String uploadedByName, java.time.Instant createdAt) {}
    public record AttachmentDownload(String originalName, String contentType, InputStream content, long size) {}
}
