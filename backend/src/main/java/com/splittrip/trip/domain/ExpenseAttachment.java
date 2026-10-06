package com.splittrip.trip.domain;

import java.time.Instant;
import java.util.UUID;

import com.splittrip.user.domain.UserAccount;
import jakarta.persistence.*;

@Entity
@Table(name = "expense_attachment")
public class ExpenseAttachment {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "expense_id") private Expense expense;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "uploaded_by") private UserAccount uploadedBy;
    @Column(name = "original_name", nullable = false, length = 255) private String originalName;
    @Column(name = "storage_key", nullable = false, unique = true, length = 500) private String storageKey;
    @Column(name = "content_type", nullable = false, length = 100) private String contentType;
    @Column(name = "size_bytes", nullable = false) private long sizeBytes;
    @Column(name = "created_at", nullable = false) private Instant createdAt;

    protected ExpenseAttachment() {}
    private ExpenseAttachment(Expense expense, UserAccount uploadedBy, String originalName, String storageKey,
            String contentType, long sizeBytes) {
        id = UUID.randomUUID(); this.expense = expense; this.uploadedBy = uploadedBy; this.originalName = originalName;
        this.storageKey = storageKey; this.contentType = contentType; this.sizeBytes = sizeBytes; createdAt = Instant.now();
    }
    public static ExpenseAttachment create(Expense expense, UserAccount uploadedBy, String originalName,
            String storageKey, String contentType, long sizeBytes) {
        return new ExpenseAttachment(expense, uploadedBy, originalName, storageKey, contentType, sizeBytes);
    }
    public UUID getId() { return id; } public Expense getExpense() { return expense; }
    public UserAccount getUploadedBy() { return uploadedBy; } public String getOriginalName() { return originalName; }
    public String getStorageKey() { return storageKey; } public String getContentType() { return contentType; }
    public long getSizeBytes() { return sizeBytes; } public Instant getCreatedAt() { return createdAt; }
}
