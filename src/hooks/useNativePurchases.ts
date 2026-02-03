import { useState, useEffect, useCallback } from "react";
import { InAppPurchase2, IAPProduct } from "@awesome-cordova-plugins/in-app-purchase-2";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/integrations/firebase/client";

// IDs dos produtos EXATAMENTE como estão nas lojas
const PRODUCT_IDS = {
  monthly: 'historias_mensal', // Exemplo: mude para o seu ID real
  annual: 'historias_anual'    // Exemplo: mude para o seu ID real
};

const store = InAppPurchase2;

export function useNativePurchases() {
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  // Função para liberar o prêmio no Firebase
  const unlockPremiumContent = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          is_subscribed: true,
          updated_at: new Date(),
          subscription_provider: 'native_store'
        });
        console.log("Premium ativado no Firebase!");
      }
    } catch (e) {
      console.error("Erro ao salvar no Firebase", e);
    }
  };

  const initializeStore = useCallback(() => {
    if (!isNative) return;

    // 1. Configurar Logs para Debug
    store.verbosity = store.DEBUG;

    // 2. Registrar Produtos
    store.register({
      id: PRODUCT_IDS.monthly,
      type: store.PAID_SUBSCRIPTION,
      alias: 'monthly_plan'
    });

    store.register({
      id: PRODUCT_IDS.annual,
      type: store.PAID_SUBSCRIPTION,
      alias: 'annual_plan'
    });

    // 3. Configurar Listeners (Ouvintes de Eventos)
    
    // Quando uma compra é aprovada pelo banco/loja
    store.when("subscription").approved((p: IAPProduct) => {
      // Verifica recibo (localmente por enquanto)
      p.verify(); 
    });

    // Quando a compra é verificada como válida
    store.when("subscription").verified((p: IAPProduct) => {
      p.finish(); // Finaliza a transação na loja (IMPORTANTE!)
      unlockPremiumContent(); // Libera no seu App
      toast.success("Assinatura realizada com sucesso!");
      setIsLoading(false);
    });

    // Quando ocorre erro
    store.error((err) => {
      setIsLoading(false);
      console.error("Erro na loja:", err);
      // Evita mostrar erro se for apenas cancelamento de usuário
      if (err.code !== store.ERR_PURCHASE) {
        toast.error("Erro na transação. Tente novamente.");
      }
    });

    // 4. Atualizar a lista de produtos na tela
    store.when("product").updated((p: IAPProduct) => {
      setProducts(prev => {
        // Lógica simples para atualizar a lista sem duplicar
        const filtered = prev.filter(item => item.id !== p.id);
        return [...filtered, p];
      });
    });

    // 5. Iniciar a Conexão
    store.refresh();

  }, [isNative]);

  useEffect(() => {
    initializeStore();
    return () => {
      store.off(() => {}); // Limpar listeners ao sair
    };
  }, [initializeStore]);

  const purchase = (productId: string) => {
    if (!isNative) {
      toast.error("Compras disponíveis apenas no App Android/iOS");
      return;
    }
    
    setIsLoading(true);
    try {
      store.order(productId);
    } catch (e) {
      setIsLoading(false);
      console.error(e);
      toast.error("Não foi possível iniciar a compra.");
    }
  };

  const restore = () => {
    if (!isNative) return;
    setIsLoading(true);
    store.refresh();
    toast.info("Restaurando compras...");
    // O plugin verifica automaticamente se há compras ativas e dispara o evento 'approved'
    setTimeout(() => setIsLoading(false), 3000); 
  };

  return {
    products,
    purchase,
    restore,
    isLoading,
    isNative
  };
}