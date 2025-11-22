-- Fix RLS recursion for jam_participants
-- Replace self-referential SELECT policy with SECURITY DEFINER function

CREATE OR REPLACE FUNCTION public.is_member_of_session(sid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM jam_participants p
    WHERE p.jam_session_id = sid
      AND p.user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Users can view session participants" ON public.jam_participants;

CREATE POLICY "Users can view session participants"
ON public.jam_participants
FOR SELECT
TO authenticated
USING (
  public.is_member_of_session(jam_session_id)
);
