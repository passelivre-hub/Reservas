<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reservas</title>
<link href="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/main.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/main.min.js"></script>

<style>
/* ================== Geral ================== */
body {
  font-family: Arial, Helvetica, sans-serif;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: #f0f4fa; /* azul claro suave de fundo */
}

.container {
  max-width: 1100px;
  margin: 20px auto;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

h1 {
  margin-top: 0;
  font-size: 2em;
  text-align: center;
  color: #0057B7; /* azul corporativo */
  font-weight: bold;
}

/* ================== Botão Nova Reserva ================== */
#addReservaBtn {
  margin-bottom: 10px;
  background: #0057B7;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  color: #FFD700;
  font-weight: bold;
  cursor: pointer;
}

#addReservaBtn:hover {
  opacity: 0.85;
}

/* ================== Legenda ================== */
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.chip {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 12px;
  color: #fff;
  font-size: 0.9em;
  font-weight: bold;
}

.c1 { background: #FFD700; color:#000; } /* amarelo */
.c2 { background: #0057B7; color:#fff; } /* azul */
.c3 { background: #FFA500; color:#fff; } /* laranja */

/* ================== Modal ================== */
.modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  z-index: 9999;
}

.hidden {
  display: none;
}

.modal-content {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  width: 400px;
  max-width: 95%;
  box-shadow: 0 6px 16px rgba(0,0,0,0.25);
  position: relative;
}

.modal-content h2 {
  margin-top: 0;
  color: #0057B7;
  font-size: 1.4em;
  text-align: center;
}

/* ================== Form ================== */
.modal-content form label {
  display: block;
  margin-bottom: 6px;
  font-weight: bold;
  color: #333;
}

.modal-content input,
.modal-content select,
.modal-content textarea {
  width: 100%;
  padding: 8px;
  margin-top: 4px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
  font-size: 0.95em;
}

textarea {
  resize: vertical;
}

/* ================== Botões ================== */
.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
  flex-wrap: wrap;
}

button {
  cursor: pointer;
  padding: 10px 16px;
  border-radius: 8px;
  border: 0;
  background: #0057B7; /* azul corporativo */
  color: #FFD700; /* amarelo */
  font-weight: bold;
  transition: 0.2s;
}

button:hover { opacity: 0.85; }
button.secondary { background: #9e9e9e; }
button.danger { background: #d32f2f; }

/* ================== WhatsApp ================== */
.whatsapp-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #25D366;
  text-decoration: none;
}

/* ================== Responsivo ================== */
@media (max-width: 600px) {
  .container {
    margin: 10px;
    padding: 12px;
    box-shadow: none;
    border-radius: 8px;
  }

  .modal-content {
    width: 95%;
    padding: 14px;
    font-size: 14px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .actions button {
    flex: 1 1 48%;
    padding: 10px;
  }
}
</style>
</head>

<body>
<div class="container">
  <h1>Calendário de Reservas</h1>

  <button id="addReservaBtn">+ Nova reserva</button>
  <div id="calendar"></div>

  <div class="legend">
    <span class="chip c1">Chalé 1</span>
    <span class="chip c2">Chalé 2</span>
    <span class="chip c3">Chalé 3</span>
  </div>
</div>

<!-- Modal -->
<div id="modal" class="modal hidden">
  <div class="modal-content">
    <h2 id="modalTitle">Nova Reserva</h2>
    <form id="reservaForm">
      <input type="hidden" name="id">
      <label>Chalé</label>
      <select name="chale">
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
      </select>
      <label>Nome</label>
      <input name="nome" type="text">
      <label>Telefone</label>
      <input name="telefone" type="text" id="telefone">
      <label>Valor</label>
      <input name="valor" type="text">
      <label>Observação</label>
      <textarea name="observacao"></textarea>
      <label>Entrada</label>
      <input name="entrada" type="date">
      <label>Saída</label>
      <input name="saida" type="date">
      <div id="whatsappLinkArea"></div>

      <div class="actions">
        <button type="submit" id="saveBtn">Salvar</button>
        <button type="button" class="secondary" id="updateBtn">Atualizar</button>
        <button type="button" class="danger" id="removeBtn">Remover</button>
        <button type="button" class="secondary" id="cancelBtn">Cancelar</button>
      </div>
    </form>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');
  const modal = document.getElementById('modal');
  const form = document.getElementById('reservaForm');
  const cancelBtn = document.getElementById('cancelBtn');
  const modalTitle = document.getElementById('modalTitle');
  const saveBtn = document.getElementById('saveBtn');
  const updateBtn = document.getElementById('updateBtn');
  const removeBtn = document.getElementById('removeBtn');
  const telefoneInput = document.getElementById('telefone');
  const addBtn = document.getElementById('addReservaBtn');

  let currentEvent = null;

  addBtn.addEventListener('click', () => openCreateModal(new Date().toISOString(), new Date().toISOString()));

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth', // sempre Mês
    selectable: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listWeek'
    },
    views: {
      dayGridMonth: { buttonText: 'Mês' },
      timeGridWeek: { buttonText: 'Semana' },
      listWeek: { buttonText: 'Lista' }
    },
    dateClick: function(info) { openCreateModal(info.dateStr, info.dateStr); },
    select: function(info) { openCreateModal(info.startStr, info.endStr); },
    eventClick: function(info) { currentEvent = info.event; openEditModal(info.event); },
    eventDidMount: function(info) {
      const c = info.event.extendedProps.chale;
      if (c == 1) info.el.style.backgroundColor = '#FFD700';
      if (c == 2) info.el.style.backgroundColor = '#0057B7';
      if (c == 3) info.el.style.backgroundColor = '#FFA500';
    }
  });

  calendar.render();

  function resizeCalendar() {
    if(window.innerWidth < 600){
      calendar.changeView('listWeek');
    } else {
      calendar.changeView('dayGridMonth');
    }
  }
  window.addEventListener('resize', resizeCalendar);

  function fetchEvents(){
    fetch('/reservas')
      .then(r => r.json())
      .then(data => {
        calendar.removeAllEvents();
        data.forEach(ev => calendar.addEvent(ev));
      });
  }

  fetchEvents();

  function openCreateModal(start, end){
    currentEvent = null;
    modalTitle.textContent = 'Nova reserva';
    saveBtn.classList.remove('hidden');
    updateBtn.classList.add('hidden');
    removeBtn.classList.add('hidden');
    modal.classList.remove('hidden');
    form.reset();

    const entrada = start.slice(0,10);
    const saida = end ? new Date(new Date(end).getTime()).toISOString().slice(0,10) : entrada;

    form.elements['entrada'].value = entrada;
    form.elements['saida'].value = saida;

    setTimeout(() => form.elements['nome'].focus(), 150);
  }

  function openEditModal(event){
    modalTitle.textContent = `Reserva nº${event.id}`;
    saveBtn.classList.add('hidden');
    updateBtn.classList.remove('hidden');
    removeBtn.classList.remove('hidden');
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

    const t = event.extendedProps.telefone || '';
    const clean = t.replace(/\D/g, '');
    const linkArea = document.getElementById('whatsappLinkArea');
    if (clean.length >= 11) {
      linkArea.innerHTML = `<a href="https://wa.me/55${clean}" target="_blank" class="whatsapp-link">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#25D366" viewBox="0 0 24 24">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12 .1C5.52.1.1 5.52.1 12c0 2.1.54 4.1 1.56 5.9L.1 24l6.3-1.62a11.94 11.94 0 0 0 5.6 1.42h.01c6.48 0 11.9-5.42 11.9-11.9 0-3.18-1.24-6.17-3.39-8.42zM12 21.9c-1.73 0-3.42-.45-4.9-1.31l-.35-.2-3.74.96 1-3.64-.24-.37a9.91 9.91 0 0 1-1.54-5.34c0-5.46 4.44-9.9 9.9-9.9 2.65 0 5.15 1.03 7.03 2.9A9.86 9.86 0 0 1 21.9 12c0 5.46-4.44 9.9-9.9 9.9zm5.42-7.47c-.3-.15-1.77-.88-2.05-.98-.28-.1-.49-.15-.7.15-.2.3-.8.97-.98 1.17-.18.2-.36.22-.66.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.77-1.68-2.07-.18-.3-.02-.46.13-.61.14-.14.3-.36.45-.53.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.7-1.7-.96-2.32-.25-.6-.5-.52-.7-.53-.18 0-.4-.02-.61-.02-.22 0-.57.08-.87.38-.3.3-1.13 1.1-1.13 2.67s1.16 3.1 1.32 3.32c.15.2 2.28 3.47 5.54 4.86.77.33 1.37.53 1.83.67.77.25 1.48.22 2.04.13.62-.1 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.07-.13-.25-.2-.55-.35z"/>
      </svg><span>Enviar WhatsApp</span></a>`;
    } else { linkArea.innerHTML = ''; }
  }

  function closeModal(){ 
    modal.classList.add('hidden'); 
    form.reset(); 
    currentEvent = null; 
  }

  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (ev)=>{ if (ev.target === modal) closeModal(); });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if (saveBtn.classList.contains('hidden')) return;
    const fd = new FormData(form);
    fetch('/criar', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(resp => { if (resp.success) { closeModal(); fetchEvents(); } else { alert('Erro: ' + (resp.error||'unknown')); } })
      .catch(err=>alert('Erro: '+err));
  });

  updateBtn.addEventListener('click', function(){
    const fd = new FormData(form);
    fetch('/atualizar', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(resp => { if (resp.success) { closeModal(); fetchEvents(); } else { alert('Erro: ' + (resp.error||'unknown')); } })
      .catch(err=>alert('Erro: '+err));
  });

  removeBtn.addEventListener('click', function(){
    if (!confirm('Remover esta reserva?')) return;
    const fd = new FormData();
    fd.append('id', form.elements['id'].value);
    fetch('/remover', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(resp => { if (resp.success) { closeModal(); fetchEvents(); } else { alert('Erro: ' + (resp.error||'unknown')); } })
      .catch(err=>alert('Erro: '+err));
  });

  telefoneInput.addEventListener('input', () => {
    let v = telefoneInput.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0,11);
    if (v.length > 6) {
      telefoneInput.value = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    } else if (v.length > 2) {
      telefoneInput.value = `(${v.slice(0,2)}) ${v.slice(2)}`;
    } else {
      telefoneInput.value = v;
    }
  });

  // força inicial para Mês em todos os dispositivos
  calendar.changeView('dayGridMonth');
});
</script>
</body>
</html>
