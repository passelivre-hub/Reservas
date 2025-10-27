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

  let currentEvent = null;

  const addBtn = document.createElement('button');
  addBtn.textContent = '+ Nova reserva';
  addBtn.style.margin = '10px 0';
  addBtn.style.background = '#4caf50';
  addBtn.style.border = 'none';
  addBtn.style.padding = '10px 16px';
  addBtn.style.borderRadius = '6px';
  addBtn.style.color = '#fff';
  addBtn.style.fontSize = '16px';
  addBtn.style.fontWeight = 'bold';
  addBtn.style.cursor = 'pointer';
  calendarEl.parentNode.insertBefore(addBtn, calendarEl);
  addBtn.addEventListener('click', () => {
    const hoje = new Date();
    const hojeISO = hoje.toISOString().slice(0,10);
    const amanhaISO = new Date(hoje.getTime() + 24*60*60*1000).toISOString().slice(0,10);
    openCreateModal(hojeISO, amanhaISO);
  });

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    selectable: true,
    headerToolbar: { left:'prev,next today', center:'title', right:'' },
    dateClick: function(info) {
      const entrada = info.dateStr;
      const saida = info.dateStr; // mesma data inicial
      openCreateModal(entrada, saida);
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
      const el = info.el;
      let color = '#4caf50';
      if(c==2) color = '#2196f3';
      if(c==3) color = '#ff9800';
      el.style.background = color;
      el.style.height = window.innerWidth <= 600 ? '18px' : '14px';
      el.style.marginTop = '2px';
    }
  });

  calendar.render();

  function fetchEvents(){
    fetch('/reservas')
      .then(r => r.json())
      .then(data => {
        calendar.removeAllEvents();
        data.forEach(ev => {
          calendar.addEvent(ev); // usa exatamente start e end do servidor
        });
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
    form.elements['entrada'].value = start;
    form.elements['saida'].value = end;
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
    form.elements['saida'].value = event.endStr.slice(0,10); // sem ajuste

    const t = event.extendedProps.telefone || '';
    const clean = t.replace(/\D/g, '');
    const linkArea = document.getElementById('whatsappLinkArea');
    if(clean.length >= 11){
      linkArea.innerHTML = `<a href="https://wa.me/55${clean}" target="_blank" class="whatsapp-link">Enviar WhatsApp</a>`;
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

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if(saveBtn.classList.contains('hidden')) return;
    const fd = new FormData(form);
    fetch('/criar', { method:'POST', body: fd })
      .then(r => r.json())
      .then(resp => { if(resp.success){ closeModal(); fetchEvents(); } else { alert('Erro: ' + (resp.error||'unknown')); } })
      .catch(err=>alert('Erro: '+err));
  });

  updateBtn.addEventListener('click', function(){
    const fd = new FormData(form);
    fetch('/atualizar', { method:'POST', body: fd })
      .then(r => r.json())
      .then(resp => { if(resp.success){ closeModal(); fetchEvents(); } else { alert('Erro: ' + (resp.error||'unknown')); } })
      .catch(err=>alert('Erro: '+err));
  });

  removeBtn.addEventListener('click', function(){
    if(!confirm('Remover esta reserva?')) return;
    const fd = new FormData();
    fd.append('id', form.elements['id'].value);
    fetch('/remover', { method:'POST', body: fd })
      .then(r => r.json())
      .then(resp => { if(resp.success){ closeModal(); fetchEvents(); } else { alert('Erro: ' + (resp.error||'unknown')); } })
      .catch(err=>alert('Erro: '+err));
  });

  telefoneInput.addEventListener('input', () => {
    let v = telefoneInput.value.replace(/\D/g, '');
    if(v.length > 11) v = v.slice(0,11);
    if(v.length > 6){
      telefoneInput.value = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    } else if(v.length > 2){
      telefoneInput.value = `(${v.slice(0,2)}) ${v.slice(2)}`;
    } else {
      telefoneInput.value = v;
    }
  });
});
