# Guia de Implementação - Stories App

Este documento contém instruções detalhadas para transformar o aplicativo em um app nativo (iOS/Android), migrar o banco de dados para Firebase e utilizar o painel administrativo.

---

## Índice

1. [Painel Administrativo (Web)](#1-painel-administrativo-web)
2. [Conversão para App Nativo (iOS/Android)](#2-conversão-para-app-nativo-iosandroid)
3. [Migração para Firebase](#3-migração-para-firebase)
4. [O que já está implementado](#4-o-que-já-está-implementado)

---

## 1. Painel Administrativo (Web)

### Acesso

O painel administrativo é acessível **exclusivamente via navegador web** (não aparece no app móvel nativo).

**URL de Acesso:** `https://[seu-dominio]/admin`

### Funcionalidades Disponíveis

| Funcionalidade | Descrição |
|----------------|-----------|
| **Dashboard** | Visão geral com estatísticas do app |
| **Histórias** | Criar, editar, excluir e gerenciar histórias |
| **Traduções** | Traduzir histórias para múltiplos idiomas (PT, EN, ES, FR, DE) |
| **Páginas** | Adicionar/editar páginas de cada história com imagens |
| **Visualizações** | Ranking das histórias mais vistas + opção de zerar contadores |
| **Usuários** | Listar usuários, promover/remover admins, gerenciar assinaturas |
| **Assinantes** | Lista filtrada de usuários com assinatura ativa |

### Criando um Administrador

1. O usuário precisa primeiro fazer login no app (criar conta)
2. No banco de dados, adicione uma entrada na tabela `user_roles`:
   ```sql
   INSERT INTO user_roles (user_id, role) 
   VALUES ('ID_DO_USUARIO', 'admin');
   ```
3. O usuário agora pode acessar `/admin` e fazer login

---

## 2. Conversão para App Nativo (iOS/Android)

O projeto já está configurado com **Capacitor** para conversão em app nativo.

### Pré-requisitos

| Plataforma | Requisitos |
|------------|------------|
| **iOS** | Mac com Xcode instalado (versão 14+), Apple Developer Account |
| **Android** | Android Studio instalado, JDK 17+ |
| **Ambos** | Node.js 18+, npm ou bun |

### Passo a Passo

#### 1. Exportar o Projeto para GitHub

No Lovable:
1. Clique no nome do projeto (canto superior esquerdo)
2. Vá em **Settings** → **GitHub**
3. Clique em **"Export to GitHub"**
4. Escolha o repositório de destino

#### 2. Clonar e Preparar o Projeto

```bash
# Clonar o repositório
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd SEU_REPOSITORIO

# Instalar dependências
npm install
```

#### 3. Adicionar Plataformas Nativas

```bash
# Adicionar iOS (apenas em Mac)
npx cap add ios

# Adicionar Android
npx cap add android
```

#### 4. Build e Sincronização

```bash
# Fazer build do projeto web
npm run build

# Sincronizar com as plataformas nativas
npx cap sync
```

#### 5. Configurar RevenueCat (Assinaturas In-App)

O projeto já tem o SDK do RevenueCat configurado. Para ativar:

1. Crie uma conta em [RevenueCat](https://www.revenuecat.com/)
2. Configure seus produtos no App Store Connect e Google Play Console
3. Atualize a API Key em `src/hooks/useRevenueCat.ts`:
   ```typescript
   const REVENUECAT_API_KEY = "SUA_API_KEY_PUBLICA";
   ```

#### 6. Executar o App

```bash
# Executar no simulador/emulador iOS
npx cap run ios

# Executar no simulador/emulador Android
npx cap run android

# Abrir no Xcode (para configurações avançadas)
npx cap open ios

# Abrir no Android Studio
npx cap open android
```

### Configurações Importantes

#### capacitor.config.ts

O arquivo já está configurado com:
- **App ID:** `app.lovable.e22eaeb4e75b46b0becb0eed33435489` (alterar para seu próprio ID)
- **Hot Reload:** Configurado para desenvolvimento (remover em produção)
- **Splash Screen:** Configurado com cor de fundo

#### Para Produção

Antes de publicar, edite `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'com.suaempresa.seuapp', // Seu App ID único
  appName: 'Nome do Seu App',
  webDir: 'dist',
  // REMOVER a seção "server" para produção:
  // server: { ... }
};
```

### Publicação nas Lojas

#### App Store (iOS)

1. Abra o projeto no Xcode: `npx cap open ios`
2. Configure Signing & Capabilities com sua conta de desenvolvedor
3. Gere o build: Product → Archive
4. Envie via App Store Connect

#### Google Play (Android)

1. Abra o projeto no Android Studio: `npx cap open android`
2. Gere o APK/AAB: Build → Generate Signed Bundle/APK
3. Envie via Google Play Console

---

## 3. Migração para Firebase

### Estrutura Atual do Banco (Supabase/Lovable Cloud)

```
├── categories          # Categorias de histórias
├── stories             # Histórias (título, descrição, capa, idioma base)
├── story_pages         # Páginas de cada história (conteúdo, imagem)
├── story_translations  # Traduções de título/descrição
├── story_page_translations  # Traduções do conteúdo das páginas
├── story_views         # Registro de visualizações
├── user_profiles       # Perfis de usuário
├── user_roles          # Roles (admin, user, moderator)
├── favorite_stories    # Histórias favoritas dos usuários
└── subscriptions       # Dados de assinatura (RevenueCat)
```

### Passos para Migração

#### 1. Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative **Firestore Database**
4. Ative **Firebase Authentication** (Google provider)
5. Ative **Firebase Storage** (para imagens)

#### 2. Estrutura Sugerida no Firestore

```
firestore/
├── categories/
│   └── {categoryId}
│       ├── name: string
│       └── icon: string
│
├── stories/
│   └── {storyId}
│       ├── title: string
│       ├── description: string
│       ├── coverImage: string (URL)
│       ├── language: string
│       ├── isPremium: boolean
│       ├── categoryId: string
│       ├── videoUrl: string (opcional)
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── storyPages/
│   └── {pageId}
│       ├── storyId: string
│       ├── pageNumber: number
│       ├── content: string (HTML)
│       └── pageImage: string (URL)
│
├── storyTranslations/
│   └── {translationId}
│       ├── storyId: string
│       ├── language: string
│       ├── title: string
│       └── description: string
│
├── storyPageTranslations/
│   └── {translationId}
│       ├── storyPageId: string
│       ├── language: string
│       └── content: string
│
├── users/
│   └── {userId}
│       ├── displayName: string
│       ├── avatarUrl: string
│       ├── isAdmin: boolean
│       ├── isSubscribed: boolean
│       └── createdAt: timestamp
│
├── userRoles/
│   └── {roleId}
│       ├── userId: string
│       └── role: string ("admin" | "moderator" | "user")
│
├── favorites/
│   └── {favoriteId}
│       ├── userId: string
│       └── storyId: string
│
└── storyViews/
    └── {viewId}
        ├── storyId: string
        ├── userId: string (opcional)
        ├── sessionId: string
        └── createdAt: timestamp
```

#### 3. Script de Exportação (Supabase → JSON)

Execute estas queries no Lovable Cloud para exportar os dados:

```sql
-- Exportar categorias
SELECT * FROM categories;

-- Exportar histórias
SELECT * FROM stories;

-- Exportar páginas
SELECT * FROM story_pages ORDER BY story_id, page_number;

-- Exportar traduções
SELECT * FROM story_translations;
SELECT * FROM story_page_translations;

-- Exportar usuários
SELECT * FROM user_profiles;
SELECT * FROM user_roles;
```

#### 4. Alterações no Código

Será necessário:

1. **Instalar Firebase SDK:**
   ```bash
   npm install firebase
   ```

2. **Criar cliente Firebase** (`src/integrations/firebase/client.ts`)

3. **Reescrever hooks:**
   - `useStories.ts` → usar Firestore queries
   - `useStoryPages.ts` → usar Firestore queries
   - `useUserProfiles.ts` → usar Firestore queries
   - etc.

4. **Alterar autenticação:**
   - Substituir Supabase Auth por Firebase Auth

5. **Alterar storage:**
   - Substituir Supabase Storage por Firebase Storage

### Regras de Segurança (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Histórias - leitura pública, escrita apenas admin
    match /stories/{storyId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Páginas - leitura baseada em assinatura
    match /storyPages/{pageId} {
      allow read: if canReadStory(resource.data.storyId);
      allow write: if isAdmin();
    }
    
    // Usuários - leitura/escrita própria
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Favoritos - apenas próprio usuário
    match /favorites/{favoriteId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    
    // Funções auxiliares
    function isAdmin() {
      return get(/databases/$(database)/documents/userRoles/$(request.auth.uid)).data.role == 'admin';
    }
    
    function canReadStory(storyId) {
      let story = get(/databases/$(database)/documents/stories/$(storyId));
      let user = get(/databases/$(database)/documents/users/$(request.auth.uid));
      return !story.data.isPremium || user.data.isSubscribed;
    }
  }
}
```

---

## 4. O que já está implementado

### ✅ Pronto para Uso

| Funcionalidade | Status | Detalhes |
|----------------|--------|----------|
| **Capacitor configurado** | ✅ | Arquivo `capacitor.config.ts` pronto |
| **Plugins instalados** | ✅ | @capacitor/core, ios, android, splash-screen, status-bar, app, haptics, keyboard, network, device |
| **RevenueCat SDK** | ✅ | Hook `useRevenueCat` implementado |
| **Hot Reload mobile** | ✅ | Configurado para desenvolvimento |
| **Meta tags mobile** | ✅ | Viewport, safe-area, PWA |
| **Separação Admin/App** | ✅ | Admin só aparece na web |
| **Sistema de traduções** | ✅ | Tabelas e UI prontos |
| **RLS (Row Level Security)** | ✅ | Políticas de segurança ativas |
| **PWA Manifest** | ✅ | `public/manifest.json` configurado |
| **Ícone do App** | ✅ | `public/app-icon-512.png` gerado |
| **Ícones iOS (Apple Touch)** | ✅ | 152x152 e 180x180 gerados |
| **Splash Screen** | ✅ | `public/splash-screen.png` gerado |
| **StatusBar config** | ✅ | Cor de fundo configurada |
| **Hooks nativos** | ✅ | Device, Network, Haptics, Keyboard, App, StatusBar, SplashScreen |
| **Safe Areas CSS** | ✅ | Utilitários Tailwind para notch/home indicator |

### 📁 Assets Gerados

```
public/
├── app-icon-512.png         # Ícone principal (512x512)
├── app-icon-192.png         # Ícone PWA (192x192)
├── apple-touch-icon.png     # Ícone iOS padrão
├── apple-touch-icon-152x152.png  # Ícone iPad
├── apple-touch-icon-180x180.png  # Ícone iPhone
├── splash-screen.png        # Splash screen (1080x1920)
└── manifest.json            # PWA manifest
```

### 🪝 Hooks Nativos Disponíveis

| Hook | Funcionalidade |
|------|----------------|
| `useNativeDevice` | Informações do dispositivo (modelo, OS, bateria) |
| `useNativeNetwork` | Status de conexão em tempo real |
| `useNativeHaptics` | Feedback tátil (vibração, impacto) |
| `useNativeApp` | Ciclo de vida do app (foreground/background), deep links, botão voltar |
| `useNativeKeyboard` | Controle do teclado (mostrar/ocultar, altura) |
| `useNativeStatusBar` | Controle da status bar (cor, estilo, visibilidade) |
| `useNativeSplashScreen` | Controle da splash screen |
| `useNativeInit` | Inicialização automática do app nativo |

**Exemplo de uso:**
```typescript
import { useNativeHaptics } from "@/hooks/useNativeHaptics";
import { ImpactStyle } from "@capacitor/haptics";

const { impact, isNative } = useNativeHaptics();

const handleClick = async () => {
  if (isNative) {
    await impact(ImpactStyle.Medium);
  }
  // ... rest of logic
};
```

### 🔧 Requer Ação do Desenvolvedor

| Item | Ação Necessária |
|------|-----------------|
| **App ID** | Alterar `app.lovable.xxx` para ID único da empresa (ex: `com.suaempresa.storiesapp`) |
| **RevenueCat API Key** | Substituir `test_xxx` pela chave de produção em `useRevenueCat.ts` |
| **Personalizar ícones** | Substituir os ícones gerados pelos oficiais da marca (se necessário) |
| **Signing (iOS)** | Configurar certificados Apple no Xcode |
| **Signing (Android)** | Criar keystore de produção no Android Studio |
| **Remover hot-reload** | Remover seção `server` do capacitor.config.ts para produção |

### 📋 Checklist de Publicação

#### iOS
- [ ] Conta Apple Developer ($99/ano)
- [ ] Certificados de distribuição criados
- [ ] Ícones em todos os tamanhos (20px a 1024px)
- [ ] Screenshots para App Store
- [ ] Política de Privacidade URL
- [ ] Build de produção gerado
- [ ] Testado em dispositivo real

#### Android
- [ ] Conta Google Play Developer ($25 único)
- [ ] Keystore de produção criado (guardar com segurança!)
- [ ] Ícones adaptativos configurados
- [ ] Screenshots para Play Store
- [ ] Política de Privacidade URL
- [ ] AAB de produção gerado
- [ ] Testado em dispositivo real

---

## Suporte

Para dúvidas técnicas sobre a implementação, entre em contato com a equipe de desenvolvimento.

---

*Documento gerado em Janeiro/2026*
