delete from public.profiles
where lower(email) = 'livia@hotmail.com';

delete from auth.users
where lower(email) = 'livia@hotmail.com';
