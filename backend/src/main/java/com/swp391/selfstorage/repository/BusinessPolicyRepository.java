package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.BusinessPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BusinessPolicyRepository extends JpaRepository<BusinessPolicy, String> {
}