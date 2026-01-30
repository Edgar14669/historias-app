export interface Story {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  category: string;
  isPremium: boolean;
  pages: StoryPage[];
  videoUrl?: string;
  createdAt: Date;
}

export interface StoryPage {
  id: string;
  content: string;
  image?: string;
  pageNumber: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isPremium: boolean;
  myList: string[];
}
