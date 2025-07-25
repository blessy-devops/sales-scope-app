-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id uuid references auth.users(id) primary key,
  email text unique not null,
  full_name text not null,
  first_login boolean default true,
  created_at timestamp with time zone default now(),
  created_by uuid references auth.users(id)
);

-- Create system_settings table
CREATE TABLE public.system_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text not null,
  updated_at timestamp with time zone default now()
);

-- Insert initial invite code
INSERT INTO public.system_settings (key, value) VALUES ('invite_code', 'meta-realizado');

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, first_login)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', true);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_profiles
CREATE POLICY "Authenticated users can view all profiles" 
ON public.user_profiles 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert profiles" 
ON public.user_profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete profiles" 
ON public.user_profiles 
FOR DELETE 
TO authenticated 
USING (true);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for system_settings
CREATE POLICY "Authenticated users can view system settings" 
ON public.system_settings 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can update system settings" 
ON public.system_settings 
FOR UPDATE 
TO authenticated 
USING (true);