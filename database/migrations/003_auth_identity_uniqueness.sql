-- Same atomic migration group as 002. Preflight aggregate counts must show no collisions.
-- Match current source: IgnoreCase lookup and ASCII space/dot/hyphen phone comparison.
-- No UPDATE/trim/case conversion of historical values. Existing exact UNIQUEs remain.
CREATE UNIQUE INDEX ux_users_username_ci ON public.users (lower(username));
CREATE UNIQUE INDEX ux_users_email_ci ON public.users (lower(email));
-- Missing/blank legacy phones do not represent a usable registration phone number.
CREATE UNIQUE INDEX ux_users_phone_normalized ON public.users
  (nullif(replace(replace(replace(phone, ' ', ''), '.', ''), '-', ''), ''));
