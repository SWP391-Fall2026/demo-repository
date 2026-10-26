package com.swp391.selfstorage.modules.facility;

import com.swp391.selfstorage.application.workflow.CreateReservationWorkflow;
import com.swp391.selfstorage.modules.facility.service.FacilityService;
import com.swp391.selfstorage.modules.reservation.service.ReservationHoldPolicy;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest(showSql = false)
@ActiveProfiles("test")
@Import({FacilityService.class, CreateReservationWorkflow.class, ReservationHoldPolicy.class,
    CatalogAvailabilityChecks.TimeConfig.class})
class FacilityCatalogAvailabilityTest extends CatalogAvailabilityChecks {}
