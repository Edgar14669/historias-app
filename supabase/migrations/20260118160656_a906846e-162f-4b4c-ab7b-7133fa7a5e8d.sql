-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  is_subscribed BOOLEAN NOT NULL DEFAULT false,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create story_pages table
CREATE TABLE public.story_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create favorite_stories table
CREATE TABLE public.favorite_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, story_id)
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_stories ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = check_user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper function to check if user can read a story
CREATE OR REPLACE FUNCTION public.can_read_story(check_story_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  story_is_premium BOOLEAN;
  user_is_subscribed BOOLEAN;
BEGIN
  SELECT is_premium INTO story_is_premium FROM public.stories WHERE id = check_story_id;
  
  IF NOT story_is_premium THEN
    RETURN true;
  END IF;
  
  IF check_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT is_subscribed INTO user_is_subscribed FROM public.user_profiles WHERE user_id = check_user_id;
  RETURN COALESCE(user_is_subscribed, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Categories policies (anyone can read, only admins can modify)
CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (public.is_admin(auth.uid()));

-- User profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Stories policies (read based on premium/subscription, admins full access)
CREATE POLICY "Users can view accessible stories"
  ON public.stories FOR SELECT
  USING (public.can_read_story(id, auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert stories"
  ON public.stories FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update stories"
  ON public.stories FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete stories"
  ON public.stories FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Story pages policies
CREATE POLICY "Users can view accessible story pages"
  ON public.story_pages FOR SELECT
  USING (public.can_read_story(story_id, auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert story pages"
  ON public.story_pages FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update story pages"
  ON public.story_pages FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete story pages"
  ON public.story_pages FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Favorite stories policies
CREATE POLICY "Users can view their favorites"
  ON public.favorite_stories FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can add favorites"
  ON public.favorite_stories FOR INSERT
  WITH CHECK (user_id = auth.uid() AND public.can_read_story(story_id, auth.uid()));

CREATE POLICY "Users can remove favorites"
  ON public.favorite_stories FOR DELETE
  USING (user_id = auth.uid());

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default categories
INSERT INTO public.categories (name, icon) VALUES
  ('Histórias de Amor', '❤️'),
  ('Animais', '🐰'),
  ('Amizade', '🤝'),
  ('Aventura', '⭐'),
  ('Fé e Esperança', '✨');