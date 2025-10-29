document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    selectable: true,
    dateClick: function(info) {
      openModal('Nova reserva', info.dateStr);
    }
  });

  calendar.render();

  const modal = document.getElementById('modal');
  const reservaForm = document.getElementById('reservaForm');
  const telefoneInput = document.querySelector('input[name="telefone"]');

  // Máscara de telefone
  telefoneInput.addEventListener('input', function(e) {
    let valor = e.target.value.replace(/\D/g, ''); // remove tudo que não é número
    if (valor.length > 9) valor = valor.slice(0, 9); // limita a 9 dígitos

    // Formata: (99) 99999-999
    if (valor.length > 5) {
      valor = `(${valor.slice(0,2)}) ${valor.slice(2,7)}-${valor.slice(7)}`;
    } else if (valor.length > 2) {
      valor = `(${valor.slice(0,2)}) ${valor.slice(2)}`;
    } else if (valor.length > 0) {
      valor = `(${valor}`;
    }

    e.target.value = valor;
  });

  // Funções do modal
  function openModal(title, dateStr = '') {
    modal.classList.remove('hidden');
    document.getElementById('modalTitle').textContent = title;
    reservaForm.reset();
  }

  function closeModal() {
    modal.classList.add('hidden');
  }

  document.getElementById('cancelBtn').addEventListener('click', closeModal);

  reservaForm.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Reserva salva com sucesso!');
    closeModal();
  });
});
