package com.splittrip.trip.infrastructure;

import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import com.splittrip.trip.domain.Expense;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    @Query("select distinct expense from Expense expense join fetch expense.paidBy join fetch expense.createdBy left join fetch expense.shares share left join fetch share.user where expense.trip.id = :tripId order by expense.expenseDate desc, expense.createdAt desc")
    List<Expense> findByTripIdWithShares(@Param("tripId") UUID tripId);
    @Query("select distinct expense from Expense expense join fetch expense.paidBy join fetch expense.createdBy left join fetch expense.shares share left join fetch share.user where expense.id = :id and expense.trip.id = :tripId")
    Optional<Expense> findByIdAndTripIdWithShares(@Param("id") UUID id, @Param("tripId") UUID tripId);
}
