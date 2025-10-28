document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');
  const modal = document.getElementById('modal');
  const form = document.getElementById('reservaForm');
  const cancelBtn = document.getElementById('cancelBtn');
  const modalTitle = document.getElementById('modalTitle');
  const saveBtn = document.getElementById('saveBtn');
  const updateBtn = document.getElementById('updateBtn');
  const removeBtn = document.getElementById('removeBtn');
  const whatsappBtn = document.getElementById('whatsappBtn');

  let currentEvent = null;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    selectable: true,
    locale: 'pt-br',
    firstDay: 1,
    headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
    eventOverlap: true, // Permite sobreposição de reservas
    select: info => openCreateModal(info.startStr),
    eventClick: info => { currentEvent = info.event; openEditModal(info.event); },
    eventDidMount: info => {
      const c = info.event.extendedProps.chale;
      if (c == 1) info.el.style.backgroundColor = '#1c2842';
      if (c == 2) info.el.style.backgroundColor = '#f8d492';
      if (c == 3) info.el.style.backgroundColor = '#a8bba2';
    }
  });

  calendar.render();

  function fetchEvents(){
    fetch('/reservas')
      .then(r => r.json())
      .then(data => {
        calendar.removeAllEvents();
        data.forEach(ev => calendar.addEvent(ev));
      });
  }

  fetchEvents();

  function openCreateModal(start){
    currentEvent = null;
    modalTitle.textContent = 'Criar reserva';
    saveBtn.classList.remove('hidden');
    updateBtn.classList.add('hidden');
    removeBtn.classList.add('hidden');
    modal.classList.remove('hidden');
    form.reset();

    const entrada = start.slice(0,10);
    const saidaDate = new Date(new Date(entrada).getTime() + 24*60*60*1000);
    const saida = saidaDate.toISOString().slice(0,10);

    form.elements['entrada'].value = entrada;
    form.elements['saida'].value = saida;
    form.elements['pessoas'].value = 2;
  }

  function openEditModal(event){
    modalTitle.textContent = 'Editar reserva';
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
    form.elements['pessoas'].value = event.extendedProps.pessoas || 2;
  }

  function closeModal(){ 
    modal.classList.add('hidden'); 
    form.reset(); 
    currentEvent = null; 
  }

  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', ev => { if (ev.target === modal) closeModal(); });

  // Máscaras
  function maskValor(input) {
    input.addEventListener('input', () => {
      let v = input.value.replace(/\D/g,'');
      v = (v/100).toFixed(2).replace('.',',');
      v = v.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      input.value = v;
    });
  }

  function maskTelefone(input) {
    input.addEventListener('input', () => {
      let v = input.value.replace(/\D/g,'');
      if(v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
      else v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
      input.value = v;
    });
  }

  maskValor(form.elements['valor']);
  maskTelefone(form.elements['telefone']);

  whatsappBtn.addEventListener('click', ()=>{
    const tel = form.elements['telefone'].value.replace(/\D/g,'');
    if(tel) window.open(`https://wa.me/55${tel}`,'_blank');
  });

  function prepareFormData(form) {
    const fd = new FormData(form);
    // Corrige valor para formato float internacional
    if(fd.has('valor')){
      let valorStr = fd.get('valor') || '';
      valorStr = valorStr.replace(/\./g,'').replace(',', '.'); // "1.234,56" -> "1234.56"
      fd.set('valor', valorStr);
    }
    return fd;
  }

  // Criar reserva
  form.addEventListener('submit', function(e){
    e.preventDefault();
    if (saveBtn.classList.contains('hidden')) return;
    const fd = prepareFormData(form);
    fetch('/criar', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(resp => { if(resp.success){ closeModal(); fetchEvents(); } 
                      else alert('Erro: ' + (resp.error||'unknown')); })
      .catch(err=>alert('Erro: '+err));
  });

  // Atualizar reserva
  updateBtn.addEventListener('click', function(){
    const fd = prepareFormData(form);
    fetch('/atualizar', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(resp => { if(resp.success){ closeModal(); fetchEvents(); } 
                      else alert('Erro: ' + (resp.error||'unknown')); })
      .catch(err=>alert('Erro: '+err));
  });

  // Remover reserva
  removeBtn.addEventListener('click', function(){
    if (!confirm('Remover esta reserva?')) return;
    const fd = new FormData();
    fd.append('id', form.elements['id'].value);
    fetch('/remover', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(resp => { if(resp.success){ closeModal(); fetchEvents(); } 
                      else alert('Erro: ' + (resp.error||'unknown')); })
      .catch(err=>alert('Erro: '+err));
  });
});
