import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '@/integrations/firebase/client';
import { toast } from 'sonner';

export function useNotifications() {
  
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const registerNotifications = async () => {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('Permissão de notificação negada');
        return;
      }

      await PushNotifications.register();
    };

    registerNotifications();

    // Listeners
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push Registration Token:', token.value);
      const user = auth.currentUser;
      if (user) {
        // Salva o token no perfil do usuário no Firestore
        // Usamos arrayUnion para não apagar tokens de outros dispositivos (ex: tablet e celular)
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          fcm_tokens: arrayUnion(token.value),
          last_login: new Date() // Aproveitamos para atualizar o login
        }).catch(err => console.error("Erro ao salvar token:", err));
      }
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Erro ao registrar notificações:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      // Notificação recebida com o app ABERTO
      toast.info(notification.title || 'Nova Mensagem', {
        description: notification.body
      });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      // Usuário clicou na notificação (App em background)
      console.log('Notificação clicada:', notification);
      // Aqui você pode redirecionar para uma página específica se quiser
    });

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, []);
}