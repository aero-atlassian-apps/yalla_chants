CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  desired_code TEXT;
  country_uuid UUID;
BEGIN
  desired_code := COALESCE(NEW.raw_user_meta_data->>'country_code', 'MA');
  SELECT id INTO country_uuid FROM public.countries 
    WHERE lower(code) = lower(desired_code) OR lower(name) = lower('Morocco')
    ORDER BY name ASC
    LIMIT 1;

  INSERT INTO public.user_profiles (id, username, display_name, country_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    country_uuid
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
