import { Navigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * AdminRoute - Protects admin routes
 * - Shows spinner while auth is initializing
 * - Redirects to /admin (login) if not authenticated
 * - Redirects to /admin (login) if authenticated but not admin
 * - Renders children if authenticated and admin
 */
const AdminRoute = ({ children }: AdminRouteProps) => {
  // MUDANÇA AQUI: Removemos 'session' e usamos 'isLoggedIn'
  const { authReady, isLoggedIn, isAdmin, adminReady } = useApp();

  // Wait for auth to fully initialize before making any routing decisions
  if (!authReady) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <p className="text-muted-foreground text-sm">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to admin login
  // MUDANÇA AQUI: Verificamos se está logado usando a nova variável
  if (!isLoggedIn) {
    return <Navigate to="/admin" replace />;
  }

  // Logged in but admin status still being checked
  if (!adminReady) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <p className="text-muted-foreground text-sm">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Logged in but not admin - redirect to admin login
  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // Authenticated and admin - render the protected content
  return <>{children}</>;
};

export default AdminRoute;