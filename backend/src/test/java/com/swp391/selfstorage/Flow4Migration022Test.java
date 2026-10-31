package com.swp391.selfstorage;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.*;
import java.security.MessageDigest;
import java.sql.*;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor;
import org.springframework.core.env.*;

@EnabledIfSystemProperty(named = "flow4.migration.mode", matches = "inspect|rehearsal|apply")
class Flow4Migration022Test {

  static final String HOST = "aws-0-ap-northeast-1.pooler.supabase.com";
  static final String LOGIN_USER = "postgres.xnerbsgbwdpemvnatvuy";
  static final Path WORKING_DIRECTORY = Path.of("").toAbsolutePath().normalize();
  static final Path ROOT = Files.exists(WORKING_DIRECTORY.resolve("database/migrations"))
    ? WORKING_DIRECTORY
    : WORKING_DIRECTORY.getParent();
  static final Path MIGRATION = ROOT.resolve("database/migrations/022_flow4_policy_reporting.sql");
  static final Path OUTPUT = ROOT.resolve("artifacts/flow4-migration-022");
  static final ObjectMapper JSON = new ObjectMapper();
  static final Map<String, Set<String>> ADDED_COLUMNS = Map.of(
    "facilities", Set.of("total_area_sqm"),
    "reservations", Set.of(
      "reservation_expires_at",
      "reservation_hold_days_snapshot",
      "refund_cancel_hours_snapshot"
    ),
    "inspection_records", Set.of("completed_at")
  );

  static String sha256(String value) throws Exception {
    return HexFormat.of().formatHex(
      MessageDigest.getInstance("SHA-256").digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8))
    );
  }

  static ConfigurableEnvironment environment() {
    var env = new StandardEnvironment();
    env.getPropertySources().addFirst(new MapPropertySource("migration-scope", Map.of(
      "spring.profiles.active", "auth-supabase",
      "spring.main.banner-mode", "off",
      "app.scheduling.enabled", "false"
    )));
    ConfigDataEnvironmentPostProcessor.applyTo(env);
    String url = env.getRequiredProperty("spring.datasource.url");
    var uri = java.net.URI.create(url.replaceFirst("^jdbc:", ""));
    assertEquals("postgresql", uri.getScheme());
    assertEquals(HOST, uri.getHost());
    assertEquals(5432, uri.getPort());
    assertEquals("/postgres", uri.getPath());
    assertEquals(LOGIN_USER, env.getRequiredProperty("spring.datasource.username"));
    assertEquals("validate", env.getProperty("spring.jpa.hibernate.ddl-auto"));
    assertEquals("false", env.getProperty("app.scheduling.enabled"));
    return env;
  }

  static Connection connect(ConfigurableEnvironment env) throws Exception {
    var properties = new Properties();
    properties.setProperty("user", env.getRequiredProperty("spring.datasource.username"));
    properties.setProperty("password", env.getRequiredProperty("spring.datasource.password"));
    properties.setProperty("sslmode", "require");
    properties.setProperty("connectTimeout", "15");
    properties.setProperty("socketTimeout", "60");
    properties.setProperty("ApplicationName", "storage-rental-flow4-migration-022");
    return DriverManager.getConnection(env.getRequiredProperty("spring.datasource.url"), properties);
  }

  static String scalar(Connection connection, String query) throws SQLException {
    try (var statement = connection.createStatement(); var result = statement.executeQuery(query)) {
      assertTrue(result.next());
      return result.getString(1);
    }
  }

  static void execute(Connection connection, String query) throws SQLException {
    try (var statement = connection.createStatement()) {
      statement.execute(query);
    }
  }

  static void verifyTarget(Connection connection) throws SQLException {
    assertEquals(
      "postgres|public|postgres",
      scalar(connection, "select current_database()||'|'||current_schema()||'|'||current_user")
    );
    assertTrue(Integer.parseInt(scalar(connection, "show server_version_num")) >= 170000);
    assertEquals("true", scalar(connection, "select pg_try_advisory_xact_lock(391,20261022)::text"));
  }

  static Map<String, String> catalog(Connection connection) throws SQLException {
    var result = new TreeMap<String, String>();
    try (var statement = connection.createStatement(); var rows = statement.executeQuery("""
        select table_name,column_name,data_type,coalesce(character_maximum_length,0),
               coalesce(numeric_precision,0),coalesce(numeric_scale,0),is_nullable
        from information_schema.columns
        where table_schema='public' and table_name in ('facilities','reservations','inspection_records')
        order by table_name,column_name
        """)) {
      while (rows.next()) {
        String table = rows.getString(1);
        String column = rows.getString(2);
        result.put(table + "." + column, String.join("|",
          rows.getString(3),
          rows.getString(4),
          rows.getString(5),
          rows.getString(6),
          rows.getString(7)
        ));
      }
    }
    return result;
  }

  static Map<String, String> dataHashes(Connection connection) throws SQLException {
    var result = new TreeMap<String, String>();
    for (String table : ADDED_COLUMNS.keySet()) {
      String json = "to_jsonb(t)";
      for (String column : ADDED_COLUMNS.get(table)) json += "-'" + column + "'";
      String query = "select count(*)::text||':'||md5(coalesce(string_agg(row_hash,'' order by row_hash),'')) "
        + "from (select md5((" + json + ")::text) row_hash from public." + table + " t) q";
      result.put(table, scalar(connection, query));
    }
    return result;
  }

  static Map<String, String> rowCounts(Connection connection) throws SQLException {
    var result = new TreeMap<String, String>();
    for (String table : ADDED_COLUMNS.keySet()) {
      result.put(table, scalar(connection, "select count(*)::text from public." + table));
    }
    return result;
  }

  static void assertAdditions(Connection connection) throws SQLException {
    var columns = catalog(connection);
    assertEquals("numeric|0|12|2|YES", columns.get("facilities.total_area_sqm"));
    assertEquals(
      "timestamp without time zone|0|0|0|YES",
      columns.get("reservations.reservation_expires_at")
    );
    assertEquals("integer|0|32|0|YES", columns.get("reservations.reservation_hold_days_snapshot"));
    assertEquals("integer|0|32|0|YES", columns.get("reservations.refund_cancel_hours_snapshot"));
    assertEquals(
      "timestamp without time zone|0|0|0|YES",
      columns.get("inspection_records.completed_at")
    );
    assertEquals("0", scalar(connection,
      "select count(*)::text from public.reservations where refund_cancel_hours_snapshot is null"));
    assertEquals("0", scalar(connection,
      "select count(*)::text from public.reservations where refund_cancel_hours_snapshot <> 24"));
  }

  static void assertNoPartialMigration(Map<String, String> baseline) {
    for (var entry : ADDED_COLUMNS.entrySet()) {
      for (String column : entry.getValue()) {
        assertFalse(
          baseline.containsKey(entry.getKey() + "." + column),
          "Migration is already partially or fully applied: " + entry.getKey() + "." + column
        );
      }
    }
  }

  static void lockTables(Connection connection) throws SQLException {
    execute(connection, """
      lock table public.facilities,public.reservations,public.inspection_records
      in access exclusive mode
      """);
  }

  @Test
  void explicitMigration() throws Exception {
    String mode = System.getProperty("flow4.migration.mode");
    Files.createDirectories(OUTPUT);
    String script = Files.readString(MIGRATION);
    String migrationHash = sha256(script);
    var report = new LinkedHashMap<String, Object>();
    report.put("mode", mode);
    report.put("migration_sha256", migrationHash);
    report.put("started_at_utc", Instant.now().toString());
    report.put("target_project", "xnerbsgbwdpemvnatvuy");
    boolean committed = false;

    try (var connection = connect(environment())) {
      connection.setAutoCommit(false);
      try {
        execute(connection, "set local search_path=public,pg_catalog");
        execute(connection, "set local time zone 'UTC'");
        execute(connection, "set local lock_timeout='5s'");
        execute(connection, "set local statement_timeout='45s'");
        execute(connection, "set local idle_in_transaction_session_timeout='120s'");
        verifyTarget(connection);

        var baselineCatalog = catalog(connection);
        var baselineHashes = dataHashes(connection);
        var baselineCounts = rowCounts(connection);
        report.put("baseline_catalog", baselineCatalog);
        report.put("baseline_data_hashes_excluding_new_columns", baselineHashes);
        report.put("baseline_row_counts", baselineCounts);

        if (mode.equals("inspect")) {
          assertNoPartialMigration(baselineCatalog);
          connection.rollback();
          report.put("status", "INSPECTED_READ_ONLY");
        } else {
          lockTables(connection);
          baselineCatalog = catalog(connection);
          baselineHashes = dataHashes(connection);
          baselineCounts = rowCounts(connection);
          report.put("baseline_catalog", baselineCatalog);
          report.put("baseline_data_hashes_excluding_new_columns", baselineHashes);
          report.put("baseline_row_counts", baselineCounts);
          assertNoPartialMigration(baselineCatalog);
          if (mode.equals("apply")) {
            JsonNode rehearsal = JSON.readTree(OUTPUT.resolve("rehearsal.json").toFile());
            assertEquals("REHEARSAL_ROLLED_BACK", rehearsal.path("status").asText());
            assertEquals(migrationHash, rehearsal.path("migration_sha256").asText());
            assertEquals(JSON.valueToTree(baselineCatalog), rehearsal.get("baseline_catalog"));
            assertEquals(JSON.valueToTree(baselineHashes),
              rehearsal.get("baseline_data_hashes_excluding_new_columns"));
            assertEquals(JSON.valueToTree(baselineCounts), rehearsal.get("baseline_row_counts"));
          }

          execute(connection, script);
          assertAdditions(connection);
          assertEquals(baselineHashes, dataHashes(connection),
            "Existing facility/reservation/inspection data changed outside the new columns");
          assertEquals(baselineCounts, rowCounts(connection), "Existing row counts changed");
          report.put("post_catalog", catalog(connection));
          report.put("legacy_data_unchanged", true);
          report.put("snapshot_backfill_rows", scalar(connection,
            "select count(*)::text from public.reservations where refund_cancel_hours_snapshot=24"));

          if (mode.equals("rehearsal")) {
            connection.rollback();
            assertEquals(baselineCatalog, catalog(connection));
            assertEquals(baselineHashes, dataHashes(connection));
            assertEquals(baselineCounts, rowCounts(connection));
            report.put("status", "REHEARSAL_ROLLED_BACK");
          } else {
            assertEquals(migrationHash, sha256(Files.readString(MIGRATION)));
            connection.commit();
            committed = true;
            connection.setAutoCommit(true);
            assertAdditions(connection);
            assertEquals(baselineHashes, dataHashes(connection));
            assertEquals(baselineCounts, rowCounts(connection));
            report.put("status", "APPLIED_COMMITTED_AND_RECHECKED");
          }
        }
      } catch (Throwable error) {
        if (!committed) connection.rollback();
        report.put("status", committed ? "COMMITTED_POSTCHECK_FAILED" : "FAILED_ROLLED_BACK");
        report.put("failure_class", error.getClass().getSimpleName());
        if (error instanceof SQLException sqlError) report.put("sqlstate", sqlError.getSQLState());
        throw new AssertionError(
          "Flow 4 migration " + mode + " failed; class=" + error.getClass().getSimpleName()
        );
      } finally {
        report.put("committed", committed);
        report.put("finished_at_utc", Instant.now().toString());
        JSON.writerWithDefaultPrettyPrinter().writeValue(
          OUTPUT.resolve(mode + ".json").toFile(),
          report
        );
        System.out.println("Flow4Migration022: mode=" + mode
          + ", status=" + report.get("status") + ", committed=" + committed);
      }
    }
  }
}
