import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.sql.*;
import java.util.*;

/** Checks only the approved synthetic fixture, returning aggregate counts/booleans, never PII/hash. */
public class AuthFixtureVerifier {
  public static void main(String[] args) {
    Map<String,Object> result=new LinkedHashMap<>();Path output=null;
    result.put("checked_at_utc",java.time.Instant.now().toString());result.put("secret_values_exported",false);
    try {
      if(args.length!=4 || !Set.of("pending","registered").contains(args[2]))throw new IllegalArgumentException("Expected config, private fixture, pending|registered, evidence path");
      output=Path.of(args[3]);Properties p=new Properties();
      try(var reader=Files.newBufferedReader(Path.of(args[0]),StandardCharsets.UTF_8)){p.load(reader);}
      SupabaseMetadataProbe.inspect(p);
      JsonNode fixtureDocument=new ObjectMapper().readTree(Path.of(args[1]).toFile());
      List<JsonNode> fixtures=new ArrayList<>();
      if(fixtureDocument.isArray())fixtureDocument.forEach(fixtures::add);else fixtures.add(fixtureDocument);
      if(fixtures.isEmpty() || fixtures.size()>10)throw new IllegalArgumentException("Unexpected fixture case count");
      Properties credentials=new Properties();credentials.setProperty("user",p.getProperty("SUPABASE_DB_USERNAME"));
      credentials.setProperty("password",p.getProperty("SUPABASE_DB_PASSWORD"));credentials.setProperty("connectTimeout","15");credentials.setProperty("socketTimeout","20");
      java.util.logging.Logger.getLogger("org.postgresql").setLevel(java.util.logging.Level.OFF);
      try(Connection c=DriverManager.getConnection(p.getProperty("SUPABASE_DB_URL"),credentials)) {
        c.setReadOnly(true);c.setAutoCommit(false);c.setSchema("public");
        try(Statement s=c.createStatement()){s.execute("SET LOCAL statement_timeout='10s'");}
        String sql="SELECT count(*) AS account_count, "
            +"count(*) FILTER (WHERE username=? AND phone=? AND cccd=? AND role='CUSTOMER' AND status='ACTIVE' AND facility_code IS NULL AND facility IS NULL) AS matching_profile_count, "
            +"count(*) FILTER (WHERE password LIKE '$2%' AND length(password)=60) AS bcrypt_format_count "
            +"FROM public.users WHERE lower(email)=lower(?)";
        long totalAccounts=0,totalProfiles=0,totalBcrypt=0,totalSuccess=0,totalFailed=0;
        for(JsonNode fixture:fixtures) {
        long count;
        try(PreparedStatement s=c.prepareStatement(sql)) {
          s.setString(1,fixture.get("username").asText());s.setString(2,fixture.get("phone").asText());
          s.setString(3,fixture.get("cccd").asText());s.setString(4,fixture.get("email").asText());
          try(ResultSet r=s.executeQuery()){r.next();count=r.getLong(1);totalAccounts+=count;totalProfiles+=r.getLong(2);totalBcrypt+=r.getLong(3);
            if(args[2].equals("registered") && (count!=1 || r.getLong(2)!=1 || r.getLong(3)!=1))throw new IllegalStateException("Registered synthetic fixture invariants failed");}
        }
        if(args[2].equals("pending") && count!=0)throw new IllegalStateException("Account unexpectedly persisted before OTP verification");
        try(PreparedStatement s=c.prepareStatement("SELECT count(*) FILTER (WHERE status='SUCCESS'), count(*) FILTER (WHERE status='FAILED') FROM public.login_history WHERE username=?")) {
          s.setString(1,fixture.get("username").asText());try(ResultSet r=s.executeQuery()){r.next();totalSuccess+=r.getLong(1);totalFailed+=r.getLong(2);}
        }
        }
        result.put("fixture_cases",fixtures.size());result.put("fixture_account_count",totalAccounts);
        result.put("matching_customer_profile_count",totalProfiles);result.put("bcrypt_format_count",totalBcrypt);
        result.put("fixture_successful_logins",totalSuccess);result.put("fixture_failed_logins",totalFailed);
        c.rollback();result.put("status","FIXTURE_"+args[2].toUpperCase(Locale.ROOT)+"_VERIFIED_READONLY");
      }
      SupabaseMetadataProbe.save(output,result);System.out.println(SupabaseMetadataProbe.json(result));
    } catch(Throwable e) {
      result.put("status","FIXTURE_VERIFICATION_FAILED");result.put("exception_class",e.getClass().getSimpleName());
      if(e instanceof SQLException s)result.put("sql_state",s.getSQLState());
      try{if(output!=null)SupabaseMetadataProbe.save(output,result);}catch(Exception ignored){}
      System.out.println(SupabaseMetadataProbe.json(result));System.exit(2);
    }
  }
}
