-- Add video_url column to stories table
ALTER TABLE public.stories 
ADD COLUMN video_url TEXT;