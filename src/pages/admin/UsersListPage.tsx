import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Search, 
  Shield, 
  User, 
  KeyRound, 
  Crown,
  MoreHorizontal,
  Mail,
  Loader2,
  Trash2,
  CreditCard,
  UserCheck,
  UserX
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useAdminActions } from "@/hooks/useAdminActions"; // Importe novo
import { useApp } from "@/contexts/AppContext";

const UsersListPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { user: currentUser } = useApp(); // Para não se auto-deletar
  const { data: users = [], isLoading } = useUserProfiles();
  const { toggleAdmin, toggleSubscription, deleteUser } = useAdminActions();

  // Filtragem
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.display_name?.toLowerCase() || "").includes(searchLower) ||
      (user.email?.toLowerCase() || "").includes(searchLower) ||
      (user.id?.toLowerCase() || "").includes(searchLower)
    );
  });
  
  const isUserAdmin = (user: any) => user.isAdmin || user.is_admin || user.role === "admin";

  const handleToggleAdmin = (userId: string, currentStatus: boolean) => {
    if (confirm(currentStatus 
      ? "Tem certeza que deseja remover os privilégios de Admin deste usuário?" 
      : "Tem certeza que deseja promover este usuário a Admin?")) {
      toggleAdmin.mutate({ userId, isAdmin: !currentStatus });
    }
  };

  const handleToggleSubscription = (userId: string, currentStatus: boolean) => {
    if (confirm(currentStatus 
      ? "Deseja cancelar a assinatura Premium deste usuário?" 
      : "Deseja dar assinatura Premium manualmente para este usuário?")) {
      toggleSubscription.mutate({ userId, isSubscribed: !currentStatus });
    }
  };

  const handleDelete = (userId: string) => {
    if (confirm("ATENÇÃO: Isso excluirá o perfil do usuário e seus dados salvos. O login dele ainda existirá no Google, mas ele perderá o acesso à conta no app. Continuar?")) {
      deleteUser.mutate(userId);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">Gerenciar Usuários</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Carregando..." : `${users.length} usuários registrados`}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Buscar por nome, email ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && filteredUsers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum usuário encontrado.</p>
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {filteredUsers.map((profile, index) => {
            const isAdmin = isUserAdmin(profile);
            const isSelf = currentUser?.uid === profile.id;
            const displayName = profile.display_name || "Usuário sem nome";
            
            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-lg border border-border p-4 hover:border-accent/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                    ) : isAdmin ? (
                      <Shield className="w-6 h-6 text-accent" />
                    ) : (
                      <User className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm truncate">{displayName}</h3>
                      
                      {isAdmin && (
                        <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                           <Shield className="w-3 h-3" /> Admin
                        </span>
                      )}
                      
                      {profile.is_subscribed && (
                        <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                          <Crown className="w-3 h-3" /> Assinante
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {profile.email || "Sem e-mail"}
                      </span>
                      <span className="flex items-center gap-1 font-mono bg-muted px-1 rounded">
                        <KeyRound className="w-3 h-3" />
                        {profile.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                          <MoreHorizontal className="w-4 h-4" />
                          <span className="ml-2 hidden sm:inline">Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
                        <DropdownMenuLabel>Gerenciar Conta</DropdownMenuLabel>
                        
                        {/* Toggle Admin */}
                        <DropdownMenuItem 
                          onClick={() => handleToggleAdmin(profile.id, isAdmin)}
                          disabled={isSelf} // Não pode tirar o próprio admin
                        >
                          {isAdmin ? (
                            <>
                              <UserX className="w-4 h-4 mr-2 text-muted-foreground" />
                              Remover Admin
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-2 text-purple-500" />
                              Promover a Admin
                            </>
                          )}
                        </DropdownMenuItem>

                        {/* Toggle Subscription */}
                        <DropdownMenuItem onClick={() => handleToggleSubscription(profile.id, !!profile.is_subscribed)}>
                          {profile.is_subscribed ? (
                            <>
                              <UserX className="w-4 h-4 mr-2 text-red-400" />
                              Cancelar Assinatura
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 mr-2 text-green-500" />
                              Ativar Premium
                            </>
                          )}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        
                        {/* Delete User */}
                        <DropdownMenuItem 
                          onClick={() => handleDelete(profile.id)}
                          disabled={isSelf} // Não pode se deletar
                          className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                        >
                           <Trash2 className="w-4 h-4 mr-2" />
                           Excluir Usuário
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default UsersListPage;