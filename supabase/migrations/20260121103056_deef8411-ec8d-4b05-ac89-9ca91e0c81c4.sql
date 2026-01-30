-- Adicionar coluna page_image à tabela story_pages para imagens por página
ALTER TABLE public.story_pages 
ADD COLUMN page_image TEXT;