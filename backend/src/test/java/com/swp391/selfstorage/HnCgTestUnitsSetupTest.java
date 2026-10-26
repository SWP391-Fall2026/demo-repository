package com.swp391.selfstorage;

import static org.junit.jupiter.api.Assertions.*;
import java.math.BigDecimal;
import java.sql.*;
import java.nio.file.Files;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

/** Explicitly requested persistent staging units, never part of ordinary test/seed startup. */
@EnabledIfSystemProperty(named="hncg.units.mode", matches="inspect|create")
class HnCgTestUnitsSetupTest {
  record Template(String code,String type,BigDecimal size,BigDecimal price) {}

  @Test
  void addEightRequestedUnits() throws Exception {
    String mode=System.getProperty("hncg.units.mode");
    var output=HandoverMigration015Test.ROOT.resolve(".tmp/hncg-test-units");
    Files.createDirectories(output);
    try(var c=HandoverMigration015Test.connect(HandoverMigration015Test.stagingEnvironment())){
      c.setAutoCommit(false);
      try {
        HandoverMigration015Test.target(c);
        HandoverMigration015Test.sql(c,"set local lock_timeout='5s'");
        HandoverMigration015Test.sql(c,"set local statement_timeout='15s'");
        HandoverMigration015Test.sql(c,"set local search_path=public,pg_catalog");
        try(var s=c.prepareStatement("select status from public.facilities where code='HN-CG' for update");var r=s.executeQuery()){
          assertTrue(r.next()); assertEquals("ACTIVE",r.getString(1).toUpperCase());
        }
        var templates=new HashMap<String,Template>();
        for(String code:List.of("FLOW1-DEMO-HNCG-S","A-112","A-117")){
          try(var s=c.prepareStatement("select type,size_sqm,price_per_month from public.units where facility_code='HN-CG' and code=?")){
            s.setString(1,code);try(var r=s.executeQuery()){
              assertTrue(r.next(),"Missing existing template: "+code);
              templates.put(r.getString(1),new Template(code,r.getString(1),r.getBigDecimal(2),r.getBigDecimal(3)));
            }
          }
        }
        var rows=new ArrayList<Map<String,Object>>();
        for(int i=1;i<=8;i++){
          String type=i<=3?"S":i<=6?"M":"L";
          Template template=templates.get(type);assertNotNull(template);
          BigDecimal base=policy(c,"price."+type,switch(type){case "S"->new BigDecimal("800000");case "M"->new BigDecimal("1450000");default->new BigDecimal("2800000");});
          BigDecimal min=policy(c,"price.min."+type,base),max=policy(c,"price.max."+type,base);
          BigDecimal price=template.price().max(min).min(max);assertTrue(min.compareTo(max)<=0);
          assertTrue(template.size().signum()>0 && template.price().signum()>0);
          String code="HN-CG-TEST-20261026-"+String.format("%02d",i);
          rows.add(Map.of("code",code,"facilityCode","HN-CG","type",type,"sizeSqm",template.size(),
              "pricePerMonth",price,"status","available","sourceTemplate",template.code()));
        }
        long before=Long.parseLong(HandoverMigration015Test.scalar(c,"select count(*) from public.units where facility_code='HN-CG'"));
        var baseline=HandoverMigration015Test.fingerprints(c);
        String oldUnits=oldUnitsHash(c);
        var report=new LinkedHashMap<String,Object>();report.put("mode",mode);report.put("project","xnerbsgbwdpemvnatvuy");
        report.put("facility","HN-CG");report.put("units",rows);report.put("count_before",before);
        if(mode.equals("create")){
          String sql="insert into public.units(code,facility_code,type,size_desc,size_sqm,price_per_month,status,floor,tenant_name,pin_code,temporary_pin,temporary_pin_expires_at,held_by_reservation_id) values (?,'HN-CG',?,?,?,?,'available',0,null,null,null,null,null)";
          try(var s=c.prepareStatement(sql)){
            for(var row:rows){
              s.setString(1,(String)row.get("code"));s.setString(2,(String)row.get("type"));
              s.setString(3,row.get("sizeSqm")+" m²");s.setBigDecimal(4,(BigDecimal)row.get("sizeSqm"));
              s.setBigDecimal(5,(BigDecimal)row.get("pricePerMonth"));assertEquals(1,s.executeUpdate());
            }
          }
          long after=Long.parseLong(HandoverMigration015Test.scalar(c,"select count(*) from public.units where facility_code='HN-CG'"));
          assertEquals(before+8,after);
          var updated=HandoverMigration015Test.fingerprints(c);
          for(var entry:baseline.entrySet())if(!entry.getKey().equals("units"))
            assertEquals(entry.getValue(),updated.get(entry.getKey()),"Unrelated table changed");
          assertEquals(oldUnits,oldUnitsHash(c),"Existing units changed");
          assertEquals("8",HandoverMigration015Test.scalar(c,"select count(*) from public.units where code like 'HN-CG-TEST-20261026-%' and facility_code='HN-CG' and status='available' and pin_code is null and held_by_reservation_id is null"));
          c.commit();report.put("status","CREATED_COMMITTED");report.put("count_after",after);
          assertEquals("8",HandoverMigration015Test.scalar(c,"select count(*) from public.units where code like 'HN-CG-TEST-20261026-%' and facility_code='HN-CG'"));
          c.rollback();
        }else {c.rollback();report.put("status","INSPECTED_NO_WRITE");}
        report.put("finished_at_utc",java.time.Instant.now().toString());
        HandoverMigration015Test.JSON.writerWithDefaultPrettyPrinter().writeValue(output.resolve(mode+".json").toFile(),report);
        System.out.println(HandoverMigration015Test.JSON.writeValueAsString(report));
      } catch(Throwable error){c.rollback();throw error;}
    }
  }

  BigDecimal policy(Connection c,String key,BigDecimal fallback)throws Exception{
    try(var s=c.prepareStatement("select policy_value from public.business_policies where policy_key=?")){
      s.setString(1,key);try(var r=s.executeQuery()){return r.next()?new BigDecimal(r.getString(1)):fallback;}
    }
  }

  String oldUnitsHash(Connection c)throws Exception{
    return HandoverMigration015Test.scalar(c,"select md5(coalesce(string_agg(h,'' order by h),'')) from (select md5(to_jsonb(u)::text) h from public.units u where code not like 'HN-CG-TEST-20261026-%') q");
  }
}
