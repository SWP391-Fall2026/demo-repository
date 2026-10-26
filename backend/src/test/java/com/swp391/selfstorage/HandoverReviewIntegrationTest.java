package com.swp391.selfstorage;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:handover_review_test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000",
    "app.upload-dir=target/handover-review-test-evidence"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HandoverReviewIntegrationTest extends HandoverReviewChecks {}
