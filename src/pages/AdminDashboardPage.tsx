import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { 
  BookOpen, 
  Users, 
  Eye, 
  Crown, 
  ChevronRight, 
  LayoutDashboard,
  UserPlus,
  PlusCircle,
  LogOut,
  Menu,
  X,
  Shield
} from "lucide-react";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { useStories } from "@/hooks/useStories";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useStoryViewsCount } from "@/hooks/useStoryViews";
import { useApp } from "@/contexts/AppContext";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "green" | "orange" | "red";
  href: string;
}

const StatCard = ({ title, value, icon, color, href }: StatCardProps) => {
  const colorClasses = {
    blue: "bg-sky-500",
    green: "bg-emerald-500",
    orange: "bg-amber-500",
    red: "bg-red-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${colorClasses[color]} rounded-lg p-4 relative overflow-hidden`}
    >
      <div className="relative z-10">
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        <p className="text-white/90 text-sm font-medium">{title}</p>
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-30">
        {icon}
      </div>
      <RouterLink 
        to={href}
        className="mt-4 flex items-center gap-1 text-white/80 text-xs hover:text-white transition-colors"
      >
        Mais Informações
        <ChevronRight className="w-3 h-3" />
      </RouterLink>
    </motion.div>
  );
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"dashboard" | "users">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Hooks Reais
  const { data: stories = [] } = useStories();
  const { data: userProfiles = [] } = useUserProfiles();
  const { data: storyViewsCount = 0 } = useStoryViewsCount();

  const { logout, user } = useApp();
  
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Calcula assinantes reais
  const subscribersCount = userProfiles.filter(p => p.is_subscribed).length;

  return (
    <div className="min-h-screen bg-sidebar flex">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border p-4 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <span className="font-semibold text-foreground">Painel Admin</span>
        <div className="w-10" />
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-sidebar border-r border-sidebar-border flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        pt-16 lg:pt-0
      `}>
        {/* User Info */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
               {user?.photoURL ? (
                 <img src={user.photoURL} alt="Admin" className="w-full h-full object-cover" />
               ) : (
                 <Users className="w-5 h-5 text-muted-foreground" />
               )}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-foreground text-sm truncate">{user?.displayName || "Admin"}</p>
              <p className="text-accent text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <AdminSearch onNavigate={() => setSidebarOpen(false)} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <p className="text-accent text-xs font-medium uppercase mb-4">
            Menu Principal
          </p>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => { setActiveTab("dashboard"); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeTab === "dashboard"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Painel
              </button>
            </li>
            <li>
              <button
                onClick={() => { setActiveTab("users"); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeTab === "users"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Usuários Internos
              </button>
            </li>
            <li>
              <button
                onClick={() => { navigate("/admin/stories/new/edit"); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <PlusCircle className="w-4 h-4" />
                Criar História
              </button>
            </li>
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 pt-20 lg:pt-6 overflow-auto">
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl">
            <StatCard
              title="Histórias cadastradas"
              value={stories.length}
              icon={<BookOpen className="w-12 lg:w-16 h-12 lg:h-16" />}
              color="blue"
              href="/admin/stories"
            />
            <StatCard
              title="Usuários"
              value={userProfiles.length}
              icon={<Users className="w-12 lg:w-16 h-12 lg:h-16" />}
              color="green"
              href="/admin/users"
            />
            <StatCard
              title="Histórias vistas"
              value={storyViewsCount}
              icon={<Eye className="w-12 lg:w-16 h-12 lg:h-16" />}
              color="orange"
              href="/admin/views"
            />
            <StatCard
              title="Assinantes"
              value={subscribersCount}
              icon={<Crown className="w-12 lg:w-16 h-12 lg:h-16" />}
              color="red"
              href="/admin/subscribers"
            />
          </div>
        )}

        {activeTab === "users" && (
          <div className="max-w-4xl">
            <h2 className="text-xl font-bold text-foreground mb-4">Usuários Internos</h2>
            <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
              <p className="text-muted-foreground text-sm mb-4">Gerencie os usuários que possuem registro no banco de dados.</p>
              
              <div className="space-y-3">
                {userProfiles.length === 0 ? (
                    <p className="text-sm text-center py-4 text-muted-foreground">Nenhum usuário encontrado na coleção 'users'.</p>
                ) : (
                    userProfiles.map((profile) => (
                        <div key={profile.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden">
                              {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="User" className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-4 h-4 text-accent" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">
                                {profile.display_name || profile.email || "Usuário sem nome"}
                              </p>
                              <p className="text-xs text-muted-foreground">{profile.id}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                             {(profile.isAdmin || profile.is_admin) && (
                                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> Admin
                                </span>
                             )}
                             {profile.is_subscribed && (
                                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded flex items-center gap-1">
                                    <Crown className="w-3 h-3" /> Assinante
                                </span>
                             )}
                             {!profile.is_subscribed && !(profile.isAdmin || profile.is_admin) && (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Usuário</span>
                             )}
                          </div>
                        </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboardPage;