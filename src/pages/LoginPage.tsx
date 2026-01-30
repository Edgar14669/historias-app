import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
// import { Settings } from "lucide-react"; // Não precisa mais
// import { Capacitor } from "@capacitor/core"; // Não precisa mais
import { useApp } from "@/contexts/AppContext";
import { useEffect } from "react";

const LoginPage = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, user, isLoading } = useApp();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/home");
    }
  }, [user, isLoading, navigate]);

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  // Botão removido daqui
  // const handleAdminAccess = () => { ... }

  if (isLoading) {
    return (
      <div className="mobile-container min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="mobile-container min-h-screen bg-background flex flex-col">
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center page-padding">
        {/* Logo placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-10"
        >
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Logo do Aplicativo
            </h1>
          </div>
        </motion.div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-center mb-10"
        >
          <p className="text-muted-foreground text-lg">
            Faça login e deixe a magia acontecer!
          </p>
        </motion.div>

        {/* Auth Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="w-full max-w-sm space-y-4"
        >
          <button
            onClick={handleGoogleLogin}
            className="btn-google flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Entrar com Google
          </button>
        </motion.div>

        {/* Botão de Admin Removido aqui */}
        
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="text-center pb-8 px-6"
      >
        <p className="text-muted-foreground text-xs">
          Termos de Uso | Política de Privacidade
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;