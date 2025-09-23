do $$
declare v_school uuid; v_class uuid;
begin
  insert into public.schools (name) values ('Demo School')
  on conflict do nothing;

  select id into v_school from public.schools where name='Demo School' limit 1;

  insert into public.classes (school_id, code, name, term, grade, start_date, end_date)
  values (v_school, 'G10-ENG-2025-1', 'Grade 10 English', '2025-1', 10, current_date, current_date + 120)
  on conflict (school_id, code) do nothing;

  insert into public.students (school_id, class_id, student_code, first_name, last_name)
  select v_school, c.id, 'S001', 'Ada', 'Lovelace'
  from public.classes c
  where c.school_id = v_school and c.code = 'G10-ENG-2025-1'
  on conflict (school_id, student_code) do nothing;
end $$;
