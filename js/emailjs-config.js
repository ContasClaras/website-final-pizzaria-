/**
 * BELLA DOMUS — Configuração do EmailJS
 * ------------------------------------------------------------
 * O EmailJS permite enviar emails reais diretamente do site,
 * sem precisar de um servidor próprio. É gratuito até 200
 * emails/mês, o que chega perfeitamente para reservas de um
 * restaurante.
 *
 * COMO CONFIGURAR (ver também README.md):
 * 1. Cria uma conta gratuita em https://www.emailjs.com
 * 2. Em "Email Services", liga o teu Gmail/Outlook/etc. Vais
 *    receber um SERVICE_ID (ex: "service_abc123").
 * 3. Em "Email Templates", cria 3 templates (podes copiar o
 *    texto sugerido no README.md):
 *      - um para o restaurante ser notificado de um NOVO pedido
 *        de reserva
 *      - um para o CLIENTE receber a CONFIRMAÇÃO da reserva
 *      - um para o CLIENTE receber uma mensagem de recusa
 *    Cada template dá-te um TEMPLATE_ID.
 * 4. Em "Account" > "General", copia a tua PUBLIC KEY.
 * 5. Substitui os valores abaixo pelos teus.
 */
const EMAILJS_CONFIG = {
  PUBLIC_KEY: "uxh7-5AwqD506BMFr",
  SERVICE_ID: "service_2zjl7pj",
  TEMPLATE_NOVO_PEDIDO_RESTAURANTE: "template_1196qub",
  TEMPLATE_CONFIRMACAO_CLIENTE: "template_ljum9g3",
  TEMPLATE_RECUSA_CLIENTE: "SUBSTITUIR_TEMPLATE_RECUSA",
  TEMPLATE_CONTACTO_GERAL: "SUBSTITUIR_TEMPLATE_CONTACTO",
  RESTAURANT_EMAIL: "[email protected]"
};

if (window.emailjs && EMAILJS_CONFIG.PUBLIC_KEY !== "uxh7-5AwqD506BMFr") {
  emailjs.init({ publicKey: EMAILJS_CONFIG.PUBLIC_KEY });
}
