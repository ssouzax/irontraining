
-- Drop the restrictive ALL policy and replace with separate policies
DROP POLICY IF EXISTS "Users can manage own PRs" ON public.personal_records;

-- Allow anyone to view PRs (for gym notifications and leaderboards)
CREATE POLICY "Anyone can view PRs"
ON public.personal_records
FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own PRs
CREATE POLICY "Users can insert own PRs"
ON public.personal_records
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own PRs
CREATE POLICY "Users can update own PRs"
ON public.personal_records
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own PRs
CREATE POLICY "Users can delete own PRs"
ON public.personal_records
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
