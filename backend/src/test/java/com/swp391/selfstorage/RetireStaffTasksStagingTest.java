package com.swp391.selfstorage;

import static org.junit.jupiter.api.Assertions.*;
import java.nio.file.*;
import java.sql.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

/** Explicit opt-in table retirement. Backups are generated privately, never printed. */
@EnabledIfSystemProperty(named="staff.tasks.retire.mode",matches="inspect|rehearsal|apply")
class RetireStaffTasksStagingTest {
  static final Path OUTPUT=HandoverMigration015Test.ROOT.resolve("var/staff-tasks-retirement");
  static final Path MIGRATION=HandoverMigration015Test.ROOT.resolve("database/migrations/016_retire_unused_staff_tasks.sql");
  final List<String> restore=new ArrayList<>();

  String quote(String value){return "\""+value.replace("\"","\"\"")+"\"";}
  String literal(String value){return value==null?"NULL":"'"+value.replace("'","''")+"'";}
  List<String> values(Connection c,String query)throws Exception{
    var out=new ArrayList<String>();try(var s=c.createStatement();var r=s.executeQuery(query)){while(r.next())out.add(r.getString(1));}return out;
  }
  String scalar(Connection c,String query)throws Exception{return HandoverMigration015Test.scalar(c,query);}
  void sql(Connection c,String value)throws Exception{HandoverMigration015Test.sql(c,value);}
  String rowsHash(Connection c)throws Exception{
    return scalar(c,"select count(*)::text||':'||md5(coalesce(string_agg(h,'' order by h),'')) from (select md5(to_jsonb(t)::text) h from public.staff_tasks t) q");
  }

  Map<String,Object> preflight(Connection c)throws Exception{
    var details=new LinkedHashMap<String,Object>();
    assertNotNull(scalar(c,"select to_regclass('public.staff_tasks')::text"),"Table absent; do not repeat deletion");
    var references=new ArrayList<String>();
    try(var files=Files.walk(HandoverMigration015Test.ROOT.resolve("backend/src/main"))){
      for(var file:files.filter(Files::isRegularFile).toList()){
        String name=file.toString();if(!(name.endsWith(".java")||name.endsWith(".properties")||name.endsWith(".xml")||name.endsWith(".sql")))continue;
        if(Files.readString(file).matches("(?is).*\\bstaff_tasks?\\b.*"))references.add(HandoverMigration015Test.ROOT.relativize(file).toString());
      }
    }
    assertTrue(references.isEmpty(),"Backend still references staff_tasks");details.put("backend_references",references);
    assertEquals("0",scalar(c,"select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosrc ilike '%staff_tasks%'"),"Database routine text refers to staff_tasks; review before deletion");
    details.put("foreign_keys_incoming",values(c,"select conname from pg_constraint where confrelid='public.staff_tasks'::regclass and conrelid<>confrelid"));
    details.put("dependent_views",values(c,"select distinct v.relname from pg_depend d join pg_rewrite r on r.oid=d.objid join pg_class v on v.oid=r.ev_class where d.refobjid='public.staff_tasks'::regclass and d.classid='pg_rewrite'::regclass and v.oid<>'public.staff_tasks'::regclass"));
    assertTrue(((List<?>)details.get("foreign_keys_incoming")).isEmpty(),"Incoming foreign keys exist");
    assertTrue(((List<?>)details.get("dependent_views")).isEmpty(),"Dependent views exist");
    details.put("row_count",scalar(c,"select count(*) from public.staff_tasks"));
    details.put("data_hash",rowsHash(c));
    details.put("publication_memberships",values(c,"select pubname from pg_publication_tables where schemaname='public' and tablename='staff_tasks'"));
    return details;
  }

  void backup(Connection c)throws Exception{
    var columns=new ArrayList<String>();
    var identifiers=new ArrayList<String>();
    try(var s=c.createStatement();var r=s.executeQuery("""
        select a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,pg_get_expr(d.adbin,d.adrelid),a.attidentity,a.attgenerated
        from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
        where a.attrelid='public.staff_tasks'::regclass and a.attnum>0 and not a.attisdropped order by a.attnum
        """)){
      while(r.next()){
        assertEquals("",r.getString(5),"Identity column needs pg_dump");assertEquals("",r.getString(6),"Generated column needs pg_dump");
        String id=quote(r.getString(1));identifiers.add(id);
        columns.add(id+" "+r.getString(2)+(r.getString(4)==null?"":" DEFAULT "+r.getString(4))+(r.getBoolean(3)?" NOT NULL":""));
      }
    }
    restore.add("CREATE TABLE public.staff_tasks ("+String.join(",",columns)+")");
    restore.addAll(values(c,"select 'ALTER TABLE public.staff_tasks ADD CONSTRAINT '||quote_ident(conname)||' '||pg_get_constraintdef(oid,true) from pg_constraint where conrelid='public.staff_tasks'::regclass order by conname"));
    restore.addAll(values(c,"select pg_get_indexdef(i.indexrelid) from pg_index i where i.indrelid='public.staff_tasks'::regclass and not exists(select 1 from pg_constraint k where k.conindid=i.indexrelid)"));
    String json=scalar(c,"select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb)::text from public.staff_tasks t");
    restore.add("INSERT INTO public.staff_tasks ("+String.join(",",identifiers)+") SELECT "+String.join(",",identifiers)+" FROM jsonb_populate_recordset(NULL::public.staff_tasks,"+literal(json)+"::jsonb)");
    restore.addAll(values(c,"select pg_get_triggerdef(oid,true) from pg_trigger where tgrelid='public.staff_tasks'::regclass and not tgisinternal"));
    try(var s=c.createStatement();var r=s.executeQuery("select polname,polpermissive,polroles,polcmd,pg_get_expr(polqual,polrelid),pg_get_expr(polwithcheck,polrelid) from pg_policy where polrelid='public.staff_tasks'::regclass order by polname")){
      while(r.next()){
        String roles=scalar(c,"select string_agg(case when x=0 then 'PUBLIC' else quote_ident(pg_get_userbyid(x)) end,',') from unnest('"+r.getString(3)+"'::oid[]) x");
        String cmd=switch(r.getString(4)){case "r"->"SELECT";case "a"->"INSERT";case "w"->"UPDATE";case "d"->"DELETE";default->"ALL";};
        restore.add("CREATE POLICY "+quote(r.getString(1))+" ON public.staff_tasks AS "+(r.getBoolean(2)?"PERMISSIVE":"RESTRICTIVE")+" FOR "+cmd+" TO "+roles+(r.getString(5)==null?"":" USING ("+r.getString(5)+")")+(r.getString(6)==null?"":" WITH CHECK ("+r.getString(6)+")"));
      }
    }
    String owner=scalar(c,"select pg_get_userbyid(relowner) from pg_class where oid='public.staff_tasks'::regclass");
    restore.add("ALTER TABLE public.staff_tasks OWNER TO "+quote(owner));
    restore.add("REVOKE ALL ON public.staff_tasks FROM PUBLIC");
    for(String role:values(c,"select rolname from pg_roles where rolname in ('anon','authenticated','service_role')"))restore.add("REVOKE ALL ON public.staff_tasks FROM "+quote(role));
    restore.addAll(values(c,"select 'GRANT '||a.privilege_type||' ON public.staff_tasks TO '||case when a.grantee=0 then 'PUBLIC' else quote_ident(pg_get_userbyid(a.grantee)) end||case when a.is_grantable then ' WITH GRANT OPTION' else '' end from pg_class c,lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a where c.oid='public.staff_tasks'::regclass"));
    if("true".equals(scalar(c,"select relrowsecurity::text from pg_class where oid='public.staff_tasks'::regclass")))restore.add("ALTER TABLE public.staff_tasks ENABLE ROW LEVEL SECURITY");
    if("true".equals(scalar(c,"select relforcerowsecurity::text from pg_class where oid='public.staff_tasks'::regclass")))restore.add("ALTER TABLE public.staff_tasks FORCE ROW LEVEL SECURITY");
    String comment=scalar(c,"select obj_description('public.staff_tasks'::regclass,'pg_class')");
    if(comment!=null)restore.add("COMMENT ON TABLE public.staff_tasks IS "+literal(comment));
    for(String publication:values(c,"select p.pubname from pg_publication p join pg_publication_rel r on r.prpubid=p.oid where r.prrelid='public.staff_tasks'::regclass"))restore.add("ALTER PUBLICATION "+quote(publication)+" ADD TABLE public.staff_tasks");
    // Backup contains legacy business rows: private ignored location, never terminal output.
    Files.writeString(OUTPUT.resolve("restore-staff_tasks.private.sql"),"BEGIN;\nSET LOCAL search_path=public,pg_catalog;\n"+String.join(";\n",restore)+";\nCOMMIT;\n");
  }

  @Test
  void retireLegacyTable()throws Exception{
    Files.createDirectories(OUTPUT);String mode=System.getProperty("staff.tasks.retire.mode");
    String migration=Files.readString(MIGRATION);assertEquals("DROP TABLE public.staff_tasks RESTRICT;",migration.replaceAll("(?m)--.*$","").trim());
    var report=new LinkedHashMap<String,Object>();report.put("mode",mode);report.put("project","xnerbsgbwdpemvnatvuy");report.put("migration_sha256",HandoverMigration015Test.hash(migration));
    boolean committed=false;
    try(var c=HandoverMigration015Test.connect(HandoverMigration015Test.stagingEnvironment())){
      c.setAutoCommit(false);HandoverMigration015Test.target(c);
      sql(c,"set local lock_timeout='5s'");sql(c,"set local statement_timeout='20s'");
      sql(c,"set local idle_in_transaction_session_timeout='120s'");
      assertEquals("true",scalar(c,"select pg_try_advisory_xact_lock(391,20261016)::text"));
      try{
        if(!mode.equals("inspect"))sql(c,"lock table public.staff_tasks in access exclusive mode");
        report.put("phase","preflight");var before=preflight(c);report.put("preflight",before);
        var shape=HandoverMigration015Test.catalog(c);var definitions=HandoverMigration015Test.permissionsAndIndexes(c);
        var business=HandoverMigration015Test.fingerprints(c);report.put("phase","backup");backup(c);
        String backupHash=HandoverMigration015Test.hash(Files.readString(OUTPUT.resolve("restore-staff_tasks.private.sql")));report.put("backup_sha256",backupHash);
        if(mode.equals("inspect")){c.rollback();report.put("status","INSPECTED_BACKED_UP_NO_DROP");}
        else{
          if(mode.equals("apply")){
            var rehearsal=HandoverMigration015Test.JSON.readTree(OUTPUT.resolve("rehearsal.json").toFile());
            assertEquals("REHEARSAL_RESTORED_AND_ROLLED_BACK",rehearsal.path("status").asText());
            assertEquals(report.get("migration_sha256"),rehearsal.path("migration_sha256").asText());
            assertEquals(before.get("data_hash"),rehearsal.path("preflight").path("data_hash").asText());
          }
          report.put("phase","drop-and-validate");sql(c,"DROP TABLE public.staff_tasks RESTRICT");assertNull(scalar(c,"select to_regclass('public.staff_tasks')::text"));
          report.put("hibernate_validated_entities",HandoverMigration015Test.validateHibernate(c));
          assertEquals(business,HandoverMigration015Test.fingerprints(c));
          if(mode.equals("rehearsal")){
            report.put("phase","restore-backup");for(String statement:restore)sql(c,statement);
            assertEquals(before.get("data_hash"),rowsHash(c));
            assertEquals(shape,HandoverMigration015Test.catalog(c));
            // Compare policy definitions/ACL/index catalog after restoring, excluding catalog OIDs.
            assertEquals(definitions,HandoverMigration015Test.permissionsAndIndexes(c));
            c.rollback();assertEquals(before.get("data_hash"),rowsHash(c));c.rollback();
            report.put("status","REHEARSAL_RESTORED_AND_ROLLED_BACK");
          }else{
            c.commit();committed=true;
            assertNull(scalar(c,"select to_regclass('public.staff_tasks')::text"));
            assertEquals(business,HandoverMigration015Test.fingerprints(c));c.rollback();
            report.put("status","DROPPED_COMMITTED_AND_RECHECKED");
          }
        }
      }catch(Throwable error){if(!committed)c.rollback();report.put("status",committed?"COMMITTED_POSTCHECK_FAILED":"FAILED_ROLLED_BACK");report.put("error_class",error.getClass().getSimpleName());if(error instanceof SQLException e)report.put("sqlstate",e.getSQLState());throw new AssertionError("staff_tasks retirement failed: "+error.getClass().getSimpleName());}
      finally{report.put("committed",committed);report.put("finished_at_utc",java.time.Instant.now().toString());HandoverMigration015Test.JSON.writerWithDefaultPrettyPrinter().writeValue(OUTPUT.resolve(mode+".json").toFile(),report);System.out.println("staff_tasks "+mode+": "+report.get("status")+", committed="+committed);}
    }
  }
}
