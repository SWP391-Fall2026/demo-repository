package com.swp391.selfstorage;

import static org.junit.jupiter.api.Assertions.*;
import java.nio.file.*;
import java.sql.*;
import java.util.*;
import java.util.regex.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

/** Explicit migration-state audit; ordinary test runs never connect to staging. */
@EnabledIfSystemProperty(named="migration.coverage.enabled",matches="true")
class SupabaseMigrationCoverageTest {
  @Test
  void auditCurrentStagingMigrationEffects() throws Exception {
    var output=HandoverMigration015Test.ROOT.resolve(".tmp/supabase-migration-coverage");
    Files.createDirectories(output);
    try(var c=HandoverMigration015Test.connect(HandoverMigration015Test.stagingEnvironment())){
      c.setReadOnly(true); c.setAutoCommit(false);
      HandoverMigration015Test.sql(c,"set local statement_timeout='20s'");
      HandoverMigration015Test.target(c);
      var catalog=HandoverMigration015Test.catalog(c);
      var definitions=HandoverMigration015Test.permissionsAndIndexes(c);
      var coverage=new LinkedHashMap<String,Object>();
      var missing=new ArrayList<String>();
      Path dir=HandoverMigration015Test.ROOT.resolve("database/migrations");
      try(var files=Files.list(dir)){
        for(Path file:files.sorted().toList()){
          String name=file.getFileName().toString(); if(!name.endsWith(".sql"))continue;
          String source=Files.readString(file);
          if(name.startsWith("001_")){
            coverage.put(name,Map.of("status","SUPERSEDED_REFERENCE_DO_NOT_REPLAY","sha256",HandoverMigration015Test.hash(source)));
            continue;
          }
          var absent=new ArrayList<String>();
          var tables=Pattern.compile("ALTER TABLE public\\.(\\w+)([\\s\\S]*?);").matcher(source);
          while(tables.find()){
            var columns=Pattern.compile("ADD COLUMN(?: IF NOT EXISTS)? (\\w+)").matcher(tables.group(2));
            while(columns.find())if(!catalog.containsKey(tables.group(1)+"."+columns.group(1)))absent.add("column:"+tables.group(1)+"."+columns.group(1));
          }
          var created=Pattern.compile("CREATE TABLE public\\.(\\w+)").matcher(source);
          while(created.find()){
            String table=created.group(1);if(catalog.keySet().stream().noneMatch(k->k.startsWith(table+".")))absent.add("table:"+table);
          }
          var indexes=Pattern.compile("CREATE (?:UNIQUE )?INDEX(?: IF NOT EXISTS)? (\\w+)").matcher(source);
          while(indexes.find())if(!definitions.containsKey("index:"+indexes.group(1)))absent.add("index:"+indexes.group(1));
          var dropped=Pattern.compile("DROP TABLE public\\.(\\w+) RESTRICT").matcher(source);
          while(dropped.find()){
            String table=dropped.group(1);
            if(catalog.keySet().stream().anyMatch(k->k.startsWith(table+".")))absent.add("retirement:"+table+":still-present");
          }
          if(name.startsWith("004_")&&!definitions.getOrDefault("constraint:reservations:reservations_status_check","").contains("NO_SHOW"))absent.add("constraint:reservations_status_check:NO_SHOW");
          if(name.startsWith("009_"))for(String status:List.of("PENDING_PAYMENT","PENDING_HANDOVER","ACTIVE","EXPIRING_SOON","OVERDUE","TERMINATED"))
            if(!definitions.getOrDefault("constraint:contracts:contracts_status_check","").contains(status))absent.add("constraint:contracts_status_check:"+status);
          if(name.startsWith("010_")&&!catalog.getOrDefault("invoices.price_snapshot","").startsWith("text|"))absent.add("type:invoices.price_snapshot:text");
          var entry=new LinkedHashMap<String,Object>();entry.put("status",absent.isEmpty()?"EFFECTS_PRESENT":"MISSING");entry.put("missing",absent);
          entry.put("sha256",HandoverMigration015Test.hash(source));
          if(name.startsWith("011_"))entry.put("note","Do not replay UPDATE that resets every handover status/confirmation timestamp");
          coverage.put(name,entry);missing.addAll(absent);
        }
      }
      var duplicates=new LinkedHashMap<String,String>();
      duplicates.put("facility_manager_groups",HandoverMigration015Test.scalar(c,"select count(*) from (select facility_code from public.users where upper(role) in ('FMANAGER','FACILITY_MANAGER') and facility_code is not null group by facility_code having count(*)>1) d"));
      duplicates.put("admin_expression_groups",HandoverMigration015Test.scalar(c,"select count(*) from (select upper(role) from public.users where upper(role) in ('ADMIN','SYSTEM_ADMIN') group by upper(role) having count(*)>1) d"));
      duplicates.put("operations_expression_groups",HandoverMigration015Test.scalar(c,"select count(*) from (select upper(role) from public.users where upper(role) in ('OPS_MGR','OPS_MANAGER') group by upper(role) having count(*)>1) d"));
      var hashes=HandoverMigration015Test.fingerprints(c);
      int entities=HandoverMigration015Test.validateHibernate(c);
      var report=new LinkedHashMap<String,Object>();report.put("target_project","xnerbsgbwdpemvnatvuy");report.put("migrations",coverage);
      report.put("missing",missing);report.put("duplicate_groups",duplicates);report.put("hibernate_validated_entities",entities);
      report.put("columns",catalog);report.put("catalog",definitions);report.put("business_data_hashes",hashes);
      report.put("finished_at_utc",java.time.Instant.now().toString());report.put("status",missing.isEmpty()?"ALL_CURRENT_MIGRATION_EFFECTS_PRESENT":"PENDING_SCHEMA_EFFECTS");
      c.rollback();
      HandoverMigration015Test.JSON.writerWithDefaultPrettyPrinter().writeValue(output.resolve("audit.json").toFile(),report);
      System.out.println("Migration coverage: entities="+entities+", missing="+missing+", duplicate_groups="+duplicates);
      coverage.forEach((name,value)->System.out.println(name+": "+HandoverMigration015Test.JSON.valueToTree(value).path("status").asText()));
    }
  }
}
