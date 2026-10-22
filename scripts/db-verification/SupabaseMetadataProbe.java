import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.time.Instant;
import java.util.*;
import java.util.logging.*;

public class SupabaseMetadataProbe {
  // Explicitly supplied by the operator after the direct endpoint proved unreachable.
  static final String HOST = "aws-0-ap-northeast-1.pooler.supabase.com";
  static final String LOGIN_USER = "postgres.xnerbsgbwdpemvnatvuy";
  // Supavisor routing suffix is not part of the PostgreSQL current_user.
  static final String ROLE = "postgres";
  static final String DATABASE = "postgres";
  static final List<String> secrets = new ArrayList<>();

  static String required(Properties p, String key) {
    String value = p.getProperty(key);
    if (value == null || value.isEmpty()) throw new IllegalArgumentException("Missing configuration key: " + key);
    return value;
  }

  static Map<String,Object> inspect(Properties p) throws Exception {
    String url = required(p,"SUPABASE_DB_URL");
    String user = required(p,"SUPABASE_DB_USERNAME");
    String password = required(p,"SUPABASE_DB_PASSWORD");
    for (String key : List.of("SUPABASE_DB_PASSWORD","JWT_SECRET","AUTH_SMTP_PASSWORD","AUTH_SMTP_USERNAME")) {
      String s = p.getProperty(key);
      if (s != null && s.length() >= 8) secrets.add(s);
    }
    if (!url.startsWith("jdbc:postgresql://")) throw new IllegalArgumentException("Expected PostgreSQL JDBC URL");
    java.net.URI uri = java.net.URI.create(url.substring(5));
    if (uri.getUserInfo() != null) throw new IllegalArgumentException("Credentials must be separate from URL");
    Map<String,String> query = new LinkedHashMap<>();
    for (String part : Objects.toString(uri.getRawQuery(),"").split("&")) {
      if (part.isEmpty()) continue;
      String[] pair = part.split("=",2);
      String key = java.net.URLDecoder.decode(pair[0],StandardCharsets.UTF_8);
      String value = pair.length == 2 ? java.net.URLDecoder.decode(pair[1],StandardCharsets.UTF_8) : "";
      if (!Set.of("sslmode","sslrootcert","currentSchema","connectTimeout","socketTimeout","applicationName").contains(key)) {
        throw new IllegalArgumentException("Unsupported JDBC URL option");
      }
      if (query.put(key,value) != null) throw new IllegalArgumentException("Duplicate JDBC URL option");
    }
    int port = uri.getPort() < 0 ? 5432 : uri.getPort();
    if (!HOST.equalsIgnoreCase(uri.getHost()) || port != 5432
        || !("/"+DATABASE).equals(uri.getPath()) || !LOGIN_USER.equals(user)) {
      throw new IllegalArgumentException("Configuration target differs from approved host/port/database/role");
    }
    if (!Set.of("require","verify-full").contains(query.getOrDefault("sslmode",""))) {
      throw new IllegalArgumentException("Approved SSL mode missing");
    }
    if (!"validate".equals(p.getProperty("spring.jpa.hibernate.ddl-auto","validate"))
        || !"false".equals(p.getProperty("app.scheduling.enabled","false"))) {
      throw new IllegalArgumentException("Configuration must preserve validate and disabled scheduler");
    }
    if (p.getProperty("spring.profiles.active","").contains("local")) {
      throw new IllegalArgumentException("Local seed profile is not permitted");
    }
    String mode = p.getProperty("AUTH_OTP_DELIVERY","disabled");
    if (!Set.of("email","mock","disabled").contains(mode)) throw new IllegalArgumentException("Unknown OTP mode");
    Map<String,Object> summary = new LinkedHashMap<>();
    summary.put("environment","staging");
    summary.put("approved_target_matches",true);
    summary.put("host",HOST); summary.put("port",port); summary.put("database",DATABASE);
    summary.put("requested_schema","public"); summary.put("login_user",LOGIN_USER);
    summary.put("expected_database_role",ROLE); summary.put("connection_mode","session_pooler");
    summary.put("ssl_mode",query.get("sslmode")); summary.put("otp_mode",mode);
    summary.put("jwt_configured",p.getProperty("JWT_SECRET","").getBytes(StandardCharsets.UTF_8).length>=32);
    summary.put("smtp_configured",!p.getProperty("AUTH_SMTP_HOST","").isEmpty()
        && !p.getProperty("AUTH_SMTP_PASSWORD","").isEmpty() && !p.getProperty("AUTH_MAIL_FROM","").isEmpty());
    summary.put("schema_reviewed_requested",p.getProperty("AUTH_SCHEMA_REVIEWED","false"));
    summary.put("secret_values_exported",false);
    return summary;
  }

  static List<String> sqlStatements(String source) {
    StringBuilder clean = new StringBuilder();
    boolean quoted = false, comment = false;
    List<String> sql = new ArrayList<>();
    for (int i=0;i<source.length();i++) {
      char c = source.charAt(i);
      if (comment) { if(c=='\n') { comment=false; clean.append('\n'); } continue; }
      if (!quoted && c=='-' && i+1<source.length() && source.charAt(i+1)=='-') { comment=true;i++;continue; }
      if (c=='\'') {
        clean.append(c);
        if(quoted && i+1<source.length() && source.charAt(i+1)=='\'') { clean.append('\'');i++;continue; }
        quoted=!quoted;continue;
      }
      if(c==';' && !quoted) { String statement=clean.toString().trim();if(!statement.isEmpty())sql.add(statement);clean.setLength(0); }
      else clean.append(c);
    }
    if(!clean.toString().trim().isEmpty())sql.add(clean.toString().trim());
    return sql;
  }

  static Object safeCell(String key, Object value) {
    if (value == null || value instanceof Number || value instanceof Boolean) return value;
    String s = value instanceof java.sql.Array a ? Arrays.deepToString((Object[])arrayValue(a)) : value.toString();
    if (key.equals("using_expression") || key.equals("check_expression")) {
      return s.isEmpty() ? null : "[EXPRESSION PRESENT; NOT EXPORTED]";
    }
    for(String secret:secrets) s=s.replace(secret,"[REDACTED]");
    if(s.matches("(?s).*eyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}\\..*") || s.contains("://")) {
      return "[REDACTED STRING]";
    }
    return s;
  }

  static Object arrayValue(java.sql.Array a) {
    try { return a.getArray(); } catch(SQLException e) { return new Object[]{"[ARRAY UNAVAILABLE]"}; }
  }

  static Map<String,Object> query(Connection c, String sql, int sequence) throws SQLException {
    Savepoint point=c.setSavepoint();
    Map<String,Object> group=new LinkedHashMap<>(); group.put("query_sequence",sequence);
    try(Statement s=c.createStatement()) {
      s.setQueryTimeout(30);
      try(ResultSet r=s.executeQuery(sql)) {
        List<Map<String,Object>> rows=new ArrayList<>();
        ResultSetMetaData metadata=r.getMetaData();
        while(r.next()) {
          Map<String,Object> row=new LinkedHashMap<>();
          for(int i=1;i<=metadata.getColumnCount();i++) {
            String name=metadata.getColumnLabel(i);
            row.put(name,safeCell(name,r.getObject(i)));
          }
          rows.add(row);
        }
        group.put("status","OK");group.put("rows",rows);
      }
    } catch(SQLException e) {
      c.rollback(point);
      group.put("status","UNVERIFIED_QUERY_ERROR");group.put("sql_state",e.getSQLState());
      group.put("exception_class",e.getClass().getSimpleName());
    } finally { try {c.releaseSavepoint(point);} catch(SQLException ignored){} }
    return group;
  }

  static String json(Object object) {
    if(object==null)return "null";
    if(object instanceof Boolean || object instanceof Number)return object.toString();
    if(object instanceof Map<?,?> m) {
      List<String> entries=new ArrayList<>();
      for(var e:m.entrySet())entries.add(json(e.getKey().toString())+":"+json(e.getValue()));
      return "{"+String.join(",",entries)+"}";
    }
    if(object instanceof Iterable<?> list) {List<String> values=new ArrayList<>();for(var x:list)values.add(json(x));return "["+String.join(",",values)+"]";}
    StringBuilder b=new StringBuilder("\"");
    for(char c:object.toString().toCharArray()) {
      switch(c) {
        case '"' -> b.append("\\\"");
        case '\\' -> b.append("\\\\");
        case '\n' -> b.append("\\n");
        case '\r' -> b.append("\\r");
        case '\t' -> b.append("\\t");
        default -> {if(c<32)b.append(String.format("\\u%04x",(int)c));else b.append(c);}
      }
    }
    return b.append('"').toString();
  }

  static void save(Path path, Map<String,Object> result) throws Exception {
    Files.createDirectories(path.toAbsolutePath().getParent());
    Files.writeString(path,json(result)+"\n",StandardCharsets.UTF_8);
  }

  public static void main(String[] args) {
    Map<String,Object> result=new LinkedHashMap<>();
    result.put("captured_at_utc",Instant.now().toString());
    Path output=null;
    try {
      if(args.length!=4)throw new IllegalArgumentException("Expected config path, metadata SQL path, output path, inspect|metadata");
      Path config=Path.of(args[0]).toAbsolutePath().normalize();
      output=Path.of(args[2]).toAbsolutePath().normalize();
      Properties p=new Properties();
      try(var reader=Files.newBufferedReader(config,StandardCharsets.UTF_8)){p.load(reader);}
      Map<String,Object> configSummary=inspect(p);
      result.put("config",configSummary);
      if(args[3].equals("inspect")) {
        result.put("status","CONFIG_VALIDATED_NO_CONNECTION");
        save(output,result);System.out.println(json(result));return;
      }
      if(!args[3].equals("metadata"))throw new IllegalArgumentException("Unsupported probe operation");
      Logger.getLogger("org.postgresql").setLevel(Level.OFF);
      DriverManager.setLoginTimeout(15);
      Properties connectionProps=new Properties();
      connectionProps.setProperty("user",required(p,"SUPABASE_DB_USERNAME"));
      connectionProps.setProperty("password",required(p,"SUPABASE_DB_PASSWORD"));
      connectionProps.setProperty("connectTimeout","15");connectionProps.setProperty("socketTimeout","40");
      connectionProps.setProperty("ApplicationName","storage-rental-g0-readonly");
      try(Connection c=DriverManager.getConnection(required(p,"SUPABASE_DB_URL"),connectionProps)) {
        c.setReadOnly(true);
        c.setTransactionIsolation(Connection.TRANSACTION_REPEATABLE_READ);
        c.setAutoCommit(false);
        c.setSchema("public");
        try(Statement s=c.createStatement()){
          s.execute("SET LOCAL statement_timeout = '30s'");
          try(ResultSet r=s.executeQuery("SELECT current_database(),current_user,current_schema(),current_setting('transaction_read_only')")) {
            if(!r.next() || !DATABASE.equals(r.getString(1)) || !ROLE.equals(r.getString(2))
                || !"public".equals(r.getString(3)) || !"on".equals(r.getString(4))) {
              throw new IllegalStateException("Effective database/schema/role/read-only does not match approved target");
            }
          }
        }
        List<Map<String,Object>> groups=new ArrayList<>();int sequence=0;
        for(String statement:sqlStatements(Files.readString(Path.of(args[1]),StandardCharsets.UTF_8))) {
          String upper=statement.toUpperCase(Locale.ROOT);
          if(upper.startsWith("BEGIN ")||upper.startsWith("SET LOCAL ")||upper.equals("ROLLBACK"))continue;
          if(!upper.startsWith("SELECT "))throw new IllegalArgumentException("Non-SELECT statement rejected");
          groups.add(query(c,statement,++sequence));
        }
        groups.add(query(c,"SELECT rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolreplication,rolbypassrls FROM pg_roles WHERE rolname=current_user",++sequence));
        groups.add(query(c,"SELECT ssl,version,cipher FROM pg_stat_ssl WHERE pid=pg_backend_pid()",++sequence));
        c.rollback();
        result.put("status","METADATA_COLLECTED_READONLY");
        result.put("database_product",c.getMetaData().getDatabaseProductVersion());
        result.put("groups",groups);
        result.put("query_count",sequence);
        result.put("data_rows_read",false);
        result.put("ddl_or_dml_executed",false);
        result.put("policy_expressions_exported",false);
      }
      save(output,result);
      System.out.println(json(Map.of("status",result.get("status"),"query_count",result.get("query_count"),
          "metadata_output",output.toString(),"ddl_or_dml_executed",false)));
    } catch(Throwable e) {
      result.put("status","FAILED_NO_SCHEMA_OR_DATA_WRITE");
      result.put("exception_class",e.getClass().getSimpleName());
      List<String> causes=new ArrayList<>();
      for(Throwable t=e;t!=null;t=t.getCause())causes.add(t.getClass().getSimpleName());
      result.put("cause_classes",causes);
      if(e instanceof SQLException s)result.put("sql_state",s.getSQLState());
      if(e instanceof IllegalArgumentException || e instanceof IllegalStateException) {
        String message=Objects.toString(e.getMessage(),"Configuration error");
        for(String secret:secrets)message=message.replace(secret,"[REDACTED]");
        result.put("validation_error",message);
      }
      try {if(output!=null)save(output,result);}catch(Exception ignored){}
      System.out.println(json(result));
      System.exit(2);
    }
  }
}
