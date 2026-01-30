import { useTranslation } from "@/hooks/useTranslation";
import { TranslationKey } from "@/i18n/translations";

// Mapeamento de nomes de categorias do banco para chaves de tradução
const categoryKeyMap: Record<string, TranslationKey> = {
  "Aventura": "catAdventure",
  "Adventure": "catAdventure",
  "Bíblia": "catBible",
  "Bible": "catBible",
  "Biblia": "catBible",
  "Fábulas": "catFables",
  "Fables": "catFables",
  "Fabulas": "catFables",
  "Fantasia": "catFantasy",
  "Fantasy": "catFantasy",
  "Fantasía": "catFantasy",
  "Amizade": "catFriendship",
  "Friendship": "catFriendship",
  "Amistad": "catFriendship",
  "Amitié": "catFriendship",
  "Freundschaft": "catFriendship",
  "Amicizia": "catFriendship",
  "Natureza": "catNature",
  "Nature": "catNature",
  "Naturaleza": "catNature",
  "Natur": "catNature",
  "Natura": "catNature",
  "Educativo": "catEducational",
  "Educational": "catEducational",
  "Éducatif": "catEducational",
  "Bildung": "catEducational",
  "Para Dormir": "catBedtime",
  "Bedtime": "catBedtime",
  "Pour Dormir": "catBedtime",
  "Gute-Nacht": "catBedtime",
  "Per Dormire": "catBedtime",
};

export function useCategoryTranslation() {
  const { t } = useTranslation();
  
  const translateCategory = (categoryName: string): string => {
    const key = categoryKeyMap[categoryName];
    if (key) {
      return t(key);
    }
    // Se não encontrar mapeamento, retorna o nome original
    return categoryName;
  };
  
  return { translateCategory };
}
