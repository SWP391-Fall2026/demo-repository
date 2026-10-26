package com.swp391.selfstorage;

import static org.junit.jupiter.api.Assertions.*;
import java.sql.*;
import java.nio.file.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

@EnabledIfSystemProperty(named="handover.fixture.recovery",matches="true")
class HandoverStagingFixtureRecoveryTest {
  void run(Connection c,String query,String value) throws Exception {
    try(var s=c.prepareStatement(query)){s.setString(1,value);s.executeUpdate();}
  }

  @Test
  void recoverOnlyVerifiedSyntheticFixtures() throws Exception {
    var prefixes=new TreeSet<String>();
    Path manifest=HandoverMigration015Test.OUTPUT.resolve("fixture-prefixes.txt");
    if(Files.exists(manifest))for(String prefix:Files.readAllLines(manifest)){
      assertTrue(prefix.matches("HR[0-9a-f]{8}"));prefixes.add(prefix);
    }
    try(var c=HandoverMigration015Test.connect(HandoverMigration015Test.stagingEnvironment())){
      c.setAutoCommit(false);HandoverMigration015Test.target(c);
      HandoverMigration015Test.sql(c,"set local statement_timeout='15s'");
      HandoverMigration015Test.sql(c,"set local lock_timeout='5s'");
      // Recover the interrupted pre-manifest run only if all fixture naming/content invariants match.
      try(var s=c.createStatement();var r=s.executeQuery("select code from public.facilities where code ~ '^HR[0-9a-f]{8}-F$' and name=code and address='Test' and city='Test'")){
        while(r.next())prefixes.add(r.getString(1).substring(0,10));
      }
      for(String prefix:prefixes){
        assertTrue(prefix.matches("HR[0-9a-f]{8}"));
        try(var s=c.prepareStatement("select count(*) from public.users where id like ? and (username<>id or email<>id||'@handover.invalid' or name not like 'Synthetic %')")){
          s.setString(1,prefix+"%");try(var r=s.executeQuery()){r.next();assertEquals(0,r.getLong(1),"Refusing cleanup: synthetic identity mismatch");}
        }
        String rid=prefix+"-R";
        run(c,"delete from public.audit_logs where user_id like ?",prefix+"%");
        run(c,"delete from public.audit_logs where entity_id in (select id from public.handover_reviews where reservation_id=?)",rid);
        run(c,"delete from public.refund_transactions where refund_request_id in (select id from public.refund_requests where reservation_id=?)",rid);
        run(c,"delete from public.refund_requests where reservation_id=?",rid);
        run(c,"delete from public.handover_review_evidence where review_id in (select id from public.handover_reviews where reservation_id=?)",rid);
        run(c,"delete from public.handover_reviews where reservation_id=?",rid);
        run(c,"delete from public.handover_records where reservation_id=?",rid);
        run(c,"delete from public.daily_tasks where reservation_id=?",rid);
        run(c,"delete from public.payments where reservation_id=?",rid);
        run(c,"delete from public.invoices where reservation_id=?",rid);
        run(c,"delete from public.contracts where reservation_id=?",rid);
        run(c,"update public.units set held_by_reservation_id=null where code=?",prefix+"-U");
        run(c,"delete from public.reservations where id=?",rid);
        run(c,"delete from public.units where code=?",prefix+"-U");
        run(c,"delete from public.users where id like ?",prefix+"%");
        run(c,"delete from public.facilities where code like ?",prefix+"%");
      }
      var baseline=HandoverMigration015Test.JSON.readTree(HandoverMigration015Test.OUTPUT.resolve("apply.json").toFile()).get("baseline_data_hashes");
      assertEquals(baseline,HandoverMigration015Test.JSON.valueToTree(HandoverMigration015Test.fingerprints(c)),"Historical data does not match pre-migration baseline");
      c.commit();
      HandoverMigration015Test.JSON.writerWithDefaultPrettyPrinter().writeValue(HandoverMigration015Test.OUTPUT.resolve("fixture-recovery.json").toFile(),
          Map.of("verified_synthetic_prefixes_cleaned",prefixes.size(),"historical_data_matches_migration_baseline",true,"finished_at_utc",java.time.Instant.now().toString()));
      System.out.println("Synthetic fixture recovery PASS; prefixes="+prefixes.size()+"; historical data unchanged");
    }
  }
}
