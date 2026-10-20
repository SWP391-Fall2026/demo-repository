package com.swp391.selfstorage.service;

import com.swp391.selfstorage.entity.Notification;
import com.swp391.selfstorage.entity.Contract;
import com.swp391.selfstorage.entity.User;
import com.swp391.selfstorage.repository.ContractRepository;
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
    private final ContractRepository contractRepository;

    public NotificationService(NotificationRepository repository, UserRepository userRepository, ContractRepository contractRepository) {
        this.repository = repository; this.userRepository = userRepository; this.contractRepository = contractRepository;
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

    @Transactional
    public void sendRenewalReminder(String managerUsername, String contractId) {
        User manager = userRepository.findByUsername(managerUsername)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (!java.util.Set.of("FMANAGER", "FACILITY_MANAGER").contains(manager.getRole()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Facility manager role required");
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));
        if (!java.util.Objects.equals(manager.getFacilityCode(), contract.getFacilityCode()))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found in this facility");
        createOnce(contract.getUserId(), "Nhắc gia hạn hợp đồng", "Hợp đồng " + contract.getId() + " sắp hết hạn. Vui lòng gia hạn hoặc gửi yêu cầu trả kho.", "RENEWAL_REMINDER", contract.getId() + ":" + contract.getEndDate());
    }
}
