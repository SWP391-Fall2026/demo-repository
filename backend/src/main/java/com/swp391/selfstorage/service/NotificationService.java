package com.swp391.selfstorage.service;

import com.swp391.selfstorage.entity.Notification;
import com.swp391.selfstorage.repository.NotificationRepository;
import com.swp391.selfstorage.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NotificationService {
    private final NotificationRepository repository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository repository, UserRepository userRepository) {
        this.repository = repository; this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Notification> forUsername(String username) {
        String userId = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found")).getId();
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void createOnce(String userId, String title, String message, String type, String referenceId) {
        if (userId == null || userId.isBlank()) return;
        if (repository.findByUserIdAndTypeAndReferenceId(userId, type, referenceId).isEmpty()) {
            repository.save(new Notification(userId, title, message, type, referenceId));
        }
    }

    @Transactional
    public void markRead(String username, String id) {
        String userId = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found")).getId();
        Notification notification = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!userId.equals(notification.getUserId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Notification access denied");
        notification.setRead(true); repository.save(notification);
    }
}
