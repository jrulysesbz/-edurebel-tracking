alter table public.students
  add column if not exists class_id uuid;

alter table public.students
  add constraint students_class_id_fkey
  foreign key (class_id) references public.classes(id)
  on delete set null;

notify pgrst, 'reload schema';
