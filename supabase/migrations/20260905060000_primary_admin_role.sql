-- CONTROL OS · Primary administrator role repair
-- Keeps the approved internal Auth identity aligned with the UI administrator.

alter table public.profiles disable trigger protect_profile_role;

update public.profiles p
set global_role = 'SUPER_ADMIN',
    status = 'ACTIVE',
    updated_at = now()
from auth.users u
where p.id = u.id
  and lower(u.email) = 'admin@crisdalcompany.com'
  and (
    p.global_role is distinct from 'SUPER_ADMIN'
    or p.status is distinct from 'ACTIVE'
  );

alter table public.profiles enable trigger protect_profile_role;
