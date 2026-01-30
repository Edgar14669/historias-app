import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Trash2, Save, Loader2, Check, Eye, EyeOff, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import DOMPurify from "dompurify";
import { db } from "@/integrations/firebase/client";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc,
  writeBatch
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface StoryTranslationsEditorProps {
  storyId: string;
  storyBaseLanguage: string;
  storyTitle: string;
  storyDescription: string;
  storyPages: any[];
}

const AVAILABLE_LANGUAGES = [
  { code: "pt", name: "Português" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
];

const StoryTranslationsEditor = ({
  storyId,
  storyBaseLanguage,
  storyTitle,
  storyDescription,
  storyPages,
}: StoryTranslationsEditorProps) => {
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [translatedTitle, setTranslatedTitle] = useState("");
  const [translatedDescription, setTranslatedDescription] = useState("");
  const [pageTranslations, setPageTranslations] = useState<Record<string, string>>({});
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);
  
  // IDs para controle de update
  const [storyTranslationId, setStoryTranslationId] = useState<string | null>(null);
  const [pageTranslationIds, setPageTranslationIds] = useState<Record<string, string>>({});
  const [existingLanguages, setExistingLanguages] = useState<string[]>([]);

  // FIX: useMemo evita que sortedPages seja recriado a cada render, parando o loop infinito
  const sortedPages = useMemo(() => {
    return [...storyPages].sort((a, b) => a.page_number - b.page_number);
  }, [storyPages]);

  // Carregar lista de idiomas disponíveis
  useEffect(() => {
    let isMounted = true;
    const fetchExistingLanguages = async () => {
      try {
        const q = query(collection(db, "story_translations"), where("story_id", "==", storyId));
        const snapshot = await getDocs(q);
        if (isMounted) {
          const languages = snapshot.docs.map(doc => doc.data().language);
          setExistingLanguages(languages);
        }
      } catch (e) {
        console.error("Erro ao buscar idiomas:", e);
      }
    };
    fetchExistingLanguages();
    return () => { isMounted = false; };
  }, [storyId]);

  // Carregar dados da tradução selecionada
  useEffect(() => {
    if (!selectedLanguage) {
      setTranslatedTitle("");
      setTranslatedDescription("");
      setPageTranslations({});
      setStoryTranslationId(null);
      setPageTranslationIds({});
      setIsLoadingTranslations(false);
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      setIsLoadingTranslations(true);
      try {
        // 1. Busca tradução da história
        const qStory = query(
          collection(db, "story_translations"), 
          where("story_id", "==", storyId),
          where("language", "==", selectedLanguage)
        );
        const snapshotStory = await getDocs(qStory);
        
        if (!isMounted) return;

        if (!snapshotStory.empty) {
          const data = snapshotStory.docs[0].data();
          setTranslatedTitle(data.title || "");
          setTranslatedDescription(data.description || "");
          setStoryTranslationId(snapshotStory.docs[0].id);
        } else {
          setTranslatedTitle("");
          setTranslatedDescription("");
          setStoryTranslationId(null);
        }

        // 2. Busca tradução das páginas em paralelo
        // (Estratégia robusta para evitar problema de índices)
        const newPageTranslations: Record<string, string> = {};
        const newPageIds: Record<string, string> = {};

        const promises = sortedPages.map(async (page) => {
          const q = query(
            collection(db, "story_page_translations"),
            where("story_page_id", "==", page.id),
            where("language", "==", selectedLanguage)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            return { 
              pageId: page.id, 
              content: snap.docs[0].data().content, 
              translationId: snap.docs[0].id 
            };
          }
          return null;
        });

        const results = await Promise.all(promises);
        
        if (isMounted) {
          results.forEach(res => {
            if (res) {
              newPageTranslations[res.pageId] = res.content;
              newPageIds[res.pageId] = res.translationId;
            }
          });
          setPageTranslations(newPageTranslations);
          setPageTranslationIds(newPageIds);
        }

      } catch (e) {
        console.error("Erro ao carregar traduções:", e);
        if (isMounted) toast({ title: "Erro ao carregar", variant: "destructive" });
      } finally {
        if (isMounted) setIsLoadingTranslations(false);
      }
    };

    loadData();

    return () => { isMounted = false; };
  }, [selectedLanguage, storyId, sortedPages]); // sortedPages agora é estável graças ao useMemo

  const handleSaveTranslation = async () => {
    if (!selectedLanguage) return;

    if (!translatedTitle.trim()) {
      toast({
        title: "Erro",
        description: "O título traduzido é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const batch = writeBatch(db);

      // 1. História
      const storyData = {
        story_id: storyId,
        language: selectedLanguage,
        title: translatedTitle.trim(),
        description: translatedDescription.trim() || null,
        updated_at: new Date()
      };

      if (storyTranslationId) {
        batch.update(doc(db, "story_translations", storyTranslationId), storyData);
      } else {
        const ref = doc(collection(db, "story_translations"));
        batch.set(ref, { ...storyData, created_at: new Date() });
      }

      // 2. Páginas
      Object.entries(pageTranslations).forEach(([pageId, content]) => {
        if (!content?.trim()) return;

        const translationId = pageTranslationIds[pageId];
        const pageData = {
          story_page_id: pageId,
          language: selectedLanguage,
          content: content.trim(),
          updated_at: new Date()
        };

        if (translationId) {
          batch.update(doc(db, "story_page_translations", translationId), pageData);
        } else {
          const ref = doc(collection(db, "story_page_translations"));
          batch.set(ref, { ...pageData, created_at: new Date() });
        }
      });

      await batch.commit();

      if (!existingLanguages.includes(selectedLanguage)) {
        setExistingLanguages([...existingLanguages, selectedLanguage]);
      }

      toast({
        title: "Sucesso",
        description: "Tradução salva com sucesso!",
      });

      // Força recarregamento para pegar IDs novos se necessário
      const currentLang = selectedLanguage;
      setSelectedLanguage(null);
      setTimeout(() => setSelectedLanguage(currentLang), 50);

    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTranslation = async () => {
    if (!selectedLanguage || !storyTranslationId) return;
    if (!confirm("Tem certeza? Isso apagará todas as traduções deste idioma.")) return;

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "story_translations", storyTranslationId));
      Object.values(pageTranslationIds).forEach(id => {
        batch.delete(doc(db, "story_page_translations", id));
      });
      await batch.commit();

      setExistingLanguages(prev => prev.filter(l => l !== selectedLanguage));
      setSelectedLanguage(null);
      toast({ title: "Tradução removida" });
    } catch (error) {
      toast({ title: "Erro ao deletar", variant: "destructive" });
    }
  };

  const updatePageTranslation = (pageId: string, content: string) => {
    setPageTranslations(prev => ({ ...prev, [pageId]: content }));
  };

  const currentPage = sortedPages[currentPageIndex];

  if (isLoadingTranslations) {
    return (
      <div className="flex items-center justify-center py-12 border border-border rounded-lg bg-muted/20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <span className="ml-3 text-sm text-muted-foreground">Carregando traduções...</span>
      </div>
    );
  }

  const availableLanguages = AVAILABLE_LANGUAGES.filter(l => l.code !== storyBaseLanguage);

  return (
    <div className="space-y-4">
      {/* Header e Seleção de Idioma */}
      <div className="flex items-center gap-2">
        <Globe className="w-5 h-5 text-accent" />
        <h3 className="text-sm font-medium text-foreground">Traduções da História</h3>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Idioma base: <strong>{AVAILABLE_LANGUAGES.find(l => l.code === storyBaseLanguage)?.name || storyBaseLanguage}</strong>
      </p>

      <div className="flex flex-wrap gap-2">
        {availableLanguages.map((lang) => {
          const hasTranslation = existingLanguages.includes(lang.code);
          const isSelected = selectedLanguage === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setSelectedLanguage(isSelected ? null : lang.code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isSelected ? "bg-accent text-accent-foreground" : 
                hasTranslation ? "bg-green-500/20 text-green-400" : 
                "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {hasTranslation && <Check className="w-3 h-3" />}
              {lang.name}
            </button>
          );
        })}
      </div>

      {/* Editor */}
      <AnimatePresence mode="wait">
        {selectedLanguage && (
          <motion.div
            key={selectedLanguage}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 border border-border rounded-lg p-4 bg-muted/50"
          >
            {/* Header do Editor */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">
                Tradução: {AVAILABLE_LANGUAGES.find(l => l.code === selectedLanguage)?.name}
              </h4>
              <div className="flex items-center gap-2">
                {existingLanguages.includes(selectedLanguage) && (
                  <button onClick={handleDeleteTranslation} className="p-1.5 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleSaveTranslation}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
            </div>

            {/* Campos de Título/Descrição */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Título Original</label>
                <div className="py-2 px-3 bg-background/50 text-foreground/70 rounded-lg border border-border text-sm">{storyTitle}</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs text-muted-foreground">Título Traduzido</label>
                  <button type="button" onClick={() => setTranslatedTitle(storyTitle)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent">
                    <Copy className="w-3 h-3" /> Copiar
                  </button>
                </div>
                <input
                  value={translatedTitle}
                  onChange={(e) => setTranslatedTitle(e.target.value)}
                  className="w-full py-2 px-3 bg-background text-foreground rounded-lg border border-border text-sm"
                  placeholder="Título traduzido..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Descrição Original</label>
                <div className="py-2 px-3 bg-background/50 text-foreground/70 rounded-lg border border-border text-sm min-h-[60px]">{storyDescription || "Sem descrição"}</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs text-muted-foreground">Descrição Traduzida</label>
                  <button type="button" onClick={() => setTranslatedDescription(storyDescription)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent">
                    <Copy className="w-3 h-3" /> Copiar
                  </button>
                </div>
                <textarea
                  value={translatedDescription}
                  onChange={(e) => setTranslatedDescription(e.target.value)}
                  className="w-full py-2 px-3 bg-background text-foreground rounded-lg border border-border text-sm resize-none"
                  rows={2}
                  placeholder="Descrição traduzida..."
                />
              </div>
            </div>

            {/* Páginas */}
            {sortedPages.length > 0 && (
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="text-sm font-medium">Páginas ({sortedPages.length})</h5>
                  <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-1 text-xs text-muted-foreground">
                    {showPreview ? <><EyeOff className="w-3 h-3" /> Ocultar Preview</> : <><Eye className="w-3 h-3" /> Ver Preview</>}
                  </button>
                </div>

                <div className="flex justify-center gap-2">
                  <button onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))} disabled={currentPageIndex === 0} className="p-1.5 rounded-lg bg-secondary text-foreground disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-sm py-1.5 px-3 bg-muted rounded-lg font-mono">Página {currentPageIndex + 1}</span>
                  <button onClick={() => setCurrentPageIndex(Math.min(sortedPages.length - 1, currentPageIndex + 1))} disabled={currentPageIndex === sortedPages.length - 1} className="p-1.5 rounded-lg bg-secondary text-foreground disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                </div>

                {currentPage && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Original</label>
                      <div className="py-2 px-3 bg-background/50 text-foreground/70 rounded-lg border border-border text-sm min-h-[120px] max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                        {currentPage.content}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-xs text-muted-foreground">Tradução</label>
                        <button type="button" onClick={() => updatePageTranslation(currentPage.id, currentPage.content)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent">
                          <Copy className="w-3 h-3" /> Copiar
                        </button>
                      </div>
                      <textarea
                        value={pageTranslations[currentPage.id] || ""}
                        onChange={(e) => updatePageTranslation(currentPage.id, e.target.value)}
                        className="w-full py-2 px-3 bg-background text-foreground rounded-lg border border-border text-sm resize-none font-mono"
                        rows={5}
                        placeholder="Tradução da página..."
                      />
                      {showPreview && (
                        <div className="p-3 bg-background rounded border border-accent/30 prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(pageTranslations[currentPage.id] || "") }} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedLanguage && (
        <div className="text-center py-6 border border-dashed border-border rounded-lg">
          <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Clique em um idioma para começar</p>
        </div>
      )}
    </div>
  );
};

export default StoryTranslationsEditor;