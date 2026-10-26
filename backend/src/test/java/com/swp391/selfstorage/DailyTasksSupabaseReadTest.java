package com.swp391.selfstorage;

import static org.junit.jupiter.api.Assertions.*;
import com.swp391.selfstorage.modules.workforce.entity.DailyTask;
import com.swp391.selfstorage.modules.workforce.repository.DailyTaskRepository;
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
    try(var c=dataSource.getConnection()){
      HandoverMigration015Test.target(c);
      assertNull(HandoverMigration015Test.scalar(c,"select to_regclass('public.staff_tasks')::text"));
      assertNotNull(HandoverMigration015Test.scalar(c,"select to_regclass('public.daily_tasks')::text"));
    }
    var rows=tasks.findByFacilityCode("HN-CG");
    for(var task:rows){assertEquals("HN-CG",task.getFacilityCode());assertNotNull(task.getId());}
    assertTrue(tasks.count()>=rows.size());
    System.out.println("DailyTask PostgreSQL mapping/query PASS; legacy table absent; HN-CG tasks="+rows.size());
  }
}
