import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import LoginPage from "./LoginPage";

const Index = () => {
  const { isLoggedIn } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/home");
    }
  }, [isLoggedIn, navigate]);

  return <LoginPage />;
};

export default Index;
