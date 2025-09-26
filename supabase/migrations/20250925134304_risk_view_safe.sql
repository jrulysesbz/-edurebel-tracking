do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='students' and column_name='class_id'
  ) then
    execute $v$
      create or replace view public.v_student_risk as
      select
        s.id        as student_id,
        s.class_id,
        s.school_id,
        0::int      as risk_score
      from public.students s
    $v$;
  else
    execute $v$
      create or replace view public.v_student_risk as
      select
        s.id        as student_id,
        s.school_id,
        0::int      as risk_score
      from public.students s
    $v$;
  end if;
end$$;

notify pgrst, 'reload schema';
