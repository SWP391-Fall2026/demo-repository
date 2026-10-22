package com.swp391.selfstorage.modules.policy.repository;

import com.swp391.selfstorage.modules.policy.entity.BusinessPolicy;
import jakarta.persistence.LockModeType;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface BusinessPolicyRepository
  extends JpaRepository<BusinessPolicy, String> {}
