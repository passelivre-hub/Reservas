document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');
  const modal = document.getElementById('modal');
  const form = document.getElementById('reservaForm');
  const cancelBtn = document.getElementById('cancelBtn');
  const saveBtn = document.getElementById('saveBtn');
  const updateBtn = document.getElementById('updateBtn');
  const removeBtn = document.getElementById('removeBtn');
  const addBtn = document.getElementById('addReservaBtn');
  const telefoneInput = document.getElementById('telefone');
  const whatsappBtn = document.getElementById('whatsappBtn');

  let currentEvent = null;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    selectable: true,
    headerToolbar: { left:'prev,next today', center:'title', right:'dayGridMonth,timeGridWeek,listWeek' },
    dateClick: info => openCreateModal(info.dateStr, info.dateStr),
    select: info => openCreateModal(info.startStr, info.endStr),
    eventClick: info => { currentEvent = info.event; openEditModal(info.event); },
    eventDidMount: info => {
      const c = info.event.extendedProps.chale;
      let bg = '#FFD700', color = '#000';
      if(c==2){ bg='#0057B7'; color='#fff'; }
      if(c==3){ bg='#FFA500'; color='#fff'; }
      Object.assign(info.el.style, { backgroundColor:bg, color:color, borderRadius:'8px', padding:'4px 6px', fontWeight:'bold', cursor:'pointer' });
    }
  });
  calendar.render();

  addBtn.addEventListener('click', () => openCreateModal(new Date().toISOString(), new Date().toISOString()));

  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if(e.target===modal) closeModal(); });

  telefoneInput.addEventListener('input', () => {
    const num = telefoneInput.value.replace(/\D/g,'');
    whatsappBtn.disabled = num.length<11;
  });

  whatsappBtn.addEventListener('click', () => {
    const num = telefoneInput.value.replace(/\D/g,'');
    if(num.length>=11) window.open(`https://wa.me/55${num}`, '_blank');
  });

  function fetchEvents(){
    fetch('/reservas').then(r=>r.json()).then(data=>{
      calendar.removeAllEvents();
      data.forEach(ev=>calendar.addEvent(ev));
    });
  }
  fetchEvents();

  function openCreateModal(start,end){
    currentEvent=null;
    modal.classList.remove('hidden');
    form.reset();
    saveBtn.classList.remove('hidden'); updateBtn.classList.add('hidden'); removeBtn.classList.add('hidden');
    form.elements['entrada'].value=start.slice(0,10);
    form.elements['saida'].value=end.slice(0,10);
  }

  function openEditModal(ev){
    modal.classList.remove('hidden');
    form.reset();
    currentEvent=ev;
    form.elements['id'].value=ev.id;
    form.elements['chale'].value=ev.extendedProps.chale;
    form.elements['nome'].value=ev.title.split(' — ').slice(1).join(' — ')||'';
    form.elements['telefone'].value=ev.extendedProps.telefone||'';
    form.elements['valor'].value=ev.extendedProps.valor||'';
    form.elements['observacao'].value=ev.extendedProps.observacao||'';
    form.elements['entrada'].value=ev.startStr.slice(0,10);
    form.elements['saida'].value=ev.endStr?ev.endStr.slice(0,10):ev.startStr.slice(0,10);
    saveBtn.classList.add('hidden'); updateBtn.classList.remove('hidden'); removeBtn.classList.remove('hidden');
  }

  function closeModal(){ modal.classList.add('hidden'); form.reset(); currentEvent=null; }

  form.addEventListener('submit', e=>{
    e.preventDefault();
    if(saveBtn.classList.contains('hidden')) return;
    const fd=new FormData(form);
    fetch('/criar',{method:'POST',body:fd}).then(r=>r.json()).then(resp=>{
      if(resp.success){ closeModal(); fetchEvents(); } else alert(resp.error||'Erro');
    });
  });

  updateBtn.addEventListener('click', ()=>{
    const fd=new FormData(form);
    fetch('/atualizar',{method:'POST',body:fd}).then(r=>r.json()).then(resp=>{
      if(resp.success){ closeModal(); fetchEvents(); } else alert(resp.error||'Erro');
    });
  });

  removeBtn.addEventListener('click', ()=>{
    if(!confirm('Remover esta reserva?')) return;
    const fd=new FormData(); fd.append('id', form.elements['id'].value);
    fetch('/remover',{method:'POST',body:fd}).then(r=>r.json()).then(resp=>{
      if(resp.success){ closeModal(); fetchEvents(); } else alert(resp.error||'Erro');
    });
  });
});
