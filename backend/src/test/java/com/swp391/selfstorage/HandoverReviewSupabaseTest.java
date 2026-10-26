package com.swp391.selfstorage;

import static org.junit.jupiter.api.Assertions.*;

import java.sql.*;
import java.util.*;
import javax.sql.DataSource;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;

/** Real PostgreSQL requests with committed synthetic fixtures, exact-scope cleanup after each case. */
@EnabledIfSystemProperty(named = "handover.supabase.enabled", matches = "true")
@SpringBootTest(properties = {
    "spring.jpa.hibernate.ddl-auto=validate", "spring.jpa.generate-ddl=false", "spring.sql.init.mode=never",
    "app.scheduling.enabled=false", "app.auth.schema-reviewed=true",
    "app.upload-dir=target/handover-supabase-test-evidence",
    "spring.datasource.hikari.maximum-pool-size=5", "spring.datasource.hikari.connection-timeout=15000",
    "spring.datasource.hikari.data-source-properties.connectTimeout=10",
    "spring.datasource.hikari.data-source-properties.socketTimeout=20",
    "spring.datasource.hikari.connection-init-sql=SET statement_timeout='15s'",
    "spring.datasource.hikari.data-source-properties.options=-c lock_timeout=5s"
})
@AutoConfigureMockMvc
@ActiveProfiles("auth-supabase")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class HandoverReviewSupabaseTest extends HandoverReviewChecks {
  @Autowired DataSource dataSource;
  @Autowired Environment environment;
  Map<String,String> baseline;

  @BeforeAll
  void captureBaseline() throws Exception {
    verifyTarget();
    try (var c = dataSource.getConnection()) { baseline = HandoverMigration015Test.fingerprints(c); }
  }

  @AfterAll
  void verifyHistoricalDataUnchanged() throws Exception {
    if (baseline == null) return;
    try (var c = dataSource.getConnection()) {
      assertEquals(baseline,HandoverMigration015Test.fingerprints(c),"Historical data changed or fixtures remain");
    }
    java.nio.file.Files.createDirectories(HandoverMigration015Test.OUTPUT);
    HandoverMigration015Test.JSON.writerWithDefaultPrettyPrinter().writeValue(
        HandoverMigration015Test.OUTPUT.resolve("live-data-verification.json").toFile(),
        Map.of("historical_data_unchanged",true,"synthetic_fixture_cleanup_verified",true,
            "data_hashes",baseline,"finished_at_utc",java.time.Instant.now().toString()));
  }

  @Override
  protected void verifyTarget() {
    assertEquals("postgres.xnerbsgbwdpemvnatvuy", environment.getProperty("spring.datasource.username"));
    var uri = java.net.URI.create(environment.getRequiredProperty("spring.datasource.url").replaceFirst("^jdbc:", ""));
    assertEquals("aws-0-ap-northeast-1.pooler.supabase.com",uri.getHost()); assertEquals(5432,uri.getPort());
    assertEquals("/postgres",uri.getPath());
    try (var c = dataSource.getConnection()) { HandoverMigration015Test.target(c); }
    catch (Exception error) { throw new AssertionError("Target verification failed: "+error.getClass().getSimpleName()); }
  }

  @Override
  protected void runDeadlineMonitor() {
    // Do not run a whole-database scheduler with a mocked future clock on shared staging.
    // The real scheduler query and dispatch are covered by the H2 variant of this same case.
    workflow.expire(cid);
  }

  private void execute(Connection c, String statement, String value) throws SQLException {
    try (var s = c.prepareStatement(statement)) { s.setString(1,value); s.executeUpdate(); }
  }

  @AfterEach
  void removeOnlyThisSyntheticFixture() throws Exception {
    if (prefix == null) return;
    assertTrue(prefix.matches("HR[0-9a-f]{8}"),"Invalid fixture cleanup prefix");
    try (var c = dataSource.getConnection()) {
      c.setAutoCommit(false);
      try {
        HandoverMigration015Test.sql(c,"set local lock_timeout='5s'");
        HandoverMigration015Test.sql(c,"set local statement_timeout='20s'");
        // Generated review/refund IDs are located only through this fixture's reservation.
        execute(c,"delete from public.audit_logs where user_id like ?",prefix+"%");
        execute(c,"delete from public.audit_logs where entity_id in (select id from public.handover_reviews where reservation_id=?)",rid);
        execute(c,"delete from public.refund_transactions where refund_request_id in (select id from public.refund_requests where reservation_id=?)",rid);
        execute(c,"delete from public.refund_requests where reservation_id=?",rid);
        execute(c,"delete from public.handover_review_evidence where review_id in (select id from public.handover_reviews where reservation_id=?)",rid);
        execute(c,"delete from public.handover_reviews where reservation_id=?",rid);
        execute(c,"delete from public.handover_records where reservation_id=?",rid);
        execute(c,"delete from public.daily_tasks where reservation_id=?",rid);
        execute(c,"delete from public.payments where reservation_id=?",rid);
        execute(c,"delete from public.invoices where reservation_id=?",rid);
        execute(c,"delete from public.contracts where reservation_id=?",rid);
        execute(c,"update public.units set held_by_reservation_id=null where code=?",uid);
        execute(c,"delete from public.reservations where id=?",rid);
        execute(c,"delete from public.units where code=?",uid);
        execute(c,"delete from public.users where id like ?",prefix+"%");
        execute(c,"delete from public.facilities where code like ?",prefix+"%");
        c.commit();
      } catch (Throwable error) { c.rollback(); throw error; }
      try (var s = c.prepareStatement("""
          select (select count(*) from public.users where id like ?)
               + (select count(*) from public.facilities where code like ?)
               + (select count(*) from public.reservations where id like ?)
               + (select count(*) from public.contracts where id like ?)
               + (select count(*) from public.units where code like ?)
               + (select count(*) from public.handover_reviews where reservation_id like ?)
          """)) {
        for (int i=1;i<=6;i++) s.setString(i,prefix+"%");
        try (var r=s.executeQuery()) { assertTrue(r.next()); assertEquals(0,r.getLong(1),"Synthetic fixtures survived cleanup"); }
      }
    }
  }

  @Override
  protected void recordFixturePrefix() {
    if (prefix == null) return;
    try {
      java.nio.file.Files.createDirectories(HandoverMigration015Test.OUTPUT);
      java.nio.file.Files.writeString(HandoverMigration015Test.OUTPUT.resolve("fixture-prefixes.txt"),prefix+"\n",
          java.nio.file.StandardOpenOption.CREATE,java.nio.file.StandardOpenOption.APPEND);
    } catch (Exception error) { throw new AssertionError("Cannot record fixture cleanup scope"); }
  }
}
