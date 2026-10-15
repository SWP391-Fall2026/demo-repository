package com.swp391.selfstorage.controller;

import com.swp391.selfstorage.dto.ApiResponse;
import com.swp391.selfstorage.entity.DailyTask;
import com.swp391.selfstorage.entity.SupportTicket;
import com.swp391.selfstorage.service.TaskIncidentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
public class TaskIncidentController {

    private final TaskIncidentService taskIncidentService;

    public TaskIncidentController(TaskIncidentService taskIncidentService) {
        this.taskIncidentService = taskIncidentService;
    }

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<List<DailyTask>>> getDailyTasks() {
        List<DailyTask> list = taskIncidentService.getDailyTasks();
        return ResponseEntity.ok(ApiResponse.list(list.size(), list));
    }

    @PostMapping("/dispatch")
    public ResponseEntity<ApiResponse<DailyTask>> dispatchTask(@RequestBody Map<String, String> body) {
        DailyTask task = taskIncidentService.dispatchTask(
                body.get("title"), body.get("staff"), body.get("deadline")
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(task));
    }

    @GetMapping("/tickets")
    public ResponseEntity<ApiResponse<List<SupportTicket>>> getTickets() {
        List<SupportTicket> list = taskIncidentService.getTickets();
        return ResponseEntity.ok(ApiResponse.list(list.size(), list));
    }

    @PostMapping("/tickets")
    public ResponseEntity<ApiResponse<SupportTicket>> createTicket(@RequestBody Map<String, Object> body) {
        SupportTicket ticket = taskIncidentService.createTicket(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(ticket));
    }

    @PostMapping("/emergency-pin")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateEmergencyPin(@RequestBody Map<String, String> body) {
        Map<String, Object> pinData = taskIncidentService.generateEmergencyPin(body.get("unitCode"));
        return ResponseEntity.ok(ApiResponse.ok(pinData));
    }
}
