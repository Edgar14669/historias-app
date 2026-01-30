import { useState, useRef, useId } from "react";
import { Image, Upload, Loader2, X, Link } from "lucide-react";
// MUDANÇA: Importamos o storage do nosso cliente e funções do Firebase
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
  const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState(value || "");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo de imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setImageError(false);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // MUDANÇA: Lógica do Firebase Storage
      // 1. Criar a referência de onde salvar (pasta 'covers')
      const storageRef = ref(storage, `covers/${fileName}`);

      // 2. Fazer o Upload do arquivo
      const snapshot = await uploadBytes(storageRef, file);

      // 3. Obter a URL de download (pública)
      const downloadURL = await getDownloadURL(snapshot.ref);

      onChange(downloadURL);
      setUrlInput(downloadURL);
      
      toast({
        title: "Sucesso",
        description: "Imagem de capa enviada com sucesso!",
      });
    } catch (error) {
      console.error("Error uploading cover:", error);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar a imagem. Verifique suas permissões.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      setImageError(false);
      onChange(urlInput.trim());
    }
  };

  const handleClear = () => {
    onChange("");
    setUrlInput("");
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="relative w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          {value && !imageError ? (
            <>
              <img
                src={value}
                alt="Capa"
                className="w-full h-full object-cover"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : isUploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          ) : (
            <Image className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        {/* Upload/URL toggle and inputs */}
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setInputMode("upload")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                inputMode === "upload"
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Upload className="w-3 h-3" />
              Upload
            </button>
            <button
              type="button"
              onClick={() => setInputMode("url")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                inputMode === "url"
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Link className="w-3 h-3" />
              URL
            </button>
          </div>

          {inputMode === "upload" ? (
            <div>
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
                className={`flex items-center justify-center gap-2 w-full py-2 px-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors text-sm ${
                  isUploading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-muted-foreground">Enviando...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Clique para selecionar uma imagem
                    </span>
                  </>
                )}
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG ou WebP. Máx 5MB.
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onBlur={handleUrlSubmit}
                onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                placeholder="https://exemplo.com/imagem.jpg"
                className="flex-1 py-2 px-3 bg-muted text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {imageError && value && (
        <p className="text-xs text-destructive">
          Não foi possível carregar a imagem. Verifique o URL ou tente fazer upload.
        </p>
      )}
    </div>
  );
};

export default CoverImageUploader;