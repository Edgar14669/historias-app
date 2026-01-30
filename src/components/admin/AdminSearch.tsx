import { useState, useRef, useEffect } from "react";
import { Search, BookOpen, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useAllStories } from "@/hooks/useStories";
import { useUserProfiles } from "@/hooks/useUserProfiles";

interface AdminSearchProps {
  onNavigate?: () => void;
}

export function AdminSearch({ onNavigate }: AdminSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: stories = [] } = useAllStories();
  const { data: users = [] } = useUserProfiles();

  // Filter results
  const filteredStories = query.trim()
    ? stories.filter(s =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.description?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  const filteredUsers = query.trim()
    ? users.filter(u =>
        u.display_name?.toLowerCase().includes(query.toLowerCase()) ||
        u.user_id?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  const hasResults = filteredStories.length > 0 || filteredUsers.length > 0;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (path: string) => {
    setQuery("");
    setOpen(false);
    onNavigate?.();
    navigate(path);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar histórias ou usuários..."
          className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {/* Dropdown */}
      {open && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-auto">
          {!hasResults && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Nenhum resultado encontrado
            </div>
          )}

          {filteredStories.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                Histórias
              </p>
              {filteredStories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => handleSelect(`/admin/stories/${story.id}/edit`)}
                  className="w-full flex items-center gap-3 px-2 py-2 hover:bg-muted rounded-md text-left transition-colors"
                >
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {story.cover_url ? (
                      <img src={story.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-sm text-foreground truncate">{story.title}</span>
                </button>
              ))}
            </div>
          )}

          {filteredUsers.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                Usuários
              </p>
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelect("/admin/users")}
                  className="w-full flex items-center gap-3 px-2 py-2 hover:bg-muted rounded-md text-left transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-sm text-foreground truncate">
                    {user.display_name || "Usuário"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
