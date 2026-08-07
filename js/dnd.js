// DnD helpers (clonar dados ao arrastar)
let currentData = null;

function makeDraggable(el, data){
  el.draggable = true;
  el.addEventListener('dragstart', (e)=>{
    currentData = data;
    e.dataTransfer.setData('text/plain', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'copyMove';
  });
  // Evita que um payload de um arrasto anterior "vaze" para o próximo caso
  // o navegador não dispare corretamente o dragstart do próximo elemento.
  el.addEventListener('dragend', ()=>{
    currentData = null;
  });
}

function setupDropzone(zone, onDrop){
  zone.addEventListener('dragover', (e)=>{
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', ()=> zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e)=>{
    e.preventDefault();
    zone.classList.remove('drag-over');
    let payload = null;
    try{ payload = JSON.parse(e.dataTransfer.getData('text/plain')) }catch{}
    // Só usa o currentData (do dragstart) como fallback quando o navegador
    // não conseguiu entregar o payload via dataTransfer nesse MESMO arrasto.
    if(!payload) payload = currentData;
    currentData = null; // consumido: nunca reutilizar em um drop futuro
    onDrop(payload, e);
  });
}

// Export functions to global scope
window.makeDraggable = makeDraggable;
window.setupDropzone = setupDropzone;
window.DND = { makeDraggable, setupDropzone };
console.log('DND functions defined:', typeof makeDraggable, typeof setupDropzone);
