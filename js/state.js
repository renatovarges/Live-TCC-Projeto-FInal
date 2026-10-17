// Estado da prancheta, salvo automaticamente no navegador (localStorage).
(function(){
  const KEY = 'tcc_state_v2';
  const POS = ['GOL','LAT','ZAG','MEI','ATA','TEC'];
  const BOXES = ['ofe-est','ofe-estr','ofe-esp','def-est','def-estr','def-esp'];
  const MAX_FIELDS = 3;

  const uid = () => Math.random().toString(36).slice(2, 9);

  function fresh(){
    return {
      list: Object.fromEntries(POS.map(p => [p, []])),   // jogadores por posição (lateral direita)
      fields: [{ id: uid(), name: 'Campo 1', items: [] }],
      active: 0,
      compare: false,
      boxes: Object.fromEntries(BOXES.map(b => [b, []])), // linhas ofensiva/defensiva
      muro: { negativo: [], centro: [], positivo: [] },
      reserves: [null, null, null, null, null, null]
    };
  }

  function load(){
    const base = fresh();
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && Array.isArray(s.fields) && s.fields.length){
        return Object.assign(base, s, {
          list: Object.assign(base.list, s.list),
          boxes: Object.assign(base.boxes, s.boxes),
          muro: Object.assign(base.muro, s.muro),
          reserves: base.reserves.map((_, i) => (s.reserves || [])[i] || null),
          active: Math.min(s.active || 0, s.fields.length - 1)
        });
      }
    } catch (e) { /* estado corrompido ou storage bloqueado: começa limpo */ }
    return base;
  }

  const S = load();
  let timer;
  function save(){
    clearTimeout(timer);
    timer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }, 150);
  }
  function reset(){ Object.assign(S, fresh()); save(); }

  window.State = { S, save, reset, uid, POS, BOXES, MAX_FIELDS };
})();
