// === ELEMENTOS DO MODAL ===
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const form = document.getElementById('reservaForm');

const saveBtn = document.getElementById('saveBtn');
const updateBtn = document.getElementById('updateBtn');
const removeBtn = document.getElementById('removeBtn');
const checkinBtn = document.getElementById('checkinBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const cancelBtn = document.getElementById('cancelBtn');

// === FUNÇÕES MODAL ===
function closeModal() {
  modal.classList.add('hidden');
  form.reset();
  saveBtn.classList.remove('hidden');
  updateBtn.classList.add('hidden');
  removeBtn.classList.add('hidden');
  checkinBtn.classList.add('hidden');
  checkoutBtn.classList.add('hidden');
}

cancelBtn.addEventListener('click', closeModal);

// === ABRIR MODAL PARA CRIAR RESERVA ===
function openCreateModal(dateStr) {
  modalTitle.textContent = 'Nova Reserva';
  saveBtn.classList.remove('hidden');
  updateBtn.classList.add('hidden');
  removeBtn.classList.add('hidden');
  checkinBtn.classList.add('hidden');
  checkoutBtn.classList.add('hidden');
  modal.classList.remove('hidden');
  form.reset();

  // Preencher datas automaticamente
  form.elements['entrada'].value = dateStr;
  let nextDay = new Date(dateStr);
  nextDay.setDate(nextDay.getDate() + 1);
  form.elements['saida'].value = nextDay.toISOString().slice(0,10);

  form.elements['pessoas'].value = 2; // valor padrão
}

// === ABRIR MODAL PARA EDITAR ===
function openEditModal(event){
  modalTitle.textContent = 'Editar reserva';
  saveBtn.classList.add('hidden');
  updateBtn.classList.remove('hidden');
  removeBtn.classList.remove('hidden');
  checkinBtn.classList.add('hidden');
  checkoutBtn.classList.add('hidden');
  modal.classList.remove('hidden');
  form.reset();

  form.elements['id'].value = event.id;
  form.elements['chale'].value = event.extendedProps.chale;
  form.elements['nome'].value = event.title.split(' — ').slice(1).join(' — ') || '';
  form.elements['telefone'].value = event.extendedProps.telefone || '';
  form.elements['valor'].value = event.extendedProps.valor || '';
  form.elements['observacao'].value = event.extendedProps.observacao || '';
  form.elements['entrada'].value = event.startStr.slice(0,10);
  form.elements['saida'].value = event.endStr ? event.endStr.slice(0,10) : event.startStr.slice(0,10);
  form.elements['pessoas'].value = event.extendedProps.pessoas || 2;

  // Mostrar botões de check-in/check-out
  if(!event.extendedProps.checkin) checkinBtn.classList.remove('hidden');
  else if(event.extendedProps.checkin && !event.extendedProps.checkout) checkoutBtn.classList.remove('hidden');
}

// === CHECK-IN / CHECK-OUT ===
checkinBtn.addEventListener('click', function(){
  const fd = new FormData();
  fd.append('id', form.elements['id'].value);
  fetch('/checkin', { method: 'POST', body: fd })
    .then(r => r.json())
    .then(resp => {
      if(resp.success){ closeModal(); fetchEvents(); } 
      else alert('Erro: ' + (resp.error||'unknown'));
    })
    .catch(err=>alert('Erro: '+err));
});

checkoutBtn.addEventListener('click', function(){
  const fd = new FormData();
  fd.append('id', form.elements['id'].value);
  fetch('/checkout', { method: 'POST', body: fd })
    .then(r => r.json())
    .then(resp => {
      if(resp.success){ closeModal(); fetchEvents(); } 
      else alert('Erro: ' + (resp.error||'unknown'));
    })
    .catch(err=>alert('Erro: '+err));
});

// === SALVAR / ATUALIZAR / REMOVER RESERVA ===
saveBtn.addEventListener('click', function(e){
  e.preventDefault();
  const fd = new FormData(form);
  fetch('/criar', { method:'POST', body: fd })
    .then(r=>r.json())
    .then(resp => {
      if(resp.success){ closeModal(); fetchEvents(); }
      else alert('Erro: ' + (resp.error||'unknown'));
    })
    .catch(err=>alert('Erro: '+err));
});

updateBtn.addEventListener('click', function(e){
  e.preventDefault();
  const fd = new FormData(form);
  fetch('/atualizar', { method:'POST', body: fd })
    .then(r=>r.json())
    .then(resp => {
      if(resp.success){ closeModal(); fetchEvents(); }
      else alert('Erro: ' + (resp.error||'unknown'));
    })
    .catch(err=>alert('Erro: '+err));
});

removeBtn.addEventListener('click', function(){
  if(!confirm('Deseja realmente remover esta reserva?')) return;
  const fd = new FormData();
  fd.append('id', form.elements['id'].value);
  fetch('/remover', { method:'POST', body: fd })
    .then(r=>r.json())
    .then(resp => {
      if(resp.success){ closeModal(); fetchEvents(); }
      else alert('Erro: ' + (resp.error||'unknown'));
    })
    .catch(err=>alert('Erro: '+err));
});

// === INICIALIZAÇÃO DO CALENDAR ===
document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    
    // Adiciona botão Nova Reserva no cabeçalho
    headerToolbar: {
      left: 'prev,next',
      center: 'title',
      right: 'novaReservaBtn'
    },
    customButtons: {
      novaReservaBtn: {
        text: '+',
        click: function() {
          const today = new Date();
          const tomorrow = new Date();
          tomorrow.setDate(today.getDate() + 1);
          openCreateModal(today.toISOString().slice(0,10));
        }
      }
    },

    events: '/reservas', // rota que retorna eventos

    // Clicar em evento existente
    eventClick: function(info) {
      openEditModal(info.event);
    },

    // Clicar em um dia vazio para criar reserva
    dateClick: function(info) {
      openCreateModal(info.dateStr);
    }
  });

  calendar.render();

  // função global para recarregar eventos
  window.fetchEvents = function() {
    calendar.refetchEvents();
  }
});
