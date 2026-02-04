import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// --- INICIALIZAÇÃO SEGURA ---
// Só inicializa o app se ainda não estiver inicializado
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Helper para obter o banco SOMENTE quando necessário
const getDB = () => getFirestore();

// --- FUNÇÃO AUXILIAR DE ENVIO ---
async function sendToAll(title: string, body: string) {
  const db = getDB();
  try {
    const usersSnapshot = await db.collection('users').get();
    const tokens: string[] = [];
    
    usersSnapshot.forEach(doc => {
      const u = doc.data();
      if (u.fcm_tokens && Array.isArray(u.fcm_tokens)) {
        tokens.push(...u.fcm_tokens);
      }
    });

    if (tokens.length === 0) return;

    const uniqueTokens = [...new Set(tokens)];
    
    // Batching de 500 para evitar limites do FCM
    const batchSize = 500;
    for (let i = 0; i < uniqueTokens.length; i += batchSize) {
      const batchTokens = uniqueTokens.slice(i, i + batchSize);
      if (batchTokens.length > 0) {
        await admin.messaging().sendEachForMulticast({
          notification: { title, body },
          tokens: batchTokens
        });
      }
    }
    logger.info(`Notificação enviada para ${uniqueTokens.length} dispositivos.`);
  } catch (error) {
    logger.error("Erro no envio em massa:", error);
  }
}

// 1. ENVIO MANUAL
export const sendManualNotification = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login necessário.');
  }
  // Validação simples
  const data = request.data;
  if (!data.title || !data.body) {
     throw new HttpsError('invalid-argument', 'Título e corpo são obrigatórios.');
  }
  
  await sendToAll(data.title, data.body);
  return { success: true };
});

// 2. CHECK 5 DIAS
export const check5DaysInactive = onSchedule("every day 10:00", async (event) => {
  const db = getDB();
  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000));
  
  try {
    const snapshot = await db.collection('users')
      .where('last_login', '<=', fiveDaysAgo)
      .where('notified_5_days', '!=', true)
      .get();

    if (snapshot.empty) return;

    const tokens: string[] = [];
    const batch = db.batch();

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.fcm_tokens && Array.isArray(data.fcm_tokens)) {
        tokens.push(...data.fcm_tokens);
        batch.update(doc.ref, { notified_5_days: true });
      }
    });

    if (tokens.length > 0) {
      const uniqueTokens = [...new Set(tokens)].slice(0, 500); // Limite de segurança
      await admin.messaging().sendEachForMulticast({
        notification: { 
          title: "Sentimos sua falta! 😢", 
          body: "Faz 5 dias que não te vemos. Venha ler uma nova história!" 
        },
        tokens: uniqueTokens
      });
      await batch.commit();
    }
  } catch (e) {
    logger.error("Erro no check de 5 dias:", e);
  }
});

// 3. CHECK 20 DIAS
export const check20DaysInactive = onSchedule("every day 11:00", async (event) => {
  const db = getDB();
  const now = new Date();
  const twentyDaysAgo = new Date(now.getTime() - (20 * 24 * 60 * 60 * 1000));
  
  try {
    const snapshot = await db.collection('users')
      .where('last_login', '<=', twentyDaysAgo)
      .where('notified_20_days', '!=', true)
      .get();

    if (snapshot.empty) return;

    const tokens: string[] = [];
    const batch = db.batch();

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.fcm_tokens && Array.isArray(data.fcm_tokens)) {
        tokens.push(...data.fcm_tokens);
        batch.update(doc.ref, { notified_20_days: true });
      }
    });

    if (tokens.length > 0) {
      const uniqueTokens = [...new Set(tokens)].slice(0, 500);
      await admin.messaging().sendEachForMulticast({
        notification: { 
          title: "Tudo bem com você? 🙏", 
          body: "Faz um tempo que você não entra. Temos muitas novidades!" 
        },
        tokens: uniqueTokens
      });
      await batch.commit();
    }
  } catch (e) {
    logger.error("Erro no check de 20 dias:", e);
  }
});

// 4. CHECK NOVAS HISTÓRIAS
export const checkNewStories = onSchedule("every 1 hours", async (event) => {
  const db = getDB();
  const now = new Date();
  // Ajuste para 1 hora e 5 min para garantir cobertura
  const oneHourAgo = new Date(now.getTime() - (65 * 60 * 1000)); 
  
  try {
    const snapshot = await db.collection('stories')
      .where('created_at', '>=', oneHourAgo.toISOString()) // Firestore salva datas como string ISO ou Timestamp
      .get();

    if (snapshot.empty) return;

    // Pega apenas a mais recente para não flodar
    const newStory = snapshot.docs[0].data();
    const title = newStory.title || "Nova História";
    
    await sendToAll(
      "Nova História Chegou! 📖",
      `Venha ler "${title}" e outras novidades.`
    );
    
    logger.info(`Notificação de nova história: ${title}`);
  } catch (error) {
    logger.error("Erro ao verificar novas histórias:", error);
  }
});