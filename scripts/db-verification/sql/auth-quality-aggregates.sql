-- Authorized staging migration preflight. SELECT aggregates only; no row values/PII/hash.
SELECT current_database() AS database_name, current_user AS database_role,
       session_user AS session_role, current_schema() AS schema_name,
       current_setting('transaction_read_only') AS read_only;

SELECT count(*) AS users_total,
       count(*) FILTER (WHERE username IS NULL) AS null_usernames,
       count(*) FILTER (WHERE email IS NULL) AS null_emails,
       count(*) FILTER (WHERE phone IS NULL) AS null_phones,
       count(*) FILTER (WHERE phone IS NOT NULL AND
         replace(replace(replace(phone, ' ', ''), '.', ''), '-', '') = '') AS blank_normalized_phones,
       count(*) FILTER (WHERE phone ~ E'[\\t\\n\\r\\f\\v]') AS phones_with_other_ascii_whitespace
FROM public.users;

SELECT 'username_case_insensitive' AS invariant, count(*) AS duplicate_groups,
       coalesce(sum(n - 1), 0) AS excess_rows
FROM (SELECT count(*) AS n FROM public.users WHERE username IS NOT NULL
      GROUP BY lower(username) HAVING count(*) > 1) AS collisions;

SELECT 'email_case_insensitive' AS invariant, count(*) AS duplicate_groups,
       coalesce(sum(n - 1), 0) AS excess_rows
FROM (SELECT count(*) AS n FROM public.users WHERE email IS NOT NULL
      GROUP BY lower(email) HAVING count(*) > 1) AS collisions;

SELECT 'phone_normalized_ascii_space_dot_hyphen' AS invariant,
       count(*) AS duplicate_groups, coalesce(sum(n - 1), 0) AS excess_rows
FROM (SELECT count(*) AS n FROM public.users
      WHERE nullif(replace(replace(replace(phone, ' ', ''), '.', ''), '-', ''), '') IS NOT NULL
      GROUP BY nullif(replace(replace(replace(phone, ' ', ''), '.', ''), '-', ''), '')
      HAVING count(*) > 1) AS collisions;
