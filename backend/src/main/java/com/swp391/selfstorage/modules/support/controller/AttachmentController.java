package com.swp391.selfstorage.modules.support.controller;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.storage.AttachmentStorage;
import java.nio.file.Files;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
public class AttachmentController {
  private final AttachmentStorage storage;
  private final ActorContext actor;
  private final com.swp391.selfstorage.modules.support.repository.SupportTicketRepository tickets;

  public AttachmentController(AttachmentStorage storage, ActorContext actor,
      com.swp391.selfstorage.modules.support.repository.SupportTicketRepository tickets) {
    this.storage = storage; this.actor = actor;
    this.tickets = tickets;
  }

  @GetMapping("/api/files/{key:.+}")
  public ResponseEntity<?> download(@PathVariable String key) {
    var user = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    var linked = tickets.findByAttachmentUrl("/api/files/" + key);
    if (linked.stream().noneMatch(ticket -> actor.visible(user, ticket.getUserId(), ticket.getFacilityCode())))
      throw com.swp391.selfstorage.common.web.Inputs.missing();
    var file = storage.resolve(key);
    if (!Files.isRegularFile(file)) return ResponseEntity.notFound().build();
    try {
      String contentType = Files.probeContentType(file);
      return ResponseEntity.ok()
          .contentType(MediaType.parseMediaType(contentType == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : contentType))
          .body(new FileSystemResource(file));
    } catch (Exception e) {
      return ResponseEntity.internalServerError().build();
    }
  }
}
