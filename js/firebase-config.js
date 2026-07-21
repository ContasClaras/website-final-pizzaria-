/**
 * BELLA DOMUS — Configuração do Firebase
 * ------------------------------------------------------------
 * O Firebase (Google) guarda as reservas e a lista das 28 mesas
 * numa base de dados na nuvem, para que o painel de administração
 * funcione em qualquer computador ou telemóvel, em tempo real.
 * O plano gratuito ("Spark") chega perfeitamente para este site.
 *
 * COMO CONFIGURAR (ver também README.md):
 * 1. Vai a https://console.firebase.google.com e cria um projeto novo
 *    (ex: "bella-domus").
 * 2. Dentro do projeto, clica no ícone "</>" (Web) para criar uma app
 *    web. Vai receber um objeto de configuração — copia os valores
 *    para dentro de `firebaseConfig` abaixo.
 * 3. No menu lateral, ativa:
 *      - "Firestore Database" → criar base de dados → modo produção
 *      - "Authentication" → separador "Sign-in method" → ativar
 *        "Email/Password" → depois em "Users", adicionar manualmente
 *        o email/password que a equipa vai usar para entrar no admin
 * 4. Copia as regras de segurança do ficheiro firestore.rules (incluído
 *    nesta pasta) para Firestore → separador "Rules", e publica.
 */
const firebaseConfig = {
  apiKey: "SUBSTITUIR_API_KEY",
  authDomain: "SUBSTITUIR.firebaseapp.com",
  projectId: "SUBSTITUIR_PROJECT_ID",
  storageBucket: "SUBSTITUIR.appspot.com",
  messagingSenderId: "SUBSTITUIR_SENDER_ID",
  appId: "SUBSTITUIR_APP_ID"
};

const FIREBASE_READY = firebaseConfig.apiKey !== "SUBSTITUIR_API_KEY";

let db = null;
let auth = null;

if (FIREBASE_READY) {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
} else {
  console.warn("Firebase ainda não está configurado — ver js/firebase-config.js e README.md");
}
