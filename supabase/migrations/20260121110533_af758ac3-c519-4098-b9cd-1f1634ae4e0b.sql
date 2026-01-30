-- Permitir que admins deletem visualizações (para zerar)
CREATE POLICY "Admins can delete story views"
ON public.story_views
FOR DELETE
USING (is_admin(auth.uid()));