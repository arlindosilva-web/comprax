# 📋 Guia de Instalação e Configuração - CompraX

Este documento descreve os passos necessários para configurar o ambiente e executar o projeto **CompraX** localmente.

---

## 1. Pré-requisitos Técnicos

Antes de começar, certifique-se de ter instalado em sua máquina:

- **Node.js** (Versão 18 ou superior)
- **NPM** ou **Yarn**
- **Expo Go** (Instalado no seu dispositivo físico Android ou iOS para testar geolocalização)

---

## 2. Configuração do Backend (Firebase)

O CompraX utiliza o Firebase para autenticação e banco de dados em tempo real.

1. Acesse o https://console.firebase.google.com/
2. Crie um novo projeto chamado `CompraX`
3. No menu lateral **Build**, configure:

### 🔐 Authentication
- Ative o método de login **E-mail/Senha**

### 📊 Firestore Database
- Crie o banco de dados
- Vá na aba **Rules** e cole:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. Registre um **Web App** para obter:
   - API Key
   - Project ID
   - App ID
   - Outros dados necessários

---

## 3. Configuração de Geolocalização (Google Cloud)

Para a aba **Explorar** funcionar:

1. Acesse https://console.cloud.google.com/
2. Crie um projeto
3. Ative a **Places API**
4. Gere uma **API Key**

---

## 4. Instalação Local

### 📥 Clonar o repositório

```bash
git clone https://github.com/seu-usuario/comprax.git
cd comprax
```

### 📦 Instalar dependências

```bash
npm install
```

### ⚙️ Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Google Maps API
EXPO_PUBLIC_GOOGLE_API_KEY=SUA_CHAVE_AQUI

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=SUA_CHAVE
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu-id
EXPO_PUBLIC_FIREBASE_APP_ID=seu-app-id
```

---

## 5. Execução do Projeto

Para iniciar o projeto:

```bash
npx expo start -c
```

- Abra o **Expo Go**
- Escaneie o QR Code

⚠️ **Importante:**  
Recursos de GPS e navegação funcionam apenas em **dispositivos físicos**

---

## 6. Configuração de Índices (Troubleshooting)

Se os dados não aparecerem no app:

1. Verifique o terminal do Expo
2. O Firebase irá exibir um erro com um link
3. Clique no link
4. Faça login
5. Clique em **Criar Índice**

⏳ Aguarde de 3 a 5 minutos até o status ficar como **Ativo**

---

## ✅ Pronto!

Agora seu ambiente estará configurado corretamente 🚀
