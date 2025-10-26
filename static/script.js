document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');
  const modal = document.getElementById('modal');
  const form = document.getElementById('reservaForm');
  const cancelBtn = document.getElementById('cancelBtn');
  const chaleFilter = document.getElementById('chaleFilter');
  const modalTitle = document.getElementById('modalTitle');
  const saveBtn = document.getElementById('saveBtn');
  const updateBtn = document.getElementById('updateBtn');
  const removeBtn = document.getElementById('removeBtn');
  const telefoneInput = document.getElementById('telefone');

  let currentEvent = null;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: window.innerWidth < 600 ? 'listWeek' : 'dayGridMonth',
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
    select: function(info) {
      openCreateModal(info.startStr, info.endStr);
    },
    eventClick: function(info) {
      currentEvent = info.event;
      openEditModal(info.event);
    },
    eventDidMount: function(info) {
      const c = info.event.extendedProps.chale;
      if (c == 1) info.el.style.backgroundColor = '#4caf50';
      if (c == 2) info.el.style.backgroundColor = '#2196f3';
      if (c == 3) info.el.style.backgroundColor = '#ff9800';
    }
  });

  calendar.render();

  // 🔹 Ajuste de view para celular
  function resizeCalendar() {
    if(window.innerWidth < 600){
      calendar.changeView('listWeek');
    } else {
      calendar.changeView('dayGridMonth');
    }
  }
  window.addEventListener('resize', resizeCalendar);
  resizeCalendar();

  function fetchEvents(){
    fetch('/reservas')
      .then(r => r.json())
      .then(data => {
        calendar.removeAllEvents();
        const filtro = chaleFilter.value;
        data.forEach(ev => {
          if (filtro !== 'all' && String(ev.extendedProps.chale) !== filtro) return;
          calendar.addEvent(ev);
        });
      });
  }

  chaleFilter.addEventListener('change', fetchEvents);
  fetchEvents();

  // 🟢 Criação de nova reserva
  function openCreateModal(start, end){
    currentEvent = null;
    modalTitle.textContent = 'Nova reserva';
    saveBtn.classList.remove('hidden');
    updateBtn.classList.add('hidden');
    removeBtn.classList.add('hidden');
    modal.classList.remove('hidden');
    form.reset();

    const entrada = start.slice(0,10);
    const saida = (end)
      ? new Date(new Date(end).getTime() - 24*60*60*1000).toISOString().slice(0,10)
      : entrada;

    form.elements['entrada'].value = entrada;
    form.elements['saida'].value = saida;

    setTimeout(() => form.elements['nome'].focus(), 100); // foca no campo nome no mobile
  }

  // 🟡 Edição de reserva existente
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

    // 🔗 Mostra link do WhatsApp se tiver telefone
    const t = event.extendedProps.telefone || '';
    const clean = t.replace(/\D/g, '');
    const linkArea = document.getElementById('whatsappLinkArea');
    if (clean.length >= 11) {
      linkArea.innerHTML = `<a href="https://wa.me/55${clean}" target="_blank" class="whatsapp-link">📱 Enviar WhatsApp</a>`;
    } else {
      linkArea.innerHTML = '';
    }
  }

  function closeModal(){ 
    modal.classList.add('hidden'); 
    form.reset(); 
    currentEvent = null; 
  }

  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (ev)=>{ if (ev.target === modal) closeModal(); });

  // 🟩 Criar
  form.addEventListener('submit', function(e){
    e.preventDefault();
    if (saveBtn.classList.contains('hidden')) return;
    const fd = new FormData(form);
    fetch('/criar', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(resp => {
        if (resp.success) {
          closeModal();
          fetchEvents();
        } else {
          alert('Erro: ' + (resp.error||'unknown'));
        }
      }).catch(err=>alert('Erro: '+err));
  });

  // 🟦 Atualizar
  updateBtn.addEventListener('click', function(){
    const fd = new FormData(form);
    fetch('/atualizar', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(resp => {
        if (resp.success) {
          closeModal();
          fetchEvents();
        } else {
          alert('Erro: ' + (resp.error||'unknown'));
        }
      }).catch(err=>alert('Erro: '+err));
  });

  // 🟥 Remover
  removeBtn.addEventListener('click', function(){
    if (!confirm('Remover esta reserva?')) return;
    const fd = new FormData();
    fd.append('id', form.elements['id'].value);
    fetch('/remover', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(resp => {
        if (resp.success) {
          closeModal();
          fetchEvents();
        } else {
          alert('Erro: ' + (resp.error||'unknown'));
        }
      }).catch(err=>alert('Erro: '+err));
  });

  // 📱 Máscara do telefone
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
});
