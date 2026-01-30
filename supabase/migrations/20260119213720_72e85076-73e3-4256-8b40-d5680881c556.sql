-- Add language column to stories table
ALTER TABLE public.stories 
ADD COLUMN language text NOT NULL DEFAULT 'pt';

-- Update RLS policy for stories to allow public read access
DROP POLICY IF EXISTS "Users can view accessible stories" ON public.stories;
CREATE POLICY "Anyone can view stories" 
ON public.stories 
FOR SELECT 
USING (true);

-- Update RLS policy for story_pages to allow public read access
DROP POLICY IF EXISTS "Users can view accessible story pages" ON public.story_pages;
CREATE POLICY "Anyone can view story pages" 
ON public.story_pages 
FOR SELECT 
USING (true);