
-- Fix overly permissive INSERT policy on gyms
DROP POLICY "Authenticated users can create gyms" ON public.gyms;
CREATE POLICY "Authenticated users can create gyms" ON public.gyms FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
