package com.swp391.selfstorage.modules.rental.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContractService {

  private final ContractRepository contracts;
  private final ActorContext actor;

  public ContractService(ContractRepository c, ActorContext a) {
    contracts = c;
    actor = a;
  }

  public List<Contract> list() {
    var u = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    return contracts
      .findAll()
      .stream()
      .filter(c -> actor.visible(u, c.getUserId(), c.getFacilityCode()))
      .toList();
  }
}
