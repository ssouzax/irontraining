
-- Groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Group members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Groups policies: public groups visible to all authenticated, private only to members
CREATE POLICY "Anyone can view public groups" ON public.groups
  FOR SELECT TO authenticated
  USING (is_private = false);

CREATE POLICY "Members can view private groups" ON public.groups
  FOR SELECT TO authenticated
  USING (
    is_private = true AND EXISTS (
      SELECT 1 FROM public.group_members gm WHERE gm.group_id = id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create groups" ON public.groups
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group creator can update" ON public.groups
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Group creator can delete" ON public.groups
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- Group members policies
CREATE POLICY "Members can view group members" ON public.group_members
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can join public groups" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND (
      EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.is_private = false)
      OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
    )
  );

CREATE POLICY "Admins can add members to private groups" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
  );

CREATE POLICY "Users can leave groups" ON public.group_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can remove members" ON public.group_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
  );

-- Function to auto-add creator as admin member
CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_group();

-- Function to update member count
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups SET member_count = member_count + 1, updated_at = now() WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups SET member_count = member_count - 1, updated_at = now() WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER on_member_change
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_group_member_count();
