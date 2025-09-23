do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='schools' and column_name='short_code'
  ) then
    insert into public.schools(name, short_code, tz)
      select 'Demo School','DEMO','Asia/Taipei'
      where not exists (select 1 from public.schools where name='Demo School');

    update public.schools
       set short_code='DEMO'
     where name='Demo School' and short_code is null;
  end if;
end $$;
