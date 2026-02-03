import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

admin.initializeApp();

// Conecta explicitamente ao banco 'apphistoriasfinal'
const db = getFirestore("apphistoriasfinal");

// --- FUNÇÃO AUXILIAR DE ENVIO ---
async function sendToAll(title: string, body: string) {
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
    
    // Envia em lotes de 500 (limite do firebase)
    const batchSize = 500;
    for (let i = 0; i < uniqueTokens.length; i += batchSize) {
      const batchTokens = uniqueTokens.slice(i, i + batchSize);
      await admin.messaging().sendEachForMulticast({
        notification: { title, body },
        tokens: batchTokens
      });
    }
    logger.info(`Notificação enviada para ${uniqueTokens.length} dispositivos.`);
  } catch (error) {
    logger.error("Erro no envio em massa:", error);
  }
}

// 1. ENVIO MANUAL
export const sendManualNotification = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'O usuário precisa estar logado.');
  }
  const { title, body } = request.data as { title: string, body: string }; 
  await sendToAll(title, body);
  return { success: true };
});

// 2. MENSAGEM AUTOMÁTICA (5 Dias Inativo)
export const check5DaysInactive = onSchedule("every day 10:00", async (event) => {
  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000));
  
  const snapshot = await db.collection('users')
    .where('last_login', '<=', fiveDaysAgo)
    .where('notified_5_days', '!=', true)
    .get();

  const tokens: string[] = [];
  const batch = db.batch();

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.fcm_tokens) {
      tokens.push(...data.fcm_tokens);
      batch.update(doc.ref, { notified_5_days: true });
    }
  });

  if (tokens.length > 0) {
    await admin.messaging().sendEachForMulticast({
      notification: { title: "Sentimos sua falta! 😢", body: "Faz 5 dias que não te vemos. Venha ler uma nova história bíblica hoje!" },
      tokens: [...new Set(tokens)].slice(0, 500)
    });
    await batch.commit();
  }
});

// 3. MENSAGEM AUTOMÁTICA (20 Dias Inativo)
export const check20DaysInactive = onSchedule("every day 11:00", async (event) => {
  const now = new Date();
  const twentyDaysAgo = new Date(now.getTime() - (20 * 24 * 60 * 60 * 1000));
  
  const snapshot = await db.collection('users')
    .where('last_login', '<=', twentyDaysAgo)
    .where('notified_20_days', '!=', true)
    .get();

  const tokens: string[] = [];
  const batch = db.batch();

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.fcm_tokens) {
      tokens.push(...data.fcm_tokens);
      batch.update(doc.ref, { notified_20_days: true });
    }
  });

  if (tokens.length > 0) {
    await admin.messaging().sendEachForMulticast({
      notification: { title: "Tudo bem com você? 🙏", body: "Faz um tempo que você não entra. Temos muitas novidades te esperando!" },
      tokens: [...new Set(tokens)].slice(0, 500)
    });
    await batch.commit();
  }
});

// 4. VERIFICAÇÃO DE NOVAS HISTÓRIAS (Agendado a cada 1 hora)
// Substitui o Trigger que estava dando erro
export const checkNewStories = onSchedule("every 1 hours", async (event) => {
  const now = new Date();
  // Verifica histórias criadas na última 1 hora e 5 minutos (margem de segurança)
  const oneHourAgo = new Date(now.getTime() - (65 * 60 * 1000));
  
  try {
    // Busca histórias criadas recentemente
    // IMPORTANTE: Suas histórias precisam ter um campo 'created_at' ou similar
    const snapshot = await db.collection('stories')
      .where('created_at', '>=', oneHourAgo)
      .get();

    if (snapshot.empty) return;

    // Pega a primeira história nova encontrada para usar no título
    const newStory = snapshot.docs[0].data();
    const title = newStory.title || "Nova História";

    // Se já tivermos notificado sobre essa história hoje, evitamos spam?
    // Aqui faremos um envio simples: Se achou história nova na última hora, avisa.
    
    await sendToAll(
      "Nova História Chegou! 📖",
      `Venha ler "${title}" e outras novidades que acabaram de chegar.`
    );
    
    logger.info(`Notificação de nova história enviada: ${title}`);
  } catch (error) {
    logger.error("Erro ao verificar novas histórias:", error);
  }
});