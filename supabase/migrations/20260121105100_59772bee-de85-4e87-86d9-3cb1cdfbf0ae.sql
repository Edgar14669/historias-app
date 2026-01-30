-- Create story_views table to track when users view stories
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT, -- For tracking anonymous views
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX idx_story_views_created_at ON public.story_views(created_at);

-- Enable RLS
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert views (including anonymous users)
CREATE POLICY "Anyone can insert story views"
ON public.story_views
FOR INSERT
WITH CHECK (true);

-- Admins can view all story views
CREATE POLICY "Admins can view all story views"
ON public.story_views
FOR SELECT
USING (is_admin(auth.uid()));

-- Users can view their own history
CREATE POLICY "Users can view their own history"
ON public.story_views
FOR SELECT
USING (user_id = auth.uid());