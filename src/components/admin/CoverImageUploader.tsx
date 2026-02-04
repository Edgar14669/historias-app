import { useState, useRef, useId, useEffect } from "react";
import { Image as ImageIcon, Upload, Loader2, X, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { storage } from "@/integrations/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";

interface CoverImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

const CoverImageUploader = ({ value, onChange }: CoverImageUploaderProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  // Detecta automaticamente o modo baseado no valor inicial
  const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");

  // Sincroniza estado interno quando o valor externo muda
  useEffect(() => {
    if (value) {
      setUrlInput(value);
      // Se não for link do firebase storage, assume que é URL externa
      if (value.startsWith("http") && !value.includes("firebasestorage")) {
        setInputMode("url");
      }
    }
  }, [value]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Erro", description: "Selecione um arquivo de imagem válido.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erro", description: "Máximo 5MB permitido.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setImageError(false);

    try {
      // Nome único para evitar sobreposição
      const fileExt = file.name.split(".").pop();
      const fileName = `covers/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const storageRef = ref(storage, fileName);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      onChange(downloadURL);
      toast({ title: "Sucesso", description: "Upload concluído!" });
    } catch (error) {
      console.error("Erro upload:", error);
      toast({ title: "Erro", description: "Falha ao enviar imagem.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      setImageError(false); // Reseta erro para tentar carregar
      onChange(urlInput.trim());
    }
  };

  const handleClear = () => {
    onChange("");
    setUrlInput("");
    setImageError(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Preview Area */}
        <div className="relative w-full sm:w-32 h-32 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden flex-shrink-0 group">
          {value ? (
            <>
              <img
                src={value}
                alt="Capa"
                className={`w-full h-full object-cover transition-opacity ${imageError ? "opacity-0" : "opacity-100"}`}
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
              />
              
              {/* Fallback visual se a imagem quebrar (CORS) */}
              {imageError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-muted">
                  <ImageIcon className="w-8 h-8 text-yellow-500 mb-1" />
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    Link salvo, mas visualização bloqueada pelo site.
                  </span>
                </div>
              )}

              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2 bg-destructive text-white rounded-full hover:bg-destructive/90 transition-transform hover:scale-110"
                  title="Remover imagem"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : isUploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          ) : (
            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
          )}
        </div>

        {/* Inputs */}
        <div className="flex-1 space-y-3">
          {/* Toggle Buttons */}
          <div className="flex p-1 bg-muted rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setInputMode("upload")}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                inputMode === "upload"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
            <button
              type="button"
              onClick={() => setInputMode("url")}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                inputMode === "url"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              Link URL
            </button>
          </div>

          {inputMode === "upload" ? (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id={`cover-upload-${inputId}`}
              />
              <label
                htmlFor={`cover-upload-${inputId}`}
                className={`flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors ${
                  isUploading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Upload className="w-4 h-4" />
                  <span>Clique para escolher uma imagem</span>
                </div>
                <span className="text-xs text-muted-foreground/70">
                  JPG, PNG ou WebP (Máx 5MB)
                </span>
              </label>
            </div>
          ) : (
            <div className="flex gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onBlur={handleUrlSubmit}
                onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                placeholder="Cole o link da imagem aqui..."
                className="flex-1 px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
              <button
                type="button"
                onClick={handleUrlSubmit}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Mensagem de Ajuda */}
      {inputMode === "url" && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          Dica: Alguns sites bloqueiam o uso de imagens em outros apps. Se a imagem não aparecer, tente fazer o download e usar a opção "Upload".
        </p>
      )}
    </div>
  );
};

export default CoverImageUploader;