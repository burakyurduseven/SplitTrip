package com.splittrip.trip.infrastructure;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.splittrip.trip.domain.Trip;

public interface TripRepository extends JpaRepository<Trip, UUID> {
}
