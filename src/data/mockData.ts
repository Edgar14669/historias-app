import { Story, Category } from "@/types/story";
import storyCover1 from "@/assets/story-cover-1.jpg";
import storyCover2 from "@/assets/story-cover-2.jpg";
import storyCover3 from "@/assets/story-cover-3.jpg";
import storyDetailCover from "@/assets/story-detail-cover.jpg";

export const categories: Category[] = [
  { id: "1", name: "Histórias de Amor", icon: "❤️" },
  { id: "2", name: "Animais", icon: "🐰" },
  { id: "3", name: "Amizade", icon: "🤝" },
  { id: "4", name: "Aventura", icon: "⭐" },
  { id: "5", name: "Fé e Esperança", icon: "✨" },
];

export const stories: Story[] = [
  {
    id: "1",
    title: "Caio e a Semana Santa",
    description: "Caio, um coelhinho curioso, pergunta sua avó Dona Coelha, sobre a Semana Santa. Ela explica de forma simples e divertida os significados de cada dia desde o Domingo de Ramos até o Domingo de Páscoa. Caio aprende sobre sacrifício e renovação, amor, amizade, entendendo que essa época é uma oportunidade de refletir e estar com quem amamos. Uma história que ensina valores importantes de maneira lúdica.",
    coverImage: storyDetailCover,
    category: "Fé e Esperança",
    isPremium: false,
    pages: [
      {
        id: "1-1",
        content: "Era uma vez, em uma vila pequena e cheia de alegria, um coelhinho muito curioso chamado Caio. Ele adorava fazer perguntas sobre tudo!",
        pageNumber: 1,
      },
      {
        id: "1-2",
        content: "Um dia, Caio foi visitar sua avó, Dona Coelha, que sempre tinha as melhores histórias para contar.",
        pageNumber: 2,
      },
      {
        id: "1-3",
        content: "- Vovó, o que é a Semana Santa? - perguntou Caio com seus olhinhos brilhantes de curiosidade.",
        pageNumber: 3,
      },
    ],
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "A Luz da Esperança na Floresta",
    description: "Uma história mágica sobre um pequeno vagalume que ilumina o caminho de seus amigos na floresta escura.",
    coverImage: storyCover1,
    category: "Animais",
    isPremium: false,
    pages: [],
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "3",
    title: "O Milagre da Visão",
    description: "A emocionante história de Bartimeu e sua fé inabalável.",
    coverImage: storyCover2,
    category: "Fé e Esperança",
    isPremium: true,
    pages: [],
    createdAt: new Date("2024-01-08"),
  },
  {
    id: "4",
    title: "A Multiplicação dos Pães",
    description: "O milagre da multiplicação dos pães e peixes contado de forma encantadora.",
    coverImage: storyCover3,
    category: "Fé e Esperança",
    isPremium: true,
    pages: [],
    createdAt: new Date("2024-01-05"),
  },
  {
    id: "5",
    title: "Caim e Abel",
    description: "A história dos dois irmãos e a importância do amor fraternal.",
    coverImage: storyCover1,
    category: "Amizade",
    isPremium: false,
    pages: [],
    createdAt: new Date("2024-01-03"),
  },
  {
    id: "6",
    title: "A Lição do Amor",
    description: "Uma bela história sobre como o amor transforma vidas.",
    coverImage: storyCover2,
    category: "Histórias de Amor",
    isPremium: true,
    pages: [],
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "7",
    title: "O Nascimento de Jesus",
    description: "A história do nascimento de Jesus em Belém contada para crianças.",
    coverImage: storyCover3,
    category: "Fé e Esperança",
    isPremium: false,
    pages: [],
    createdAt: new Date("2023-12-25"),
  },
  {
    id: "8",
    title: "A Fé de Bartimeu",
    description: "Como a fé de um homem cego mudou sua vida para sempre.",
    coverImage: storyDetailCover,
    category: "Fé e Esperança",
    isPremium: true,
    pages: [],
    createdAt: new Date("2023-12-20"),
  },
];

export const featuredStories = stories.slice(0, 3);
export const recommendedStories = stories.slice(3, 6);
export const topStories = stories.slice(0, 6);
