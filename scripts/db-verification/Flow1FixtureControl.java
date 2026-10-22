import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

/** Creates only isolated FLOW1-DEMO units after checking active facility references. */
public final class Flow1FixtureControl {
  private record Fixture(String code, String facility, String type, String size,
      String price, String status) {}

  private static final List<Fixture> FIXTURES = List.of(
      new Fixture("FLOW1-DEMO-HNCG-S", "HN-CG", "S", "3.0", "900000", "available"),
      new Fixture("FLOW1-DEMO-HNCG-L", "HN-CG", "L", "8.0", "1800000", "available"),
      new Fixture("FLOW1-DEMO-Q7-M", "HCM-Q7", "M", "5.0", "1500000", "available"),
      new Fixture("FLOW1-DEMO-Q7-OCC", "HCM-Q7", "M", "5.0", "1500000", "occupied"));

  private Flow1FixtureControl() {}

  public static void main(String[] args) throws Exception {
    if (args.length != 2 || !"insert".equals(args[1])) {
      throw new IllegalArgumentException("Expected private Java properties path and insert");
    }
    Properties config = new Properties();
    try (var reader = Files.newBufferedReader(Path.of(args[0]), StandardCharsets.UTF_8)) {
      config.load(reader);
    }
    String url = required(config, "SUPABASE_DB_URL");
    Properties credentials = new Properties();
    credentials.setProperty("user", required(config, "SUPABASE_DB_USERNAME"));
    credentials.setProperty("password", required(config, "SUPABASE_DB_PASSWORD"));
    credentials.setProperty("connectTimeout", "15");
    credentials.setProperty("socketTimeout", "20");

    try (Connection connection = DriverManager.getConnection(url, credentials)) {
      connection.setAutoCommit(false);
      try (Statement statement = connection.createStatement()) {
        statement.execute("SET LOCAL lock_timeout='3s'");
        statement.execute("SET LOCAL statement_timeout='10s'");
        statement.execute("SET LOCAL search_path=public,pg_catalog");
      }
      for (Fixture fixture : FIXTURES) assertActiveFacility(connection, fixture.facility());
      for (Fixture fixture : FIXTURES) assertMissingUnit(connection, fixture.code());

      String sql = "INSERT INTO public.units "
          + "(code, facility_code, type, size_desc, size_sqm, price_per_month, status, tenant_name, pin_code) "
          + "VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)";
      try (PreparedStatement statement = connection.prepareStatement(sql)) {
        for (Fixture fixture : FIXTURES) {
          statement.setString(1, fixture.code());
          statement.setString(2, fixture.facility());
          statement.setString(3, fixture.type());
          statement.setString(4, fixture.size() + " m²");
          statement.setBigDecimal(5, new java.math.BigDecimal(fixture.size()));
          statement.setBigDecimal(6, new java.math.BigDecimal(fixture.price()));
          statement.setString(7, fixture.status());
          statement.addBatch();
        }
        int[] rows = statement.executeBatch();
        connection.commit();
        System.out.println(json(Map.of(
            "status", "FLOW1_FIXTURE_INSERTED",
            "rows_inserted", rows.length,
            "fixture_prefix", "FLOW1-DEMO",
            "secret_values_exported", false)));
      } catch (Throwable error) {
        connection.rollback();
        throw error;
      }
    }
  }

  private static void assertActiveFacility(Connection connection, String code) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(
        "SELECT status FROM public.facilities WHERE code=?")) {
      statement.setString(1, code);
      try (ResultSet result = statement.executeQuery()) {
        if (!result.next() || !"ACTIVE".equalsIgnoreCase(result.getString(1))) {
          throw new IllegalStateException("Fixture facility is missing or inactive: " + code);
        }
      }
    }
  }

  private static void assertMissingUnit(Connection connection, String code) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(
        "SELECT 1 FROM public.units WHERE code=?")) {
      statement.setString(1, code);
      try (ResultSet result = statement.executeQuery()) {
        if (result.next()) throw new IllegalStateException("Fixture unit already exists: " + code);
      }
    }
  }

  private static String required(Properties config, String key) {
    String value = config.getProperty(key);
    if (value == null || value.isBlank()) throw new IllegalArgumentException("Missing " + key);
    return value;
  }

  private static String json(Map<String, Object> values) {
    StringBuilder result = new StringBuilder("{");
    boolean first = true;
    for (var entry : new LinkedHashMap<>(values).entrySet()) {
      if (!first) result.append(',');
      first = false;
      result.append('"').append(entry.getKey()).append("\":");
      Object value = entry.getValue();
      if (value instanceof Boolean || value instanceof Number) result.append(value);
      else result.append('"').append(value).append('"');
    }
    return result.append('}').toString();
  }
}
