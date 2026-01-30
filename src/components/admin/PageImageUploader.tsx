import { useState } from "react";
import { Upload, Link, X, Loader2 } from "lucide-react";

interface PageImageUploaderProps {
  value: string;
  onChange: (url: string | null) => void;
  isUploading: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  inputId: string;
}

const PageImageUploader = ({ 
  value, 
  onChange, 
  isUploading, 
  onUpload, 
  inputId 
}: PageImageUploaderProps) => {
  const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState(value || "");

  const handleUrlSubmit = () => {
    const trimmedUrl = urlInput.trim();
    if (trimmedUrl) {
      onChange(trimmedUrl);
    }
  };

  const handleClear = () => {
    onChange(null);
    setUrlInput("");
  };

  if (value) {
    return (
      <div className="mb-4">
        <label className="text-xs text-muted-foreground mb-2 block">
          Imagem da Página (opcional)
        </label>
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img
            src={value}
            alt="Imagem da página"
            className="w-full h-32 object-cover"
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="text-xs text-muted-foreground mb-2 block">
        Imagem da Página (opcional)
      </label>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setInputMode("upload")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={onUpload}
            className="hidden"
            id={inputId}
          />
          <label
            htmlFor={inputId}
            className={`flex items-center justify-center gap-2 h-20 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-colors ${
              isUploading ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Fazer upload de imagem</span>
              </>
            )}
          </label>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onBlur={handleUrlSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleUrlSubmit();
              }
            }}
            placeholder="https://exemplo.com/imagem.jpg"
            className="flex-1 py-2 px-3 bg-background text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent text-sm"
          />
        </div>
      )}
    </div>
  );
};

export default PageImageUploader;
