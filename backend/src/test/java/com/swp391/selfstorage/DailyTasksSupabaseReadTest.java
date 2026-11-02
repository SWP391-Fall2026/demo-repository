package com.swp391.selfstorage;

import static org.junit.jupiter.api.Assertions.*;
import com.swp391.selfstorage.modules.workforce.entity.DailyTask;
import com.swp391.selfstorage.modules.workforce.repository.DailyTaskRepository;
import java.util.ArrayList;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;

@EnabledIfSystemProperty(named="daily.tasks.supabase.read",matches="true")
@DataJpaTest(showSql=false,properties={"spring.jpa.hibernate.ddl-auto=validate","spring.jpa.generate-ddl=false",
    "spring.sql.init.mode=never","app.scheduling.enabled=false","spring.datasource.hikari.read-only=true",
    "spring.datasource.hikari.data-source-properties.socketTimeout=20"})
@AutoConfigureTestDatabase(replace=AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("auth-supabase")
class DailyTasksSupabaseReadTest {
  @Autowired DailyTaskRepository tasks;
  @Autowired DataSource dataSource;
  @Autowired Environment environment;

  @Test
  void currentTaskRepositoryWorksWithoutLegacyTable()throws Exception{
    assertEquals("postgres.xnerbsgbwdpemvnatvuy",environment.getProperty("spring.datasource.username"));
    assertEquals("daily_tasks",DailyTask.class.getAnnotation(jakarta.persistence.Table.class).name());
    var facilityCodes = new ArrayList<String>();
    try(var c=dataSource.getConnection()){
      HandoverMigration015Test.target(c);
      assertNull(HandoverMigration015Test.scalar(c,"select to_regclass('public.staff_tasks')::text"));
      assertNotNull(HandoverMigration015Test.scalar(c,"select to_regclass('public.daily_tasks')::text"));
      try (var query = c.prepareStatement("select code from public.facilities order by code");
           var rows = query.executeQuery()) {
        while (rows.next()) facilityCodes.add(rows.getString(1));
      }
    }
    long scopedTaskCount = 0;
    for (String facilityCode : facilityCodes) {
      var rows = tasks.findByFacilityCode(facilityCode);
      for (var task : rows) {
        assertEquals(facilityCode, task.getFacilityCode());
        assertNotNull(task.getId());
      }
      scopedTaskCount += rows.size();
    }
    assertTrue(tasks.count() >= scopedTaskCount);
    System.out.println("DailyTask PostgreSQL mapping/query PASS; legacy table absent; facilities="
      + facilityCodes + "; scoped tasks=" + scopedTaskCount);
  }
}
