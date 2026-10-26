package com.swp391.selfstorage.modules.rental.job;

import com.swp391.selfstorage.application.workflow.HandoverReviewWorkflow;
import com.swp391.selfstorage.modules.rental.repository.HandoverRecordRepository;
import java.time.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class HandoverDeadlineJob {
  private static final Logger log = LoggerFactory.getLogger(HandoverDeadlineJob.class);
  private final HandoverRecordRepository records;
  private final HandoverReviewWorkflow workflow;
  private final Clock clock;

  public HandoverDeadlineJob(HandoverRecordRepository records, HandoverReviewWorkflow workflow, Clock clock) {
    this.records = records; this.workflow = workflow; this.clock = clock;
  }

  @Scheduled(fixedDelayString = "${app.handover-monitor-ms:60000}")
  public void monitor() {
    for (var record : records.findByConfirmationDeadlineAtLessThanEqual(LocalDateTime.now(clock))) {
      if (!java.util.Set.of("PENDING_CUSTOMER_CONFIRMATION", "ISSUE_REPORTED").contains(record.getStatus())) continue;
      try { workflow.expire(record.getContractId()); }
      catch (RuntimeException error) { log.warn("Handover deadline review failed for {} ({})", record.getId(), error.getClass().getSimpleName()); }
    }
  }
}
