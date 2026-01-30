-- Create story_translations table for translated titles and descriptions
CREATE TABLE public.story_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (story_id, language)
);

-- Create story_page_translations table for translated page content
CREATE TABLE public.story_page_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_page_id UUID NOT NULL REFERENCES public.story_pages(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (story_page_id, language)
);

-- Enable Row Level Security
ALTER TABLE public.story_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_page_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for story_translations
CREATE POLICY "Anyone can view story translations"
ON public.story_translations
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert story translations"
ON public.story_translations
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update story translations"
ON public.story_translations
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete story translations"
ON public.story_translations
FOR DELETE
USING (is_admin(auth.uid()));

-- RLS Policies for story_page_translations
CREATE POLICY "Anyone can view story page translations"
ON public.story_page_translations
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert story page translations"
ON public.story_page_translations
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update story page translations"
ON public.story_page_translations
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete story page translations"
ON public.story_page_translations
FOR DELETE
USING (is_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_story_translations_updated_at
BEFORE UPDATE ON public.story_translations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_story_page_translations_updated_at
BEFORE UPDATE ON public.story_page_translations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();