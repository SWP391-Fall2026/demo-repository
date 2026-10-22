import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.sql.*;
import java.util.*;

/** Only changes the one synthetic mock-OTP CUSTOMER fixture; never an operator/customer account. */
public class AuthFixtureStateControl {
  public static void main(String[] args) {
    Map<String,Object> result=new LinkedHashMap<>();
    try {
      if(args.length!=3 || !Set.of("ACTIVE","LOCKED","DISABLED","LEGACY_UPPER_USERNAME","RESTORE_USERNAME").contains(args[2]))throw new IllegalArgumentException("Expected private config, mock fixture and approved operation");
      JsonNode fixture=new ObjectMapper().readTree(Path.of(args[1]).toFile());
      String username=fixture.get("username").asText(),email=fixture.get("email").asText();
      if(!username.matches("auth[a-z0-9]+") || !email.matches("auth_[a-f0-9]+@auth\\.invalid"))throw new IllegalArgumentException("Only the synthetic mock fixture can be changed");
      Properties p=new Properties();try(var reader=Files.newBufferedReader(Path.of(args[0]),StandardCharsets.UTF_8)){p.load(reader);}
      SupabaseMetadataProbe.inspect(p);Properties credentials=new Properties();
      credentials.setProperty("user",p.getProperty("SUPABASE_DB_USERNAME"));credentials.setProperty("password",p.getProperty("SUPABASE_DB_PASSWORD"));
      credentials.setProperty("connectTimeout","15");credentials.setProperty("socketTimeout","20");
      java.util.logging.Logger.getLogger("org.postgresql").setLevel(java.util.logging.Level.OFF);
      try(Connection c=DriverManager.getConnection(p.getProperty("SUPABASE_DB_URL"),credentials)) {
        c.setAutoCommit(false);
        try(Statement s=c.createStatement()){s.execute("SET LOCAL lock_timeout='3s'");s.execute("SET LOCAL statement_timeout='10s'");}
        String predicate="lower(username)=lower(?) AND email=? AND cccd=? AND role='CUSTOMER' AND id LIKE 'USR-%'";
        boolean changeUsername=args[2].equals("LEGACY_UPPER_USERNAME") || args[2].equals("RESTORE_USERNAME");
        String value=changeUsername ? (args[2].equals("LEGACY_UPPER_USERNAME") ? username.toUpperCase(Locale.ROOT) : username) : args[2];
        try(PreparedStatement s=c.prepareStatement("UPDATE public.users SET "+(changeUsername?"username":"status")+"=? WHERE "+predicate)) {
          s.setString(1,value);s.setString(2,username);s.setString(3,email);s.setString(4,fixture.get("cccd").asText());
          if(s.executeUpdate()!=1){c.rollback();throw new IllegalStateException("Expected exactly one synthetic fixture");}
        }
        c.commit();result.put("status","SYNTHETIC_FIXTURE_STATUS_CHANGED");result.put("operation",args[2]);result.put("rows_changed",1);
      }
      System.out.println(SupabaseMetadataProbe.json(result));
    } catch(Throwable e) {
      result.put("status","SYNTHETIC_FIXTURE_CHANGE_FAILED");result.put("exception_class",e.getClass().getSimpleName());
      if(e instanceof SQLException s)result.put("sql_state",s.getSQLState());
      System.out.println(SupabaseMetadataProbe.json(result));System.exit(2);
    }
  }
}
