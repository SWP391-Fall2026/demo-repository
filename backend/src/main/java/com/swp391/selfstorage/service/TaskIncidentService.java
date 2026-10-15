package com.swp391.selfstorage.service;

import com.swp391.selfstorage.entity.DailyTask;
import com.swp391.selfstorage.entity.SupportTicket;
import com.swp391.selfstorage.repository.DailyTaskRepository;
import com.swp391.selfstorage.repository.SupportTicketRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class TaskIncidentService {

    private final DailyTaskRepository dailyTaskRepository;
    private final SupportTicketRepository supportTicketRepository;

    public TaskIncidentService(DailyTaskRepository dailyTaskRepository, SupportTicketRepository supportTicketRepository) {
        this.dailyTaskRepository = dailyTaskRepository;
        this.supportTicketRepository = supportTicketRepository;
    }

    public List<DailyTask> getDailyTasks() {
        return dailyTaskRepository.findAll();
    }

    public DailyTask dispatchTask(String title, String staff, String deadline) {
        DailyTask task = new DailyTask();
        task.setId("TSK-" + (100 + (int)(Math.random() * 900)));
        task.setTitle(title != null ? title : "Nhiệm vụ mới");
        task.setStaff(staff != null ? staff : "Nguyễn Văn Tuấn");
        task.setDeadline(deadline != null ? deadline : "17:00");
        task.setStatus("PENDING");
        return dailyTaskRepository.save(task);
    }

    public List<SupportTicket> getTickets() {
        return supportTicketRepository.findAll();
    }

    public SupportTicket createTicket(Map<String, Object> data) {
        SupportTicket ticket = new SupportTicket();
        ticket.setId("TK-" + (116 + (int)(Math.random() * 50)));
        ticket.setUnitCode((String) data.getOrDefault("unitCode", "A-102"));
        ticket.setCustomerName((String) data.getOrDefault("customer", "Trần Văn Bảo"));
        ticket.setTitle((String) data.getOrDefault("title", "Yêu cầu hỗ trợ sự cố"));
        ticket.setPriority((String) data.getOrDefault("priority", "NORMAL"));
        ticket.setStatus("IN_PROGRESS");
        ticket.setStaffAssigned("Nguyễn Văn Tuấn");
        ticket.setNotes("Đã phân công nhân viên ca trực tiếp nhận.");
        ticket.setCreatedAt(LocalDateTime.now());
        return supportTicketRepository.save(ticket);
    }

    public Map<String, Object> generateEmergencyPin(String unitCode) {
        String tempPin = String.valueOf((int)(100000 + Math.random() * 900000));
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("unitCode", unitCode);
        res.put("tempPin", tempPin);
        res.put("expiresInMinutes", 60);
        res.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")));
        return res;
    }
}
