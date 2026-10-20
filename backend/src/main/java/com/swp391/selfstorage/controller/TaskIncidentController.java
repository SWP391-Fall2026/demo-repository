package com.swp391.selfstorage.controller;

import com.swp391.selfstorage.dto.ApiResponse;
import com.swp391.selfstorage.entity.DailyTask;
import com.swp391.selfstorage.entity.SupportTicket;
import com.swp391.selfstorage.service.TaskIncidentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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
    @PreAuthorize("hasAnyRole('STAFF', 'FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<List<DailyTask>>> getDailyTasks(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(required = false) LocalDate date) {
        List<DailyTask> list = taskIncidentService.getDailyTasks(principal.getUsername(), date);
        return ResponseEntity.ok(ApiResponse.list(list.size(), list));
    }

    @PostMapping("/dispatch")
    @PreAuthorize("hasAnyRole('FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<DailyTask>> dispatchTask(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, String> body) {
        DailyTask task = taskIncidentService.dispatchTask(principal.getUsername(), body);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(task));
    }

    @PatchMapping("/{taskId}/status")
    @PreAuthorize("hasAnyRole('STAFF', 'FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<DailyTask>> updateTaskStatus(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String taskId,
            @RequestBody Map<String, String> body) {
        DailyTask task = taskIncidentService.updateTaskProgress(
                principal.getUsername(), taskId, body.get("status"));
        return ResponseEntity.ok(ApiResponse.ok(task));
    }

    @GetMapping("/tickets")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<List<SupportTicket>>> getTickets(
            @AuthenticationPrincipal UserDetails principal) {
        List<SupportTicket> list = taskIncidentService.getTickets(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.list(list.size(), list));
    }

    @PostMapping("/tickets")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<SupportTicket>> createTicket(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Object> body) {
        SupportTicket ticket = taskIncidentService.createTicket(principal.getUsername(), body);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(ticket));
    }

    @PatchMapping("/tickets/{ticketId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<SupportTicket>> updateTicket(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String ticketId,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok(
                taskIncidentService.updateTicket(principal.getUsername(), ticketId, body)));
    }

    @PostMapping("/emergency-pin")
    @PreAuthorize("hasAnyRole('STAFF', 'FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateEmergencyPin(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, String> body) {
        Map<String, Object> pinData = taskIncidentService.generateEmergencyPin(
                principal.getUsername(), body.get("unitCode"));
        return ResponseEntity.ok(ApiResponse.ok(pinData));
    }

    @PostMapping("/incidents")
    @PreAuthorize("hasAnyRole('STAFF', 'FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<DailyTask>> createIncident(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(taskIncidentService.createIncident(principal.getUsername(), body)));
    }
}
