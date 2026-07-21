// Bella Domus — envio de pedidos de reserva
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('reserva-form');
  const msg = document.getElementById('reserva-msg');
  const btn = document.getElementById('reserva-submit');
  if (!form) return;

  // impede reservas para datas passadas
  const dataInput = document.getElementById('r-data');
  const today = new Date().toISOString().split('T')[0];
  dataInput.setAttribute('min', today);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.className = 'form-msg';

    if (!FIREBASE_READY) {
      msg.textContent = "O sistema de reservas ainda não está configurado. Ver README.md (secção Firebase) para ativar.";
      msg.classList.add('show', 'error');
      return;
    }

    const reservation = {
      name: document.getElementById('r-nome').value.trim(),
      email: document.getElementById('r-email').value.trim(),
      phone: document.getElementById('r-telefone').value.trim(),
      partySize: parseInt(document.getElementById('r-pessoas').value, 10),
      date: document.getElementById('r-data').value,
      time: document.getElementById('r-hora').value,
      notes: document.getElementById('r-notas').value.trim(),
      status: 'pending',
      tableIds: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (!reservation.name || !reservation.email || !reservation.phone || !reservation.date || !reservation.time) {
      msg.textContent = "Por favor preencha todos os campos obrigatórios.";
      msg.classList.add('show', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'A enviar…';

    try {
      await db.collection('reservations').add(reservation);

      // notifica a equipa do restaurante por email (se o EmailJS estiver configurado)
      if (window.emailjs && EMAILJS_CONFIG.PUBLIC_KEY !== "SUBSTITUIR_PUBLIC_KEY") {
        try {
          await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_NOVO_PEDIDO_RESTAURANTE, {
            to_email: EMAILJS_CONFIG.RESTAURANT_EMAIL,
            client_name: reservation.name,
            client_email: reservation.email,
            client_phone: reservation.phone,
            party_size: reservation.partySize,
            date: reservation.date,
            time: reservation.time,
            notes: reservation.notes || '—'
          });
        } catch (mailErr) {
          console.warn('Reserva guardada, mas o email de notificação à equipa falhou:', mailErr);
        }
      }

      msg.textContent = 'Pedido enviado! Vai receber um email assim que a equipa confirmar a sua reserva.';
      msg.classList.add('show', 'success');
      form.reset();
    } catch (err) {
      console.error(err);
      msg.textContent = 'Não foi possível enviar o pedido agora. Tente novamente em instantes ou ligue-nos.';
      msg.classList.add('show', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Pedir reserva';
    }
  });
});
