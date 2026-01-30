-- Create storage bucket for story covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-covers', 'story-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view story covers (public bucket)
CREATE POLICY "Anyone can view story covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'story-covers');

-- Allow admins to upload story covers
CREATE POLICY "Admins can upload story covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'story-covers' AND is_admin(auth.uid()));

-- Allow admins to update story covers
CREATE POLICY "Admins can update story covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'story-covers' AND is_admin(auth.uid()));

-- Allow admins to delete story covers
CREATE POLICY "Admins can delete story covers"
ON storage.objects FOR DELETE
USING (bucket_id = 'story-covers' AND is_admin(auth.uid()));