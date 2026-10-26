package com.swp391.selfstorage;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.reflect.*;
import java.math.BigDecimal;
import java.nio.file.*;
import java.security.MessageDigest;
import java.sql.*;
import java.time.Instant;
import java.util.*;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.engine.jdbc.connections.spi.ConnectionProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor;
import org.springframework.core.env.*;

/** Explicit staging migration harness. No application startup, seed, scheduler or private-file inspection. */
@EnabledIfSystemProperty(named = "handover.migration.mode", matches = "inspect|rehearsal|apply")
class HandoverMigration015Test {
  static final String SHA = "365b08cb92bfa8eb86dced80fd1ad0bea88c720f2d09b7eeb2e1dcac85aac89a";
  static final Path ROOT = Path.of("..").toAbsolutePath().normalize();
  static final Path OUTPUT = ROOT.resolve(".tmp/handover-migration-015");
  static final ObjectMapper JSON = new ObjectMapper();
  static final List<String> TABLES = List.of("handover_records", "refund_requests", "contracts", "reservations", "units", "payments", "invoices", "daily_tasks", "users", "facilities");

  static String hash(String value) throws Exception {
    return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
  }

  static ConfigurableEnvironment stagingEnvironment() {
    var env = new StandardEnvironment();
    env.getPropertySources().addFirst(new MapPropertySource("migration-scope", Map.of(
        "spring.profiles.active", "auth-supabase", "spring.main.banner-mode", "off")));
    ConfigDataEnvironmentPostProcessor.applyTo(env);
    String url = env.getProperty("spring.datasource.url", "");
    var uri = java.net.URI.create(url.replaceFirst("^jdbc:", ""));
    assertEquals("postgresql", uri.getScheme());
    assertEquals("aws-0-ap-northeast-1.pooler.supabase.com", uri.getHost());
    assertEquals(5432, uri.getPort()); assertEquals("/postgres", uri.getPath());
    assertEquals("postgres.xnerbsgbwdpemvnatvuy", env.getProperty("spring.datasource.username"));
    return env;
  }

  static Connection connect(ConfigurableEnvironment env) throws Exception {
    var properties = new Properties();
    properties.setProperty("user", env.getRequiredProperty("spring.datasource.username"));
    properties.setProperty("password", env.getRequiredProperty("spring.datasource.password"));
    properties.setProperty("sslmode", "require"); properties.setProperty("connectTimeout", "15");
    properties.setProperty("socketTimeout", "60"); properties.setProperty("ApplicationName", "storage-rental-migration-015");
    return DriverManager.getConnection(env.getRequiredProperty("spring.datasource.url"), properties);
  }

  static String scalar(Connection c, String query) throws SQLException {
    try (var s = c.createStatement(); var r = s.executeQuery(query)) { assertTrue(r.next()); return r.getString(1); }
  }

  static void sql(Connection c, String value) throws SQLException {
    try (var s = c.createStatement()) { s.execute(value); }
  }

  static void target(Connection c) throws SQLException {
    assertEquals("postgres|public|postgres", scalar(c, "select current_database()||'|'||current_schema()||'|'||current_user"));
    assertTrue(Integer.parseInt(scalar(c, "show server_version_num")) >= 170000);
  }

  static Map<String, String> catalog(Connection c) throws Exception {
    var result = new TreeMap<String, String>();
    try (var s = c.createStatement(); var r = s.executeQuery("""
        select t.relname,a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,a.attidentity,a.attgenerated
        from pg_attribute a join pg_class t on t.oid=a.attrelid join pg_namespace n on n.oid=t.relnamespace
        where n.nspname='public' and t.relkind in ('r','p') and a.attnum>0 and not a.attisdropped order by 1,2
        """)) {
      while (r.next()) result.put(r.getString(1)+"."+r.getString(2), r.getString(3)+"|"+r.getBoolean(4)+"|"+r.getString(5)+"|"+r.getString(6));
    }
    return result;
  }

  static Map<String, String> fingerprints(Connection c) throws Exception {
    var result = new TreeMap<String, String>();
    for (String table : TABLES) {
      // Hash inside PostgreSQL; no business row or PII leaves the connection.
      String row = "to_jsonb(t)";
      if (table.equals("handover_records")) row += "-'confirmation_deadline_at'";
      if (table.equals("refund_requests")) row += "-'handover_review_id'";
      result.put(table, scalar(c, "select count(*)::text||':'||md5(coalesce(string_agg(row_hash,'' order by row_hash),'')) from (select md5(("+row+")::text) row_hash from public."+table+" t) q"));
    }
    return result;
  }

  static Map<String, String> permissionsAndIndexes(Connection c) throws Exception {
    var result = new TreeMap<String, String>();
    try (var s = c.createStatement(); var r = s.executeQuery("""
        select c.relname,coalesce(c.relacl::text,''),c.relrowsecurity,c.relforcerowsecurity
        from pg_class c join pg_namespace n on n.oid=c.relnamespace
        where n.nspname='public' and c.relkind in ('r','p') order by 1
        """)) { while (r.next()) result.put("acl:"+r.getString(1), r.getString(2)+"|"+r.getBoolean(3)+"|"+r.getBoolean(4)); }
    try (var s = c.createStatement(); var r = s.executeQuery("select indexname,indexdef from pg_indexes where schemaname='public' order by indexname")) {
      while (r.next()) result.put("index:"+r.getString(1), r.getString(2));
    }
    try (var s = c.createStatement(); var r = s.executeQuery("""
        select c.relname,k.conname,pg_get_constraintdef(k.oid,true) from pg_constraint k
        join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace
        where n.nspname='public' order by 1,2
        """)) { while (r.next()) result.put("constraint:"+r.getString(1)+":"+r.getString(2),r.getString(3)); }
    return result;
  }

  static class BorrowedConnection implements ConnectionProvider {
    final Connection connection, view;
    boolean virtualAutoCommit = true;
    BorrowedConnection(Connection connection) {
      this.connection = connection;
      view = (Connection) Proxy.newProxyInstance(Connection.class.getClassLoader(), new Class<?>[]{Connection.class}, (proxy, method, args) -> {
        switch (method.getName()) {
          case "close": return null;
          case "setAutoCommit": virtualAutoCommit = (Boolean)args[0]; return null;
          case "getAutoCommit": return virtualAutoCommit;
          case "commit": case "rollback": throw new SQLException("ORM may not end migration transaction");
          case "unwrap": if (((Class<?>)args[0]).isInstance(proxy)) return proxy; throw new SQLException("Physical unwrap forbidden");
          case "isWrapperFor": return ((Class<?>)args[0]).isInstance(proxy);
          default: try { return method.invoke(connection,args); } catch (InvocationTargetException error) { throw error.getCause(); }
        }
      });
    }
    public Connection getConnection() { return view; }
    public void closeConnection(Connection c) {}
    public boolean supportsAggressiveRelease() { return false; }
    public boolean isUnwrappableAs(Class<?> type) { return type.isInstance(this); }
    public <T> T unwrap(Class<T> type) { return type.cast(this); }
  }

  static int validateHibernate(Connection c) throws Exception {
    var settings = new HashMap<String,Object>();
    settings.put("hibernate.connection.provider_class", new BorrowedConnection(c));
    settings.put("hibernate.hbm2ddl.auto", "validate"); settings.put("hibernate.default_schema", "public");
    settings.put("hibernate.jdbc.time_zone", "UTC"); settings.put("hibernate.show_sql", false);
    var registry = new StandardServiceRegistryBuilder().applySettings(settings).build();
    try {
      var sources = new MetadataSources(registry); int count = 0;
      Path javaRoot = ROOT.resolve("backend/src/main/java");
      try (var files = Files.walk(javaRoot)) {
        for (var file : files.filter(p -> p.toString().endsWith(".java")).toList()) {
          if (Files.readString(file).matches("(?s).*@Entity\\b.*")) {
            String name = javaRoot.relativize(file).toString().replace('\\','.').replace('/','.').replaceFirst("\\.java$", "");
            sources.addAnnotatedClass(Class.forName(name)); count++;
          }
        }
      }
      try (var factory = sources.buildMetadata().buildSessionFactory()) { assertTrue(factory.isOpen()); }
      assertTrue(count >= 18); return count;
    } finally { StandardServiceRegistryBuilder.destroy(registry); }
  }

  static void verifyAdditions(Connection c, Map<String,String> before) throws Exception {
    var after = catalog(c);
    for (var entry : before.entrySet()) assertEquals(entry.getValue(), after.get(entry.getKey()), "Existing column changed: "+entry.getKey());
    assertEquals(34, after.size()-before.size());
    assertEquals("0", scalar(c, "select (select count(*) from public.handover_reviews)+(select count(*) from public.handover_review_evidence)"));
    for (String table : List.of("handover_reviews", "handover_review_evidence")) {
      assertEquals("0",scalar(c,"select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace, lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a where n.nspname='public' and c.relname='"+table+"' and a.grantee=0"));
      for (String role : List.of("anon","authenticated","service_role")) {
        if ("1".equals(scalar(c,"select count(*) from pg_roles where rolname='"+role+"'"))) {
          assertEquals("false", scalar(c,"select (has_table_privilege('"+role+"','public."+table+"','SELECT') or has_table_privilege('"+role+"','public."+table+"','INSERT') or has_table_privilege('"+role+"','public."+table+"','UPDATE') or has_table_privilege('"+role+"','public."+table+"','DELETE'))::text"));
        }
      }
    }
    assertEquals("6", scalar(c,"select count(*) from pg_indexes where schemaname='public' and indexname in ('handover_one_pending_cancellation','handover_review_facility_created','handover_review_customer_created','handover_confirmation_due','handover_review_evidence_parent','handover_refund_per_payment')"));
  }

  static void constraints(Connection c) throws Exception {
    var savepoint = c.setSavepoint();
    String key = "M15"+UUID.randomUUID().toString().substring(0,8);
    try {
      sql(c,"insert into public.facilities(code,name,address,city,status) values ('"+key+"','Synthetic','Synthetic','Synthetic','ACTIVE')");
      sql(c,"insert into public.users(id,name,username,password,email,role,status) values ('"+key+"','Synthetic','"+key.toLowerCase()+"','not-a-login-credential','"+key+"@migration.invalid','CUSTOMER','ACTIVE')");
      sql(c,"insert into public.reservations(id,user_id,customer_name,facility_code,unit_type,start_date,deposit_amount,status) values ('"+key+"','"+key+"','Synthetic','"+key+"','S',current_date,0,'RESERVED')");
      sql(c,"insert into public.contracts(id,reservation_id,user_id,customer_name,facility_code,start_date,end_date,monthly_fee,deposit_fee,status) values ('"+key+"','"+key+"','"+key+"','Synthetic','"+key+"',current_date,current_date+1,1,0,'PENDING_HANDOVER')");
      sql(c,"insert into public.handover_records(id,contract_id,reservation_id,staff_id,customer_signature_confirmed,status,handover_date,confirmation_deadline_at) values ('"+key+"','"+key+"','"+key+"','"+key+"',false,'PENDING_CUSTOMER_CONFIRMATION',timestamp '2031-02-03 04:05:06',timestamp '2031-02-04 04:05:06')");
      String fields = "handover_id,contract_id,reservation_id,facility_code,user_id,kind,status,reason,source,created_at,handover_snapshot,policy_version";
      String values = "'"+key+"','"+key+"','"+key+"','"+key+"','"+key+"','TIMEOUT','PENDING','Synthetic timeout','SYSTEM',localtimestamp,'{}','HANDOVER-CANCELLATION-2026-10'";
      sql(c,"insert into public.handover_reviews(id,"+fields+") values ('"+key+"',"+values+")");
      reject(c,"insert into public.handover_reviews(id,"+fields+") values ('"+key+"-duplicate',"+values+")","23505");
      reject(c,"insert into public.handover_review_evidence(id,review_id,note,created_at) values ('"+key+"','missing','Synthetic',localtimestamp)","23503");
      reject(c,"update public.handover_reviews set status='INVALID' where id='"+key+"'","23514");
      assertEquals("86400", scalar(c,"select extract(epoch from confirmation_deadline_at-handover_date)::bigint::text from public.handover_records where id='"+key+"'"));
      sql(c,"insert into public.handover_review_evidence(id,review_id,note,created_at) values ('"+key+"','"+key+"','Synthetic',localtimestamp)");
    } finally { c.rollback(savepoint); c.releaseSavepoint(savepoint); }
    assertEquals("0", scalar(c,"select count(*) from public.users where id='"+key+"'"));
  }

  static void reject(Connection c, String sql, String state) throws Exception {
    var point = c.setSavepoint();
    try { SQLException error = assertThrows(SQLException.class, () -> sql(c,sql)); assertEquals(state,error.getSQLState()); }
    finally { c.rollback(point); c.releaseSavepoint(point); }
  }

  @Test
  void explicitMigration() throws Exception {
    Files.createDirectories(OUTPUT);
    String mode = System.getProperty("handover.migration.mode");
    var report = new LinkedHashMap<String,Object>(); report.put("mode",mode); report.put("started_at_utc",Instant.now().toString());
    report.put("target_project","xnerbsgbwdpemvnatvuy");
    Path migration = ROOT.resolve("database/migrations/015_handover_review_and_cancellation.sql");
    String script = Files.readString(migration); assertEquals(SHA,hash(script)); report.put("migration_sha256",SHA);
    boolean committed = false;
    try (var c = connect(stagingEnvironment())) {
      c.setAutoCommit(false);
      try {
        sql(c,"set local search_path=public,pg_catalog"); sql(c,"set local time zone 'UTC'");
        sql(c,"set local lock_timeout='5s'"); sql(c,"set local statement_timeout='30s'");
        sql(c,"set local idle_in_transaction_session_timeout='120s'"); target(c);
        assertEquals("true",scalar(c,"select pg_try_advisory_xact_lock(391,20261015)::text"));
        var before = catalog(c); var securityBefore = permissionsAndIndexes(c);
        var fingerprintsBefore = fingerprints(c);
        report.put("baseline_columns",before); report.put("baseline_catalog",securityBefore); report.put("baseline_data_hashes",fingerprintsBefore);
        if (mode.equals("inspect")) {
          c.rollback(); report.put("status","INSPECTED_READ_ONLY");
        } else {
          assertFalse(before.containsKey("handover_records.confirmation_deadline_at"),"Migration already partially/fully applied");
          assertTrue(before.keySet().stream().noneMatch(k -> k.startsWith("handover_reviews.")||k.startsWith("handover_review_evidence.")));
          if (mode.equals("apply")) {
            var rehearsal = JSON.readTree(OUTPUT.resolve("rehearsal.json").toFile());
            assertEquals("REHEARSAL_ROLLED_BACK",rehearsal.path("status").asText()); assertEquals(SHA,rehearsal.path("migration_sha256").asText());
            assertEquals(JSON.valueToTree(before),rehearsal.get("baseline_columns"));
            assertEquals(JSON.valueToTree(securityBefore),rehearsal.get("baseline_catalog"));
          }
          sql(c,"lock table public.handover_records,public.refund_requests in share row exclusive mode");
          String body = script.replaceFirst("(?s)^.*?\\bBEGIN;", "").replaceFirst("(?s)COMMIT;\\s*$", "");
          assertFalse(body.contains("COMMIT;")); sql(c,body);
          verifyAdditions(c,before); report.put("hibernate_validated_entities",validateHibernate(c)); constraints(c);
          assertEquals(fingerprintsBefore,fingerprints(c),"Existing business data changed");
          report.put("data_unchanged",true); report.put("constraints_and_access_verified",true);
          report.put("post_columns",catalog(c));
          if (mode.equals("rehearsal")) {
            c.rollback(); assertEquals(before,catalog(c)); assertEquals(securityBefore,permissionsAndIndexes(c));
            assertEquals(fingerprintsBefore,fingerprints(c)); c.rollback(); report.put("status","REHEARSAL_ROLLED_BACK");
          } else {
            assertEquals(SHA,hash(Files.readString(migration))); c.commit(); committed = true;
            verifyAdditions(c,before); assertEquals(fingerprintsBefore,fingerprints(c)); c.rollback();
            report.put("status","APPLIED_COMMITTED_AND_RECHECKED");
          }
        }
      } catch (Throwable error) {
        if (!committed) c.rollback(); report.put("status",committed ? "COMMITTED_POSTCHECK_FAILED" : "FAILED_ROLLED_BACK");
        report.put("failure_class",error.getClass().getSimpleName());
        if (error instanceof SQLException sqlError) report.put("sqlstate",sqlError.getSQLState());
        throw new AssertionError("Migration " + mode + " failed; class="+error.getClass().getSimpleName()+"; see sanitized report");
      } finally {
        report.put("committed",committed); report.put("finished_at_utc",Instant.now().toString());
        JSON.writerWithDefaultPrettyPrinter().writeValue(OUTPUT.resolve(mode+".json").toFile(),report);
        System.out.println("Migration015: mode="+mode+", status="+report.get("status")+", committed="+committed);
      }
    }
  }
}
