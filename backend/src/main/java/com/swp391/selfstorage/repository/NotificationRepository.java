package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.Notification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<Notification> findByUserIdAndTypeAndReferenceId(String userId, String type, String referenceId);
}
