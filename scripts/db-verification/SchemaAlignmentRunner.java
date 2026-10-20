import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.modules.identity.entity.User;
import java.lang.reflect.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.sql.*;
import java.time.*;
import java.util.*;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.StandardServiceRegistry;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.engine.jdbc.connections.spi.ConnectionProvider;

/** Explicit, pinned-target manual migration. Never invoked by application startup. */
public class SchemaAlignmentRunner {
  static final ObjectMapper JSON = new ObjectMapper();
  static final List<String> FILES = List.of(
      "002_align_backend_mapping.sql", "003_auth_identity_uniqueness.sql", "004_reservation_no_show_status.sql");
  static final List<String> LOCKED = List.of("audit_logs", "contracts", "payments", "refund_requests", "reservations", "units", "users");
  static final String OLD_CHECK = "CHECK (status::text = ANY (ARRAY['PENDING_PAYMENT'::text, 'RESERVED'::text, 'CHECKED_IN'::text, 'CANCELLED'::text, 'EXPIRED'::text]))";
  static final Map<String,Object> evidence = new LinkedHashMap<>();
  static boolean committed;

  static void require(boolean condition, String safeMessage) {
    if (!condition) throw new IllegalStateException(safeMessage);
  }

  static String hash(Path path) throws Exception {
    return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(path)));
  }

  static long number(Connection c, String sql) throws SQLException {
    try (Statement s=c.createStatement(); ResultSet r=s.executeQuery(sql)) { r.next(); return r.getLong(1); }
  }

  static String scalar(Connection c, String sql) throws SQLException {
    try (Statement s=c.createStatement(); ResultSet r=s.executeQuery(sql)) { r.next(); return r.getString(1); }
  }

  static Map<String,String> shape(Connection c) throws SQLException {
    Map<String,String> result=new TreeMap<>();
    try(Statement s=c.createStatement(); ResultSet r=s.executeQuery(
        "SELECT c.relname,a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,a.attidentity,a.attgenerated "
        +"FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace "
        +"WHERE n.nspname='public' AND c.relkind IN ('r','p') AND a.attnum>0 AND NOT a.attisdropped ORDER BY 1,2")) {
      while(r.next()) result.put(r.getString(1)+"."+r.getString(2),
          r.getString(3)+"|"+r.getBoolean(4)+"|"+r.getString(5)+"|"+r.getString(6));
    }
    return result;
  }

  static Map<String,Long> counts(Connection c) throws SQLException {
    Map<String,Long> result=new TreeMap<>();
    for(String table:LOCKED) result.put(table,number(c,"SELECT count(*) FROM public."+table));
    return result;
  }

  static List<String> verifySource(Path root) throws Exception {
    JsonNode manifest=JSON.readTree(root.resolve("docs/drafts/schema-alignment-20261018/g0-evidence-manifest.json").toFile());
    List<String> classes=new ArrayList<>();
    for(JsonNode entity:manifest.get("source_checks")) {
      String source=entity.get("source").asText();
      require(hash(root.resolve(source)).equals(entity.get("sha256").asText()),"Entity source drift; regenerate inventory before migration");
      classes.add(source.substring("backend/src/main/java/".length(),source.length()-5).replace('/','.'));
    }
    require(classes.size()==16,"Expected exactly 16 unchanged mapped entities");
    return classes;
  }

  static Map<String,String> expectedShape(JsonNode baseline) {
    Map<String,String> result=new TreeMap<>();
    for(JsonNode group:baseline.get("groups")) if(group.get("query_sequence").asInt()==4) {
      require("OK".equals(group.get("status").asText()),"Baseline catalog incomplete");
      for(JsonNode r:group.get("rows")) result.put(r.get("table_name").asText()+"."+r.get("column_name").asText(),
          r.get("exact_postgresql_type").asText()+"|"+r.get("attnotnull").asBoolean()+"|"+r.get("attidentity").asText()+"|"+r.get("attgenerated").asText());
    }
    require(result.size()==179,"Expected accepted 179-column baseline");
    return result;
  }

  static final class BorrowedConnection implements ConnectionProvider {
    final Connection physical;
    final Connection view;
    boolean virtualAutoCommit=true;
    Savepoint fixture;
    BorrowedConnection(Connection c) {
      physical=c;
      view=(Connection)Proxy.newProxyInstance(Connection.class.getClassLoader(),new Class<?>[]{Connection.class},(proxy,method,args)-> {
        switch(method.getName()) {
          case "getAutoCommit": return virtualAutoCommit;
          case "setAutoCommit": virtualAutoCommit=(Boolean)args[0]; return null;
          case "commit": throw new SQLException("ORM rehearsal is not allowed to commit the outer migration transaction");
          case "rollback":
            if(fixture==null || (args!=null && args.length>0)) throw new SQLException("ORM rollback outside fixture savepoint rejected");
            physical.rollback(fixture); return null;
          case "close": return null;
          case "unwrap":
            if(((Class<?>)args[0]).isInstance(proxy))return proxy;
            throw new SQLException("Unwrapping the physical migration connection is prohibited");
          case "isWrapperFor": return ((Class<?>)args[0]).isInstance(proxy);
          default:
            try { return method.invoke(physical,args); }
            catch(InvocationTargetException e) { throw e.getCause(); }
        }
      });
    }
    public Connection getConnection(){return view;}
    public void closeConnection(Connection ignored){}
    public boolean supportsAggressiveRelease(){return false;}
    public boolean isUnwrappableAs(Class<?> type){return type.isInstance(this);}
    public <T>T unwrap(Class<T> type){if(type.isInstance(this))return type.cast(this);throw new IllegalArgumentException("Unsupported provider unwrap");}
  }

  static void validateAndRoundTrip(Connection c,List<String> classes) throws Exception {
    BorrowedConnection provider=new BorrowedConnection(c);
    Map<String,Object> settings=new HashMap<>();
    settings.put("hibernate.connection.provider_class",provider);
    settings.put("hibernate.dialect","org.hibernate.dialect.PostgreSQLDialect");
    settings.put("hibernate.hbm2ddl.auto","validate");
    settings.put("hibernate.default_schema","public");
    settings.put("hibernate.jdbc.time_zone","UTC");
    settings.put("hibernate.show_sql",false);
    settings.put("hibernate.cache.use_second_level_cache",false);
    String transactionId=scalar(c,"SELECT pg_current_xact_id_if_assigned()::text");
    StandardServiceRegistry registry=new StandardServiceRegistryBuilder().applySettings(settings).build();
    try {
      MetadataSources sources=new MetadataSources(registry);
      for(String name:classes)sources.addAnnotatedClass(Class.forName(name));
      try(SessionFactory factory=sources.buildMetadata().buildSessionFactory()) {
        evidence.put("hibernate_validate_entities",classes.size());
        require(!c.getAutoCommit() && Objects.equals(transactionId,scalar(c,"SELECT pg_current_xact_id_if_assigned()::text")),"Hibernate changed the outer transaction");
        LocalDateTime expected=LocalDateTime.of(2031,2,3,4,5,6);
        List<String> zones=new ArrayList<>();
        for(String zone:List.of("UTC","Asia/Ho_Chi_Minh")) {
          try(Statement s=c.createStatement()){s.execute("SET LOCAL TIME ZONE '"+zone+"'");}
          provider.fixture=c.setSavepoint();
          String id="MIG-TEST-"+UUID.randomUUID();
          try(Session session=factory.openSession()) {
            session.beginTransaction();
            User user=new User();user.setId(id);user.setName("Migration Fixture");
            String key=UUID.randomUUID().toString().replace("-","");
            user.setUsername("mg"+key.substring(0,12));user.setEmail("migration_"+key+"@example.invalid");
            user.setPassword("not-a-login-credential");user.setRole("CUSTOMER");user.setStatus("ACTIVE");user.setCreatedAt(expected);
            session.persist(user);session.flush();session.clear();
            User loaded=session.find(User.class,id);
            require(loaded!=null && expected.equals(loaded.getCreatedAt()),"LocalDateTime ORM round-trip mismatch");
            try(PreparedStatement q=c.prepareStatement("SELECT extract(epoch FROM created_at) FROM public.users WHERE id=?")) {
              q.setString(1,id);try(ResultSet r=q.executeQuery()){require(r.next(),"Fixture disappeared");
                require(r.getBigDecimal(1).compareTo(BigDecimal.valueOf(expected.toEpochSecond(ZoneOffset.UTC)))==0,"Stored instant differs from expected UTC");}
            }
            session.getTransaction().rollback(); // proxy rolls back only this fixture savepoint
          } finally {c.rollback(provider.fixture);c.releaseSavepoint(provider.fixture);provider.fixture=null;provider.virtualAutoCommit=true;}
          require(number(c,"SELECT count(*) FROM public.users WHERE id='"+id+"'")==0,"ORM test fixture persisted");
          zones.add(zone);
        }
        evidence.put("localdatetime_timestamptz_orm_roundtrip_zones",zones);
        evidence.put("orm_fixtures_rolled_back",true);
      }
    } finally {StandardServiceRegistryBuilder.destroy(registry);}
    try(Statement s=c.createStatement()){s.execute("SET LOCAL TIME ZONE 'UTC'");}
    require(!c.getAutoCommit() && Objects.equals(transactionId,scalar(c,"SELECT pg_current_xact_id_if_assigned()::text")),"ORM harness committed or replaced the outer transaction");
  }

  static void fixture(Connection c,String id,String username,String email,String phone) throws SQLException {
    try(PreparedStatement s=c.prepareStatement("INSERT INTO public.users(id,name,username,password,email,phone,role,status) VALUES (?,'Migration Fixture',?,'not-a-login-credential',?,?,'CUSTOMER','ACTIVE')")) {
      s.setString(1,id);s.setString(2,username);s.setString(3,email);s.setString(4,phone);s.executeUpdate();
    }
  }

  static void verifyUniqueness(Connection c) throws SQLException {
    Savepoint all=c.setSavepoint();
    String key=UUID.randomUUID().toString().replace("-","");
    String user="mg"+key.substring(0,12),email="migration_"+key+"@example.invalid";
    String phone="090"+String.format("%07d",Math.floorMod(UUID.randomUUID().getLeastSignificantBits(),10000000));
    List<String> passed=new ArrayList<>();
    try {
      fixture(c,"MIG-TEST-"+UUID.randomUUID(),user,email,phone);
      String[][] cases={{"ux_users_username_ci",user.toUpperCase(Locale.ROOT),"other_"+email,null},
                        {"ux_users_email_ci","other_"+user,email.toUpperCase(Locale.ROOT),null},
                        {"ux_users_phone_normalized","phone_"+user,"phone_"+email,phone.substring(0,3)+" .-"+phone.substring(3)}};
      for(String[] test:cases) {
        Savepoint trial=c.setSavepoint();boolean rejected=false;
        try{fixture(c,"MIG-TEST-"+UUID.randomUUID(),test[1],test[2],test[3]);}
        catch(SQLException e){
          if(e instanceof org.postgresql.util.PSQLException p && "23505".equals(e.getSQLState())) {
            rejected=test[0].equals(p.getServerErrorMessage().getConstraint());
          } else throw e;
        } finally {c.rollback(trial);c.releaseSavepoint(trial);}
        require(rejected,"Expected canonical unique index did not reject the fixture");passed.add(test[0]);
      }
    } finally {c.rollback(all);c.releaseSavepoint(all);}
    evidence.put("canonical_unique_rejection_tests",passed);
    evidence.put("concurrent_registration_test","NOT-TESTED");
  }

  static void verifyNewTableAccess(Connection c) throws SQLException {
    for(String table:List.of("invoices","refund_transactions")) {
      require("true".equals(scalar(c,"SELECT relrowsecurity::text FROM pg_class WHERE oid='public."+table+"'::regclass")),"New table RLS not enabled");
      for(String role:List.of("anon","authenticated","service_role")) for(String privilege:List.of("SELECT","INSERT","UPDATE","DELETE")) {
        require("false".equals(scalar(c,"SELECT has_table_privilege('"+role+"','public."+table+"','"+privilege+"')::text")),"New table unintentionally grants API role access");
      }
      require(number(c,"SELECT count(*) FROM public."+table)==0,"New financial table unexpectedly contains data");
    }
    evidence.put("new_tables_rls_enabled",true);evidence.put("new_tables_api_role_data_access",false);
  }

  public static void main(String[] args) {
    Path output=null;Connection connection=null;
    evidence.put("started_at_utc",Instant.now().toString());
    try {
      require(args.length==4,"Expected private config path, repository root, rehearsal|apply, evidence output path");
      Path root=Path.of(args[1]).toAbsolutePath().normalize();output=Path.of(args[3]);
      String mode=args[2];require(Set.of("rehearsal","apply").contains(mode),"Unsupported operation");
      require(ZoneId.systemDefault().equals(ZoneId.of("UTC")),"Runner JVM must use -Duser.timezone=UTC");
      ((ch.qos.logback.classic.Logger)org.slf4j.LoggerFactory.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME)).setLevel(ch.qos.logback.classic.Level.OFF);
      java.util.logging.Logger.getLogger("org.postgresql").setLevel(java.util.logging.Level.OFF);
      Properties config=new Properties();try(var reader=Files.newBufferedReader(Path.of(args[0]),StandardCharsets.UTF_8)){config.load(reader);}
      evidence.put("config",SupabaseMetadataProbe.inspect(config));evidence.put("mode",mode);
      List<String> classes=verifySource(root);
      Map<String,String> digests=new LinkedHashMap<>();
      for(String file:FILES)digests.put(file,hash(root.resolve("database/migrations").resolve(file)));
      evidence.put("migration_sha256",digests);
      if(mode.equals("apply")) {
        JsonNode rehearsal=JSON.readTree(root.resolve("artifacts/auth-staging/migration-rehearsal.json").toFile());
        require("REHEARSAL_ROLLED_BACK".equals(rehearsal.path("status").asText()),"Successful rollback rehearsal required before apply");
        require(JSON.valueToTree(digests).equals(rehearsal.get("migration_sha256")),"Migration changed since rehearsal");
      }
      JsonNode baseline=JSON.readTree(root.resolve("artifacts/auth-staging/session-pooler-metadata.json").toFile());
      Map<String,String> expected=expectedShape(baseline);
      Properties credentials=new Properties();credentials.setProperty("user",config.getProperty("SUPABASE_DB_USERNAME"));
      credentials.setProperty("password",config.getProperty("SUPABASE_DB_PASSWORD"));credentials.setProperty("connectTimeout","15");
      credentials.setProperty("socketTimeout","90");credentials.setProperty("ApplicationName","storage-rental-explicit-schema-alignment");
      connection=DriverManager.getConnection(config.getProperty("SUPABASE_DB_URL"),credentials);
      Connection c=connection;c.setAutoCommit(false);
      try(Statement s=c.createStatement()) {
        s.execute("SET LOCAL lock_timeout='5s'");s.execute("SET LOCAL statement_timeout='45s'");
        s.execute("SET LOCAL idle_in_transaction_session_timeout='120s'");s.execute("SET LOCAL search_path=public,pg_catalog");
      }
      require("postgres".equals(scalar(c,"SELECT current_database()")) && "postgres".equals(scalar(c,"SELECT current_user"))
          && "public".equals(scalar(c,"SELECT current_schema()")),"Effective target differs from approved staging");
      require(number(c,"SELECT current_setting('server_version_num')::integer")==170011,"PostgreSQL version drift");
      require("true".equals(scalar(c,"SELECT pg_try_advisory_xact_lock(391,20261019)::text")),"Another schema alignment runner is active");
      try(Statement s=c.createStatement()){s.execute("LOCK TABLE "+String.join(",",LOCKED.stream().map(t->"public."+t).toList())+" IN SHARE ROW EXCLUSIVE MODE");}
      require(expected.equals(shape(c)),"Live column shape drifted from accepted capture; refresh/review before migration");
      require(OLD_CHECK.equals(scalar(c,"SELECT pg_get_constraintdef(oid,true) FROM pg_constraint WHERE conrelid='public.reservations'::regclass AND conname='reservations_status_check' AND contype='c' AND convalidated")),"Reservation CHECK differs from reviewed definition");
      Map<String,Long> before=counts(c);evidence.put("row_counts_before",before);
      int statements=0;
      for(String file:FILES) {
        // These reviewed migration files contain no procedural/dollar-quoted SQL or transaction delimiters.
        String sql=Files.readString(root.resolve("database/migrations").resolve(file));
        require(!sql.contains("$"),"Unexpected procedural SQL; reviewed simple-statement runner only");
        for(String statement:SupabaseMetadataProbe.sqlStatements(sql)) {
          require(statement.startsWith("ALTER TABLE public.") || statement.startsWith("CREATE TABLE public.")
              || statement.startsWith("REVOKE ALL PRIVILEGES ON TABLE public.") || statement.startsWith("CREATE UNIQUE INDEX ux_users_"),"Unreviewed SQL operation rejected");
          try(Statement s=c.createStatement()){s.execute(statement);}statements++;
        }
      }
      evidence.put("migration_statements_executed",statements);
      validateAndRoundTrip(c,classes);
      verifyUniqueness(c);verifyNewTableAccess(c);
      Map<String,Long> after=counts(c);require(before.equals(after),"Historical row counts changed during migration/rehearsal");
      evidence.put("row_counts_after",after);evidence.put("existing_row_counts_unchanged",true);
      Map<String,String> expanded=shape(c);require(expanded.size()==239,"Unexpected post-migration public column count");
      for(var old:expected.entrySet())require(old.getValue().equals(expanded.get(old.getKey())),"Existing column definition was changed");
      evidence.put("existing_column_types_nullability_identity_unchanged",true);
      if(mode.equals("rehearsal")) {
        c.rollback();require(expected.equals(shape(c)),"Rollback did not restore accepted schema");c.rollback();
        evidence.put("status","REHEARSAL_ROLLED_BACK");evidence.put("committed",false);
      } else {
        c.commit();committed=true;
        evidence.put("status","APPLIED_COMMITTED");evidence.put("committed",true);
      }
      evidence.put("finished_at_utc",Instant.now().toString());
      SupabaseMetadataProbe.save(output,evidence);
      System.out.println(SupabaseMetadataProbe.json(Map.of("status",evidence.get("status"),"committed",committed,
          "hibernate_validate_entities",16,"migration_statements_executed",statements,"evidence_output",output.toString())));
    } catch(Throwable e) {
      if(connection!=null && !committed)try{connection.rollback();}catch(SQLException ignored){}
      evidence.put("status",committed?"COMMITTED_EVIDENCE_FAILURE":"FAILED_ROLLED_BACK_IF_CONNECTED");evidence.put("committed",committed);
      List<String> causes=new ArrayList<>();for(Throwable t=e;t!=null;t=t.getCause())causes.add(t.getClass().getSimpleName());
      evidence.put("cause_classes",causes);
      if(e instanceof SQLException s)evidence.put("sql_state",s.getSQLState());
      if(e instanceof IllegalStateException)evidence.put("validation_error",e.getMessage());
      try{if(output!=null)SupabaseMetadataProbe.save(output,evidence);}catch(Exception ignored){}
      System.out.println(SupabaseMetadataProbe.json(evidence));System.exit(2);
    } finally {if(connection!=null)try{connection.close();}catch(SQLException ignored){}}
  }
}
