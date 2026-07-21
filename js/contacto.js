// Bella Domus — formulário de contacto geral (envia via EmailJS)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const msg = document.getElementById('contact-msg');
  const btn = document.getElementById('contact-submit');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.className = 'form-msg';

    if (!EMAILJS_CONFIG || EMAILJS_CONFIG.PUBLIC_KEY === "SUBSTITUIR_PUBLIC_KEY") {
      msg.textContent = "O envio de emails ainda não está configurado. Ver README.md (secção EmailJS) para ativar.";
      msg.classList.add('show', 'error');
      return;
    }

    const data = {
      nome: document.getElementById('c-nome').value,
      email: document.getElementById('c-email').value,
      telefone: document.getElementById('c-telefone').value || '—',
      assunto: document.getElementById('c-assunto').value,
      mensagem: document.getElementById('c-mensagem').value,
      to_email: EMAILJS_CONFIG.RESTAURANT_EMAIL
    };

    btn.disabled = true;
    btn.textContent = 'A enviar…';

    try {
      await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_CONTACTO_GERAL, data);
      msg.textContent = 'Mensagem enviada! Entraremos em contacto em breve.';
      msg.classList.add('show', 'success');
      form.reset();
    } catch (err) {
      console.error(err);
      msg.textContent = 'Não foi possível enviar a mensagem agora. Tente novamente ou ligue-nos diretamente.';
      msg.classList.add('show', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Enviar mensagem';
    }
  });
});
