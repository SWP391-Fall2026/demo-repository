package com.swp391.selfstorage.service;

import com.swp391.selfstorage.entity.DailyTask;
import com.swp391.selfstorage.entity.Contract;
import com.swp391.selfstorage.entity.SupportTicket;
import com.swp391.selfstorage.entity.Unit;
import com.swp391.selfstorage.entity.User;
import com.swp391.selfstorage.repository.DailyTaskRepository;
import com.swp391.selfstorage.repository.ContractRepository;
import com.swp391.selfstorage.repository.SupportTicketRepository;
import com.swp391.selfstorage.repository.UnitRepository;
import com.swp391.selfstorage.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class TaskIncidentService {

    private final DailyTaskRepository dailyTaskRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;
    private final UnitRepository unitRepository;
    private final ContractRepository contractRepository;

    public TaskIncidentService(DailyTaskRepository dailyTaskRepository,
            SupportTicketRepository supportTicketRepository, UserRepository userRepository,
            UnitRepository unitRepository) {
        this(dailyTaskRepository, supportTicketRepository, userRepository, unitRepository, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public TaskIncidentService(DailyTaskRepository dailyTaskRepository,
            SupportTicketRepository supportTicketRepository, UserRepository userRepository,
            UnitRepository unitRepository, ContractRepository contractRepository) {
        this.dailyTaskRepository = dailyTaskRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.userRepository = userRepository;
        this.unitRepository = unitRepository;
        this.contractRepository = contractRepository;
    }

    @Scheduled(fixedDelayString = "${app.support.auto-close-check-ms:3600000}")
    @Transactional
    public void closeStaleResolvedTickets() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);
        supportTicketRepository.findByStatusAndResolvedAtBefore("RESOLVED", cutoff)
                .forEach(ticket -> ticket.setStatus("CLOSED"));
    }

    public List<DailyTask> getDailyTasks(String username, LocalDate date) {
        User actor = requireUser(username);
        LocalDate taskDate = date == null ? LocalDate.now() : date;
        if ("STAFF".equals(actor.getRole())) {
            return dailyTaskRepository.findByFacilityCodeAndStaffIdAndDueDateOrderByDeadlineAsc(
                    actor.getFacilityCode(), actor.getId(), taskDate);
        }
        requireManager(actor);
        return dailyTaskRepository.findByFacilityCodeAndDueDateOrderByDeadlineAsc(
                actor.getFacilityCode(), taskDate);
    }

    @Transactional
    public DailyTask dispatchTask(String managerUsername, Map<String, String> data) {
        User manager = requireManager(requireUser(managerUsername));
        String title = requireText(data.get("title"), "Task title is required");
        User staff = resolveStaff(manager.getFacilityCode(), data.get("staffId"), data.get("staff"));
        String unitCode = blankToNull(data.get("unitCode"));
        if (unitCode != null) {
            Unit unit = unitRepository.findById(unitCode)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unit not found"));
            if (!manager.getFacilityCode().equals(unit.getFacilityCode())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unit belongs to another facility");
            }
        }

        DailyTask task = new DailyTask();
        task.setId("TSK-" + UUID.randomUUID());
        task.setTitle(title);
        task.setStaff(staff.getName());
        task.setStaffId(staff.getId());
        task.setFacilityCode(manager.getFacilityCode());
        task.setTaskType(normalizeTaskType(data.get("taskType"), title));
        task.setUnitCode(unitCode);
        task.setReservationId(blankToNull(data.get("reservationId")));
        task.setContractId(blankToNull(data.get("contractId")));
        task.setDueDate(parseDate(data.get("date")));
        task.setDeadline(blankToNull(data.get("deadline")) == null ? "17:00" : data.get("deadline"));
        task.setStatus("PENDING");
        return dailyTaskRepository.save(task);
    }

    @Transactional
    public DailyTask updateTaskProgress(String username, String taskId, String newStatus) {
        User actor = requireUser(username);
        String status = requireText(newStatus, "Task status is required").toUpperCase(Locale.ROOT);
        if (!List.of("PENDING", "IN_PROGRESS", "COMPLETED").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported task status");
        }
        DailyTask task;
        if ("STAFF".equals(actor.getRole())) {
            task = dailyTaskRepository.findByIdAndFacilityCodeAndStaffId(
                            taskId, actor.getFacilityCode(), actor.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        } else {
            requireManager(actor);
            task = dailyTaskRepository.findByIdAndFacilityCode(taskId, actor.getFacilityCode())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        }
        boolean validTransition = ("PENDING".equals(task.getStatus()) && "IN_PROGRESS".equals(status))
                || ("IN_PROGRESS".equals(task.getStatus()) && "COMPLETED".equals(status));
        if (!validTransition && !status.equals(task.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invalid task status transition");
        }
        task.setStatus(status);
        return dailyTaskRepository.save(task);
    }

    @Transactional
    public DailyTask createSystemTask(String facilityCode, String title, String taskType,
            String unitCode, String reservationId, String contractId, LocalDate dueDate) {
        User staff = userRepository.findByFacilityCodeAndRoleAndStatus(facilityCode, "STAFF", "ACTIVE")
                .stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        "No active staff member is assigned to this facility"));
        DailyTask task = new DailyTask();
        task.setId("TSK-" + UUID.randomUUID());
        task.setTitle(title);
        task.setStaff(staff.getName());
        task.setStaffId(staff.getId());
        task.setFacilityCode(facilityCode);
        task.setTaskType(taskType);
        task.setUnitCode(unitCode);
        task.setReservationId(reservationId);
        task.setContractId(contractId);
        task.setDueDate(dueDate == null ? LocalDate.now() : dueDate);
        task.setDeadline("17:00");
        task.setStatus("PENDING");
        return dailyTaskRepository.save(task);
    }

    @Transactional
    public void completeReferenceTasks(String reservationId, String contractId) {
        List<DailyTask> tasks = new ArrayList<>();
        if (reservationId != null) {
            tasks.addAll(dailyTaskRepository.findByReservationIdAndStatus(reservationId, "PENDING"));
            tasks.addAll(dailyTaskRepository.findByReservationIdAndStatus(reservationId, "IN_PROGRESS"));
        }
        if (contractId != null) {
            tasks.addAll(dailyTaskRepository.findByContractIdAndStatus(contractId, "PENDING"));
            tasks.addAll(dailyTaskRepository.findByContractIdAndStatus(contractId, "IN_PROGRESS"));
        }
        tasks.forEach(task -> task.setStatus("COMPLETED"));
        dailyTaskRepository.saveAll(tasks);
    }

    public List<SupportTicket> getTickets() {
        return supportTicketRepository.findAll();
    }

    public List<SupportTicket> getTickets(String username) {
        User actor = requireUser(username);
        if ("CUSTOMER".equals(actor.getRole())) {
            return supportTicketRepository.findByUserIdOrderByCreatedAtDesc(actor.getId());
        }
        if (Set.of("STAFF", "FMANAGER", "FACILITY_MANAGER").contains(actor.getRole())) {
            return supportTicketRepository.findByFacilityCodeOrderByCreatedAtDesc(actor.getFacilityCode());
        }
        if (Set.of("OPS_MGR", "OPS_MANAGER", "ADMIN", "SYSTEM_ADMIN").contains(actor.getRole())) {
            return supportTicketRepository.findAll();
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Role cannot view support tickets");
    }

    @Transactional
    public SupportTicket createTicket(String username, Map<String, Object> data) {
        User customer = requireUser(username);
        if (!"CUSTOMER".equals(customer.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Customer role required");
        }
        String unitCode = requireText(Objects.toString(data.get("unitCode"), null), "unitCode is required");
        Contract contract = contractRepository == null ? null : contractRepository.findByUnitCode(unitCode).orElse(null);
        if (contract == null || !customer.getId().equals(contract.getUserId())
                || !Set.of("ACTIVE", "EXPIRING_SOON", "OVERDUE").contains(contract.getStatus())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Active rented unit not found");
        }
        String category = requireText(firstText(data.get("category"), data.get("title")),
                "Ticket category is required");
        String description = requireText(firstText(data.get("description"), data.get("desc")),
                "Ticket description is required");
        String priority = Objects.toString(data.getOrDefault("priority", "NORMAL"), "NORMAL").toUpperCase(Locale.ROOT);
        if (!Set.of("NORMAL", "HIGH", "URGENT").contains(priority)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported ticket priority");
        }
        SupportTicket ticket = new SupportTicket();
        ticket.setId("TK-" + UUID.randomUUID());
        ticket.setUserId(customer.getId());
        ticket.setFacilityCode(contract.getFacilityCode());
        ticket.setUnitCode(unitCode);
        ticket.setCustomerName(customer.getName());
        ticket.setTitle(category);
        ticket.setCategory(category);
        ticket.setDescription(description);
        ticket.setAttachmentUrl(blankToNull(Objects.toString(data.get("attachmentUrl"), null)));
        ticket.setPriority(priority);
        ticket.setStatus("OPEN");
        User assigned = userRepository.findByFacilityCodeAndRoleAndStatus(
                contract.getFacilityCode(), "STAFF", "ACTIVE").stream().findFirst().orElse(null);
        ticket.setStaffAssigned(assigned == null ? null : assigned.getName());
        ticket.setCreatedAt(LocalDateTime.now());
        SupportTicket saved = supportTicketRepository.save(ticket);
        if (assigned != null) {
            DailyTask task = new DailyTask();
            task.setId("TSK-" + UUID.randomUUID());
            task.setTitle("Support ticket " + saved.getId() + ": " + category);
            task.setStaff(assigned.getName());
            task.setStaffId(assigned.getId());
            task.setFacilityCode(contract.getFacilityCode());
            task.setTaskType("SUPPORT");
            task.setUnitCode(unitCode);
            task.setDueDate(LocalDate.now());
            task.setDeadline("17:00");
            task.setStatus("PENDING");
            dailyTaskRepository.save(task);
        }
        return saved;
    }

    public SupportTicket createTicket(Map<String, Object> data) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated customer is required");
    }

    @Transactional
    public SupportTicket updateTicket(String username, String ticketId, Map<String, Object> data) {
        User actor = requireUser(username);
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        boolean customer = "CUSTOMER".equals(actor.getRole());
        boolean staff = Set.of("STAFF", "FMANAGER", "FACILITY_MANAGER").contains(actor.getRole());
        if (customer && !actor.getId().equals(ticket.getUserId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found");
        }
        if (staff && !Objects.equals(actor.getFacilityCode(), ticket.getFacilityCode())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found in this facility");
        }
        if (!customer && !staff) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Role cannot update tickets");
        String requested = Objects.toString(data.get("status"), null);
        if (requested != null) {
            String status = requested.toUpperCase(Locale.ROOT);
            if (customer && !"CLOSED".equals(status)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Customer can only close resolved tickets");
            }
            if (customer && !"RESOLVED".equals(ticket.getStatus())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Ticket must be resolved before closing");
            }
            if (staff && !Set.of("IN_PROGRESS", "RESOLVED").contains(status)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported staff ticket status");
            }
            if (staff && "OPEN".equals(ticket.getStatus()) && !"IN_PROGRESS".equals(status)
                    || staff && "IN_PROGRESS".equals(ticket.getStatus()) && !"RESOLVED".equals(status)
                    || staff && Set.of("RESOLVED", "CLOSED").contains(ticket.getStatus())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Invalid ticket status transition");
            }
            ticket.setStatus(status);
            if ("RESOLVED".equals(status)) ticket.setResolvedAt(LocalDateTime.now());
        }
        if (data.containsKey("notes") && staff) ticket.setNotes(Objects.toString(data.get("notes"), null));
        if (data.containsKey("rating") && customer) {
            int rating;
            try { rating = Integer.parseInt(data.get("rating").toString()); }
            catch (RuntimeException exception) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be 1-5"); }
            if (rating < 1 || rating > 5) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be 1-5");
            ticket.setRating(rating);
        }
        if (data.containsKey("feedback") && customer) ticket.setFeedback(Objects.toString(data.get("feedback"), null));
        return supportTicketRepository.save(ticket);
    }

    @Transactional
    public Map<String, Object> generateEmergencyPin(String username, String unitCode) {
        User staff = requireUser(username);
        if (!Set.of("STAFF", "FMANAGER", "FACILITY_MANAGER").contains(staff.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Facility staff role required");
        }
        Unit unit = unitRepository.findById(unitCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unit not found"));
        if (!Objects.equals(staff.getFacilityCode(), unit.getFacilityCode())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unit not found in this facility");
        }
        String tempPin = String.valueOf((int)(100000 + Math.random() * 900000));
        unit.setTemporaryPin(tempPin);
        unit.setTemporaryPinExpiresAt(LocalDateTime.now().plusMinutes(60));
        unitRepository.save(unit);
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("unitCode", unitCode);
        res.put("tempPin", tempPin);
        res.put("expiresInMinutes", 60);
        res.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")));
        return res;
    }

    public Map<String, Object> generateEmergencyPin(String unitCode) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated staff is required");
    }

    private User requireUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    private User requireManager(User user) {
        if (!List.of("FMANAGER", "FACILITY_MANAGER").contains(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Facility manager role required");
        }
        if (user.getFacilityCode() == null || user.getFacilityCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User has no facility scope");
        }
        return user;
    }

    private User resolveStaff(String facilityCode, String staffId, String staffName) {
        List<User> staff = userRepository.findByFacilityCodeAndRoleAndStatus(facilityCode, "STAFF", "ACTIVE");
        return staff.stream()
                .filter(user -> user.getId().equals(staffId)
                        || user.getUsername().equalsIgnoreCase(staffId == null ? "" : staffId)
                        || user.getName().equalsIgnoreCase(staffName == null ? "" : staffName))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Staff must be active and assigned to this facility"));
    }

    private static String normalizeTaskType(String requestedType, String title) {
        if (requestedType != null && !requestedType.isBlank()) {
            String value = requestedType.toUpperCase(Locale.ROOT);
            if (List.of("CHECKIN", "RETURN", "SUPPORT", "MAINTENANCE").contains(value)) {
                return value;
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported task type");
        }
        String value = title.toLowerCase(Locale.ROOT);
        if (value.contains("bàn giao") || value.contains("check-in") || value.contains("checkin")) return "CHECKIN";
        if (value.contains("nghiệm thu") || value.contains("trả kho") || value.contains("return")) return "RETURN";
        if (value.contains("sửa") || value.contains("bảo trì") || value.contains("vệ sinh")) return "MAINTENANCE";
        return "SUPPORT";
    }

    private static LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return LocalDate.now();
        try {
            return LocalDate.parse(value);
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "date must use yyyy-MM-dd format");
        }
    }

    private static String requireText(String value, String message) {
        if (value == null || value.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        return value.trim();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String firstText(Object primary, Object fallback) {
        String value = primary == null ? null : primary.toString();
        if (value == null || value.isBlank()) value = fallback == null ? null : fallback.toString();
        return value;
    }
}
