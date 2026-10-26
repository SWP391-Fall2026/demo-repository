package com.swp391.selfstorage.modules.facility;

import static org.junit.jupiter.api.Assertions.assertTrue;

import com.swp391.selfstorage.application.workflow.CreateReservationWorkflow;
import com.swp391.selfstorage.modules.facility.service.FacilityService;
import com.swp391.selfstorage.modules.reservation.service.ReservationHoldPolicy;
import java.sql.Connection;
import javax.sql.DataSource;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.transaction.AfterTransaction;

/** Opt-in staging checks; each synthetic fixture transaction is rolled back by Spring Test. */
@EnabledIfSystemProperty(named = "catalog.supabase.enabled", matches = "true")
@DataJpaTest(showSql = false, properties = {
    "spring.jpa.hibernate.ddl-auto=validate",
    "spring.jpa.generate-ddl=false",
    "spring.sql.init.mode=never",
    "app.scheduling.enabled=false",
    "spring.datasource.hikari.connection-timeout=15000"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("auth-supabase")
@Import({FacilityService.class, CreateReservationWorkflow.class, ReservationHoldPolicy.class,
    CatalogAvailabilityChecks.TimeConfig.class})
class FacilityCatalogSupabaseTest extends CatalogAvailabilityChecks {
  @Autowired DataSource dataSource;
  @Autowired Environment environment;

  @Override
  protected void verifyDatabaseTarget() {
    String url = environment.getProperty("spring.datasource.url", "");
    assertTrue(url.startsWith("jdbc:postgresql://aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"),
        "Only the documented staging Session pooler is allowed");
    assertTrue("postgres.xnerbsgbwdpemvnatvuy".equals(environment.getProperty("spring.datasource.username")),
        "Only the documented staging project is allowed");
    Connection connection = DataSourceUtils.getConnection(dataSource);
    try (var statement = connection.createStatement()) {
      statement.execute("set local lock_timeout='3s'");
      statement.execute("set local statement_timeout='15s'");
      try (var result = statement.executeQuery("select current_database(), current_schema(), current_user")) {
        assertTrue(result.next() && "postgres".equals(result.getString(1))
            && "public".equals(result.getString(2)) && "postgres".equals(result.getString(3)),
            "Unexpected staging database, schema or role");
      }
    } catch (java.sql.SQLException error) {
      throw new AssertionError("Staging target check failed; SQLSTATE=" + error.getSQLState());
    } finally {
      DataSourceUtils.releaseConnection(connection, dataSource);
    }
  }

  @AfterTransaction
  void verifyFixtureRollback() throws Exception {
    try (var connection = dataSource.getConnection(); var statement = connection.prepareStatement("""
        select (select count(*) from public.facilities where code like ?)
             + (select count(*) from public.units where code like ?)
             + (select count(*) from public.reservations where id like ?)
             + (select count(*) from public.users where id like ?)
        """)) {
      for (int index = 1; index <= 4; index++) statement.setString(index, PREFIX + "%");
      try (var result = statement.executeQuery()) {
        assertTrue(result.next() && result.getLong(1) == 0, "Synthetic fixtures must not survive rollback");
      }
    }
  }
}
