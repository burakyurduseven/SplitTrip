package com.splittrip.trip.infrastructure;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.splittrip.trip.domain.ExpenseAttachment;

public interface ExpenseAttachmentRepository extends JpaRepository<ExpenseAttachment, UUID> {
    @Query("select attachment from ExpenseAttachment attachment join fetch attachment.uploadedBy where attachment.expense.trip.id = :tripId order by attachment.createdAt")
    List<ExpenseAttachment> findByTripId(@Param("tripId") UUID tripId);
    @Query("select attachment from ExpenseAttachment attachment join fetch attachment.expense expense join fetch attachment.uploadedBy where attachment.id = :id and expense.id = :expenseId and expense.trip.id = :tripId")
    Optional<ExpenseAttachment> findByIdAndExpenseAndTrip(@Param("id") UUID id, @Param("expenseId") UUID expenseId, @Param("tripId") UUID tripId);
    List<ExpenseAttachment> findByExpenseId(UUID expenseId);
}
