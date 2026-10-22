import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.mail.javamail.JavaMailSenderImpl;

/** Authentication/connection only: never sends email, prints credentials or provider text. */
public class SmtpConnectionProbe {
  public static void main(String[] args) {
    Map<String,Object> result=new LinkedHashMap<>();
    result.put("checked_at_utc",java.time.Instant.now().toString());result.put("email_sent",false);
    Properties p=new Properties();
    try {
      if(args.length!=2)throw new IllegalArgumentException("Expected approved private config and evidence output path");
      try(var r=Files.newBufferedReader(Path.of(args[0]),StandardCharsets.UTF_8)){p.load(r);}
      String host=p.getProperty("AUTH_SMTP_HOST","");
      if(!host.matches("[A-Za-z0-9.-]+"))throw new IllegalArgumentException("SMTP hostname format invalid");
      result.put("smtp_host",host);result.put("smtp_port",p.getProperty("AUTH_SMTP_PORT","587"));
      String username=p.getProperty("AUTH_SMTP_USERNAME","");
      String password=p.getProperty("AUTH_SMTP_PASSWORD","");
      result.put("username_has_outer_whitespace",!username.equals(username.strip()));
      result.put("password_has_outer_whitespace",!password.equals(password.strip()));
      result.put("password_contains_space",password.contains(" "));
      result.put("username_is_literal_apikey",username.equals("apikey"));
      JavaMailSenderImpl sender=new JavaMailSenderImpl();sender.setHost(host);
      sender.setPort(Integer.parseInt(p.getProperty("AUTH_SMTP_PORT","587")));
      sender.setUsername(p.getProperty("AUTH_SMTP_USERNAME"));sender.setPassword(p.getProperty("AUTH_SMTP_PASSWORD"));
      Properties options=sender.getJavaMailProperties();options.setProperty("mail.smtp.auth","true");
      options.setProperty("mail.smtp.starttls.enable","true");options.setProperty("mail.smtp.starttls.required","true");
      options.setProperty("mail.smtp.connectiontimeout","5000");options.setProperty("mail.smtp.timeout","5000");
      options.setProperty("mail.smtp.writetimeout","5000");options.setProperty("mail.debug","false");
      sender.testConnection();result.put("status","SMTP_CONNECTION_AUTHENTICATED");
    } catch(Throwable e) {
      List<String> classes=new ArrayList<>();for(Throwable t=e;t!=null;t=t.getCause())classes.add(t.getClass().getSimpleName());
      result.put("status",classes.contains("AuthenticationFailedException")?"SMTP_AUTHENTICATION_FAILED":"SMTP_CONNECTION_FAILED");
      result.put("cause_classes",classes);
      // Inspect enhanced status codes locally, without exporting provider message/address/secret.
      Set<String> codes=new TreeSet<>();
      for(Throwable t=e;t!=null;t=t.getCause()) {
        var matcher=java.util.regex.Pattern.compile("(?<![0-9])(?:[245][0-9]{2}|[245]\\.[0-9]\\.[0-9]{1,3})(?![0-9])").matcher(Objects.toString(t.getMessage(),""));
        while(matcher.find())codes.add(matcher.group());
      }
      result.put("smtp_status_codes",codes);
      List<String> reasons=new ArrayList<>();
      for(Throwable t=e;t!=null;t=t.getCause()) {
        String reason=Objects.toString(t.getMessage(),"");
        for(String key:List.of("AUTH_SMTP_USERNAME","AUTH_SMTP_PASSWORD","AUTH_MAIL_FROM","SUPABASE_DB_PASSWORD","JWT_SECRET")) {
          String secret=p.getProperty(key,"");
          if(!secret.isEmpty()) {
            reason=reason.replace(secret,"[REDACTED]");
            reason=reason.replace(Base64.getEncoder().encodeToString(secret.getBytes(StandardCharsets.UTF_8)),"[REDACTED]");
          }
        }
        reason=reason.replaceAll("[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}","[ADDRESS]");
        reason=reason.replaceAll("https?://[^\\s]+","[PROVIDER_LINK]");
        reason=reason.replaceAll("[A-Za-z0-9_+/=\\-]{24,}","[OPAQUE]");
        if(!reason.isBlank())reasons.add(reason.substring(0,Math.min(reason.length(),500)));
      }
      result.put("provider_reasons_redacted",reasons);
    }
    result.put("secret_values_exported",false);
    try {
      String json=SupabaseMetadataProbe.json(result);Files.writeString(Path.of(args[1]),json+"\n",StandardCharsets.UTF_8);
      System.out.println(json);
    } catch(Exception e) {System.out.println("SMTP evidence output failed; provider details withheld");System.exit(2);}
  }
}
