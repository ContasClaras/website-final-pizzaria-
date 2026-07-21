# Bella Domus — Website

Site completo para o restaurante Bella Domus: página inicial, menu, história,
galeria, contacto, sistema de reservas online e painel de administração para
gerir pedidos e as 28 mesas do restaurante.

Este guia explica tudo o que precisas de fazer para publicar o site e ativar
as reservas + emails automáticos. Não precisas de saber programar — é
sobretudo copiar e colar chaves de duas contas gratuitas.

---

## 1. Estrutura do projeto

```
bella-domus/
├── index.html          → página inicial
├── menu.html            → menu do restaurante
├── sobre.html           → história / sobre nós
├── galeria.html          → galeria de fotos
├── reservas.html         → formulário de reservas (público)
├── contacto.html         → contactos + formulário geral
├── admin-login.html      → login da equipa
├── admin.html             → painel de gestão (reservas + mesas)
├── firestore.rules       → regras de segurança da base de dados
├── css/style.css         → todo o estilo visual do site
├── js/
│   ├── main.js            → menu mobile, animações
│   ├── firebase-config.js → ligação à base de dados (reservas/mesas)
│   ├── emailjs-config.js  → ligação ao envio de emails
│   ├── reservas.js        → lógica do formulário de reservas
│   ├── contacto.js        → lógica do formulário de contacto
│   └── admin.js           → lógica do painel de gestão
```

Antes de publicar, o essencial a fazer é:
1. Substituir os textos entre `[colchetes]` (morada, telefone, ano de
   fundação, nomes de pratos, etc.) pelos dados reais do restaurante.
2. Substituir os blocos com 🖼️ pelas fotos reais (ver secção 5).
3. Configurar o Firebase (secção 2) — para as reservas e o painel funcionarem.
4. Configurar o EmailJS (secção 3) — para os emails automáticos serem enviados.

O site funciona (mostra todas as páginas) mesmo sem estes passos, mas os
formulários de reserva/contacto e o painel de admin só ficam realmente
operacionais depois de configurares o Firebase e o EmailJS.

---

## 2. Configurar o Firebase (base de dados + login da equipa)

O Firebase é um serviço da Google, gratuito no volume de um restaurante, que
guarda as reservas e a lista de mesas "na nuvem" — para que funcione em
qualquer telemóvel ou computador, em tempo real.

1. Vai a **https://console.firebase.google.com** e cria um projeto novo
   (ex: "bella-domus"). Podes desativar o Google Analytics, não é necessário.
2. Dentro do projeto, clica no ícone **`</>`** ("Web") para adicionar uma app
   web. Dá-lhe um nome (ex: "site") e clica em "Registar app".
3. O Firebase mostra-te um bloco de código com um objeto `firebaseConfig`.
   Copia os valores (`apiKey`, `authDomain`, `projectId`, etc.) e cola-os no
   ficheiro **`js/firebase-config.js`**, substituindo os valores
   `"SUBSTITUIR_..."`.
4. No menu lateral esquerdo do Firebase:
   - Vai a **Firestore Database** → "Criar base de dados" → escolhe uma
     localização (ex: `eur3 (Europe)`) → modo **produção**.
   - Vai a **Authentication** → separador "Sign-in method" → ativa
     **Email/Password**.
   - Ainda em Authentication, separador **Users** → "Adicionar utilizador" →
     cria o email + palavra-passe que a equipa vai usar para entrar no
     painel (`admin-login.html`). Podes criar uma conta por cada pessoa da
     equipa que precise de acesso.
5. Vai a **Firestore Database → Rules**, apaga o conteúdo e cola o conteúdo
   do ficheiro **`firestore.rules`** (incluído nesta pasta). Clica em
   "Publicar". Isto garante que:
   - Qualquer visitante pode pedir uma reserva.
   - Só a equipa com login pode ver, aceitar, recusar ou apagar reservas, e
     gerir as mesas.

Pronto — o formulário de reservas e o painel de administração já vão
funcionar. Na primeira vez que abrires `admin.html`, o sistema cria
automaticamente 7 mesas de 4 lugares (28 no total) para começares; edita-as
na aba "Mesas" para corresponderem à disposição real da vossa sala.

---

## 3. Configurar o EmailJS (emails automáticos)

O EmailJS envia emails reais diretamente do site (sem precisares de um
servidor). É gratuito até 200 emails/mês.

1. Cria uma conta em **https://www.emailjs.com**.
2. Em **Email Services**, liga a tua conta de email (Gmail, Outlook, etc.).
   Isto dá-te um **Service ID** (ex: `service_abc123`).
3. Em **Email Templates**, cria **4 templates**. Para cada um, o EmailJS
   dá-te um **Template ID** — vais precisar dos 4.

   ### a) Novo pedido de reserva (para o restaurante)
   Variáveis usadas pelo código: `to_email`, `client_name`, `client_email`,
   `client_phone`, `party_size`, `date`, `time`, `notes`

   Sugestão de conteúdo:
   ```
   Assunto: Novo pedido de reserva — {{client_name}}

   Novo pedido de reserva recebido:

   Nome: {{client_name}}
   Email: {{client_email}}
   Telefone: {{client_phone}}
   Pessoas: {{party_size}}
   Data: {{date}}
   Hora: {{time}}
   Notas: {{notes}}

   Aceitar ou recusar no painel: [link do vosso admin.html]
   ```
   Define o destinatário do template para `{{to_email}}` (o email do
   restaurante).

   ### b) Confirmação de reserva (para o cliente)
   Variáveis: `to_email`, `client_name`, `date`, `time`, `party_size`,
   `table_names`

   ```
   Assunto: A sua reserva no Bella Domus está confirmada!

   Olá {{client_name}},

   A sua reserva foi confirmada:
   Data: {{date}} às {{time}}
   Pessoas: {{party_size}}
   Mesa: {{table_names}}

   Esperamos por si!
   Bella Domus
   ```

   ### c) Recusa de reserva (para o cliente)
   Variáveis: `to_email`, `client_name`, `date`, `time`

   ```
   Assunto: Sobre o seu pedido de reserva

   Olá {{client_name}},

   Lamentamos, mas não temos disponibilidade para {{date}} às {{time}}.
   Contacte-nos para encontrarmos outra data — teríamos todo o gosto em
   recebê-lo(a).

   Bella Domus
   ```

   ### d) Contacto geral (formulário da página de contacto)
   Variáveis: `to_email`, `nome`, `email`, `telefone`, `assunto`, `mensagem`

4. Em **Account → General**, copia a tua **Public Key**.
5. Abre **`js/emailjs-config.js`** e substitui:
   - `PUBLIC_KEY`
   - `SERVICE_ID`
   - `TEMPLATE_NOVO_PEDIDO_RESTAURANTE` (template a)
   - `TEMPLATE_CONFIRMACAO_CLIENTE` (template b)
   - `TEMPLATE_RECUSA_CLIENTE` (template c)
   - `TEMPLATE_CONTACTO_GERAL` (template d)
   - `RESTAURANT_EMAIL` (o email real do restaurante)

Assim que gravares estas alterações, o email de confirmação (ou recusa) é
enviado automaticamente ao cliente no momento em que a equipa clica em
"Aceitar" ou "Recusar" no painel.

---

## 4. Publicar o site

Como é um site estático (HTML/CSS/JS), podes publicá-lo gratuitamente em
qualquer um destes serviços — escolhe o que te for mais simples:

- **Netlify** (mais simples): cria conta em netlify.com → arrasta a pasta
  `bella-domus` para o painel "Deploys" → pronto, tens um URL público.
- **Vercel**: vercel.com → "Add New Project" → importa a pasta.
- **Firebase Hosting**: já que estás a usar o Firebase para a base de
  dados, podes alojar o site no mesmo projeto com o comando
  `firebase deploy` (requer Node.js e `npm install -g firebase-tools`).
- **GitHub Pages**: sobe a pasta para um repositório GitHub e ativa
  "Pages" nas definições do repositório.

Depois de publicado, associa o teu domínio próprio (ex: `bella-domus.pt`)
nas definições de domínio do serviço escolhido.

---

## 5. Substituir as fotos

Todos os quadros com 🖼️ (na página inicial, sobre, galeria e menu) são
espaços reservados. Para os substituir por uma foto real:

```html
<!-- ANTES -->
<div style="aspect-ratio:4/5; background:...">🖼️ Espaço para foto...</div>

<!-- DEPOIS -->
<img src="img/sala-principal.jpg" alt="Sala principal do Bella Domus" style="aspect-ratio:4/5; object-fit:cover; width:100%;">
```

Coloca os ficheiros de imagem dentro da pasta `img/`. Recomenda-se
comprimir as fotos (ex: em squoosh.app) antes de as colocar, para o site
carregar rápido.

---

## 6. Notas finais

- O ícone circular ("selo") e as cores (vermelho tijolo, verde-oliva,
  dourado, pergaminho) fazem parte da identidade visual criada para o
  Bella Domus — todos os tons estão definidos como variáveis CSS no topo
  de `css/style.css`, caso queiram ajustar.
- Textos entre `[colchetes]` (morada, telefone, ano, nomes de pratos e
  preços) são de exemplo — substituam pelos dados reais.
- O menu incluído é um exemplo de cozinha italiana tradicional — substituam
  pelos vossos pratos, preços e categorias reais em `menu.html`.
- Qualquer pessoa com conta de email/password criada no Firebase
  Authentication consegue entrar no painel em `admin-login.html`.
