package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, String> {
	Optional<Facility> findByNameIgnoreCase(String name);
}
