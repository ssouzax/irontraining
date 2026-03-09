-- Allow admins to manage user subscriptions
CREATE POLICY "Admins manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (is_admin());
