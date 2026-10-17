// Prancheta TCC: interface e interações.
(function(){
  'use strict';
  const { S, save, uid, POS, MAX_FIELDS } = State;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  function el(tag, cls, text){
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const clubName = slug => Data.clubName(slug);

  // O que está sendo arrastado (HTML5 drag): {type:'club', slug} | {type:'player', P}
  let drag = null;

  /* ---------- Avatares ---------- */
  // Foto do jogador com escudo do time; se a foto falhar cai para uniforme e depois escudo.
  function avatar(P, size){
    const a = el('div', 'av ' + (size || ''));
    const ph = el('div', 'ph');
    const img = new Image();
    img.alt = P.n; img.draggable = false;
    img.referrerPolicy = 'no-referrer'; // o CDN das fotos devolve 403 quando recebe Referer de outro site
    const photos = Data.photoUrls(P);
    const chain = [...photos, kitPath(P.s), shieldPath(P.s)];
    let i = 0;
    const apply = () => { img.src = chain[i]; ph.classList.toggle('photo', i < photos.length); };
    img.onerror = () => { if (++i < chain.length) apply(); else img.onerror = null; };
    apply();
    ph.appendChild(img);
    a.appendChild(ph);
    const sh = new Image();
    sh.src = shieldPath(P.s); sh.className = 'sh'; sh.alt = ''; sh.draggable = false;
    a.appendChild(sh);
    return a;
  }
  function shieldAvatar(slug, size){
    const a = el('div', 'av club ' + (size || ''));
    const ph = el('div', 'ph');
    const img = new Image();
    img.src = shieldPath(slug); img.alt = clubName(slug); img.draggable = false;
    ph.appendChild(img); a.appendChild(ph);
    return a;
  }
  function xBtn(title, fn){
    const b = el('button', 'x', '×');
    b.type = 'button'; b.title = title;
    b.addEventListener('click', e => { e.stopPropagation(); fn(); });
    b.addEventListener('pointerdown', e => e.stopPropagation());
    return b;
  }

  /* ---------- Operações no estado ---------- */
  function commit(){ save(); renderFields(); renderStructure(); renderRosterGrids(); }

  function addToRoster(P){
    const list = S.list[P.p] || (S.list[P.p] = []);
    if (!list.some(x => x.k === P.k)) list.push(Data.snap(P));
  }
  function removeFromRoster(P){
    S.list[P.p] = (S.list[P.p] || []).filter(x => x.k !== P.k);
  }
  function inRoster(P){ return (S.list[P.p] || []).some(x => x.k === P.k); }

  function addToField(fi, P, x, y){
    const f = S.fields[fi];
    const existing = f.items.find(i => i.k === 'p' && i.P.k === P.k);
    if (existing){ existing.x = x; existing.y = y; }
    else f.items.push({ id: uid(), k: 'p', P: Data.snap(P), x, y });
    S.active = fi;
  }

  function posIn(container, ev){
    const r = container.getBoundingClientRect();
    return {
      x: clamp((ev.clientX - r.left) / r.width * 100, 3, 97),
      y: clamp((ev.clientY - r.top) / r.height * 100, 3, 97)
    };
  }

  /* ---------- Soltar em qualquer área (HTML5 drag e arraste de itens) ---------- */
  const ZONES = '.field, #roster, .box, .muro-zone, .reserve-slot';

  function handleDrop(zone, payload, ev){
    if (!payload) return;
    const isClub = payload.type === 'club';
    if (zone.matches('.field')){
      if (isClub) return openPicker(payload.slug);
      const { x, y } = posIn(zone, ev);
      addToField(+zone.dataset.fi, payload.P, x, y);
    } else if (zone.matches('#roster')){
      if (isClub) return openPicker(payload.slug);
      addToRoster(payload.P);
    } else if (zone.matches('.box')){
      S.boxes[zone.dataset.box].push(isClub
        ? { id: uid(), k: 'club', s: payload.slug }
        : { id: uid(), k: 'p', P: Data.snap(payload.P) });
    } else if (zone.matches('.muro-zone')){
      const { x, y } = posIn(zone, ev);
      S.muro[zone.dataset.muro].push(isClub
        ? { id: uid(), k: 'club', s: payload.slug, x, y }
        : { id: uid(), k: 'p', P: Data.snap(payload.P), x, y });
    } else if (zone.matches('.reserve-slot')){
      if (isClub) return;
      S.reserves[+zone.dataset.slot] = Data.snap(payload.P);
    }
    commit();
  }

  function makeDraggable(node, payload){
    node.draggable = true;
    node.addEventListener('dragstart', e => {
      drag = payload;
      e.dataTransfer.setData('text/plain', payload.type);
      e.dataTransfer.effectAllowed = 'copyMove';
    });
    node.addEventListener('dragend', () => { drag = null; $$('.hot').forEach(h => h.classList.remove('hot')); });
  }

  document.addEventListener('dragover', e => {
    if (!drag) return;
    const z = e.target.closest && e.target.closest(ZONES);
    $$('.hot').forEach(h => { if (h !== z) h.classList.remove('hot'); });
    if (z){ e.preventDefault(); z.classList.add('hot'); }
  });
  document.addEventListener('drop', e => {
    const z = e.target.closest && e.target.closest(ZONES);
    $$('.hot').forEach(h => h.classList.remove('hot'));
    if (!z || !drag) return;
    e.preventDefault();
    const p = drag; drag = null;
    handleDrop(z, p, e);
  });

  // Itens já colocados (no campo ou no muro) se movem com o ponteiro; funciona com mouse e toque.
  function movable(node, onPlace){
    node.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('.x')) return;
      const sx = e.clientX, sy = e.clientY;
      const field = node.closest('.field');
      const unit = field ? field.style.getPropertyValue('--u') : '';
      let ghost = null;
      node.setPointerCapture(e.pointerId);

      const move = ev => {
        if (!ghost){
          if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
          ghost = node.cloneNode(true);
          ghost.classList.add('ghost');
          if (unit) ghost.style.setProperty('--u', unit);
          document.body.appendChild(ghost);
          node.style.opacity = '.3';
        }
        ghost.style.left = ev.clientX + 'px';
        ghost.style.top = ev.clientY + 'px';
        const z = document.elementFromPoint(ev.clientX, ev.clientY);
        const zone = z && z.closest(ZONES);
        $$('.hot').forEach(h => { if (h !== zone) h.classList.remove('hot'); });
        if (zone) zone.classList.add('hot');
      };
      const up = ev => {
        node.removeEventListener('pointermove', move);
        node.removeEventListener('pointerup', up);
        node.removeEventListener('pointercancel', up);
        $$('.hot').forEach(h => h.classList.remove('hot'));
        if (!ghost) return;
        const t = document.elementFromPoint(ev.clientX, ev.clientY);
        ghost.remove(); node.style.opacity = '';
        if (t) onPlace(t, ev);
      };
      node.addEventListener('pointermove', move);
      node.addEventListener('pointerup', up);
      node.addEventListener('pointercancel', up);
    });
  }

  /* ---------- Cabeçalho: escudos e atualização ---------- */
  function renderTeamsBar(){
    const bar = $('#teamsBar');
    CLUBS.forEach(c => {
      const b = el('button', 'team-pill');
      b.type = 'button'; b.title = c.name; b.setAttribute('aria-label', c.name);
      const img = new Image();
      img.src = shieldPath(c.slug); img.alt = c.name; img.draggable = false;
      b.appendChild(img);
      makeDraggable(b, { type: 'club', slug: c.slug });
      b.addEventListener('click', () => openPicker(c.slug));
      bar.appendChild(b);
    });
  }

  function renderUpdateInfo(){
    const box = $('#last-update');
    const i = Data.info;
    if (i.loading){ box.textContent = '🔄 Carregando dados...'; return; }
    if (!i.updatedAt){ box.textContent = 'Sem dados'; return; }
    const hora = i.updatedAt.toLocaleTimeString('pt-BR');
    const mercado = i.market ? (i.market === 'aberto' ? '🟢 Mercado Aberto' : '🔴 Mercado Fechado') : '';
    box.replaceChildren();
    if (mercado){ box.append(mercado, document.createElement('br')); }
    const small = el('small', '', 'Atualizado às ' + hora + ' (' + i.source + ')');
    box.appendChild(small);
  }

  /* ---------- Campos ---------- */
  const unitObserver = new ResizeObserver(entries => entries.forEach(en => {
    en.target.style.setProperty('--u', (en.contentRect.width / 100) + 'px');
  }));

  const FIELD_LINES =
    '<div class="lines" aria-hidden="true"><div class="f-border"></div><div class="f-mid"></div><div class="f-circle"></div>' +
    '<div class="f-pen top"></div><div class="f-goal top"></div><div class="f-spot top"></div>' +
    '<div class="f-pen bot"></div><div class="f-goal bot"></div><div class="f-spot bot"></div></div>';

  function buildItem(it, fi){
    const f = S.fields[fi];
    const n = el('div', it.k === 's' ? 'star-item' : 'badge');
    n.style.left = it.x + '%'; n.style.top = it.y + '%';
    if (it.k === 's') n.textContent = '⭐';
    else {
      n.appendChild(avatar(it.P, 'lg'));
      n.appendChild(el('div', 'name', it.P.n));
      if (it.star) n.appendChild(el('div', 'ustar', '⭐'));
      n.title = 'Duplo clique: estrela de unanimidade';
      n.addEventListener('dblclick', () => { it.star = !it.star; commit(); });
    }
    n.appendChild(xBtn('Remover do campo', () => { f.items = f.items.filter(i => i !== it); commit(); }));

    movable(n, (t, ev) => {
      const tf = t.closest('.field');
      if (tf){
        const tfi = +tf.dataset.fi;
        const { x, y } = posIn(tf, ev);
        if (tfi !== fi){ f.items = f.items.filter(i => i !== it); S.fields[tfi].items.push(it); }
        it.x = x; it.y = y; S.active = tfi;
      } else if (t.closest('#roster')){
        f.items = f.items.filter(i => i !== it);            // devolver para a lista = tirar do campo
      } else if (it.k === 'p'){
        const z = t.closest(ZONES);
        if (z) return handleDrop(z, { type: 'player', P: it.P }, ev); // copia para linhas/muro/reservas
      }
      commit();
    });
    return n;
  }

  function buildField(f, fi){
    const wrap = el('div', 'field-wrap' + (fi === S.active ? ' active' : ''));
    if (S.compare){
      const t = el('button', 'field-title', f.name);
      t.type = 'button';
      t.addEventListener('click', () => { S.active = fi; save(); renderFields(); });
      wrap.appendChild(t);
    }
    const field = el('div', 'field');
    field.dataset.fi = fi;
    field.innerHTML = FIELD_LINES;
    const logo = new Image();
    logo.src = 'assets/TCCBRANCOTRANSPARENTE.png'; logo.className = 'tcc-logo'; logo.alt = ''; logo.draggable = false;
    field.appendChild(logo);
    f.items.forEach(it => field.appendChild(buildItem(it, fi)));
    wrap.appendChild(field);
    unitObserver.observe(field);
    return wrap;
  }

  function renderFields(){
    const area = $('#fieldsArea');
    unitObserver.disconnect();
    area.replaceChildren();
    const idx = S.compare ? S.fields.map((_, i) => i) : [S.active];
    area.className = 'fields-area ' + (S.compare ? 'compare n' + S.fields.length : 'single');
    idx.forEach(i => area.appendChild(buildField(S.fields[i], i)));
    $('#layout').classList.toggle('compare', S.compare);
    renderTabs();
  }

  function renderTabs(){
    const box = $('#fieldTabs');
    box.replaceChildren();
    S.fields.forEach((f, i) => {
      const t = el('button', 'tab' + (i === S.active ? ' on' : ''), f.name);
      t.type = 'button';
      t.title = 'Duplo clique para renomear';
      t.addEventListener('click', () => { S.active = i; save(); renderFields(); });
      t.addEventListener('dblclick', () => {
        const nome = prompt('Nome do campo:', f.name);
        if (nome && nome.trim()){ f.name = nome.trim().slice(0, 24); save(); renderTabs(); renderFields(); }
      });
      if (S.fields.length > 1){
        const x = el('span', 'tab-x', '×');
        x.title = 'Excluir este campo';
        x.addEventListener('click', e => {
          e.stopPropagation();
          if (f.items.length && !confirm('Excluir "' + f.name + '" com ' + f.items.length + ' item(ns)?')) return;
          S.fields.splice(i, 1);
          S.active = Math.min(S.active, S.fields.length - 1);
          if (S.fields.length < 2) S.compare = false;
          save(); renderFields();
        });
        t.appendChild(x);
      }
      box.appendChild(t);
    });
    if (S.fields.length < MAX_FIELDS){
      const add = el('button', 'tab add', '+ Novo campo');
      add.type = 'button';
      add.addEventListener('click', () => {
        S.fields.push({ id: uid(), name: 'Campo ' + (S.fields.length + 1), items: [] });
        S.active = S.fields.length - 1;
        save(); renderFields();
      });
      box.appendChild(add);

      const dup = el('button', 'tab add', '⧉ Duplicar campo');
      dup.type = 'button';
      dup.title = 'Cria um novo campo com os mesmos jogadores do campo selecionado';
      dup.addEventListener('click', () => {
        const src = S.fields[S.active];
        S.fields.push({
          id: uid(),
          name: 'Campo ' + (S.fields.length + 1),
          items: JSON.parse(JSON.stringify(src.items)).map(it => Object.assign(it, { id: uid() }))
        });
        S.active = S.fields.length - 1;
        save(); renderFields();
      });
      box.appendChild(dup);
    }
    if (S.fields.length > 1){
      const cmp = el('button', 'tab cmp' + (S.compare ? ' on' : ''), S.compare ? '▣ Voltar para 1 campo' : '▥ Comparar lado a lado');
      cmp.type = 'button';
      cmp.addEventListener('click', () => { S.compare = !S.compare; save(); renderFields(); });
      box.appendChild(cmp);
    }
  }

  /* ---------- Estrutura (linhas, muro, reservas) ---------- */
  const BOX_DEFS = [
    { group: 'ofe', id: 'ofe-est',  cls: 'green',  label: 'Estatístico' },
    { group: 'ofe', id: 'ofe-estr', cls: 'yellow', label: 'Estratégico' },
    { group: 'ofe', id: 'ofe-esp',  cls: 'red',    label: 'Especulativo' },
    { group: 'def', id: 'def-est',  cls: 'green',  label: 'Estatístico' },
    { group: 'def', id: 'def-estr', cls: 'yellow', label: 'Estratégico' },
    { group: 'def', id: 'def-esp',  cls: 'red',    label: 'Especulativo' }
  ];
  const MURO_DEFS = [
    { id: 'negativo', sym: '−', tip: 'Uso Negativo (máximo 1 jogador)' },
    { id: 'centro',   sym: '',  tip: 'Uso Equilibrado (2 jogadores)' },
    { id: 'positivo', sym: '+', tip: 'Uso Positivo (3-4 jogadores)' }
  ];

  function chipFor(item){
    return item.k === 'club' ? shieldAvatar(item.s, 'md') : avatar(item.P, 'md');
  }

  function renderStructure(){
    ['ofe', 'def'].forEach(g => $('#boxes-' + g).replaceChildren());
    BOX_DEFS.forEach(d => {
      const box = el('div', 'box analysis-rectangle ' + d.cls);
      box.dataset.box = d.id; box.title = d.label;
      S.boxes[d.id].forEach(item => {
        const chip = el('div', 'chip');
        chip.appendChild(chipFor(item));
        chip.title = item.k === 'club' ? clubName(item.s) : item.P.n;
        chip.appendChild(xBtn('Remover', () => { S.boxes[d.id] = S.boxes[d.id].filter(i => i !== item); commit(); }));
        makeDraggable(chip, item.k === 'club' ? { type: 'club', slug: item.s } : { type: 'player', P: item.P });
        box.appendChild(chip);
      });
      $('#boxes-' + d.group).appendChild(box);
    });

    const muro = $('#muro');
    muro.replaceChildren();
    MURO_DEFS.forEach(d => {
      const zone = el('div', 'muro-zone ' + d.id);
      zone.dataset.muro = d.id; zone.title = d.tip;
      if (d.sym) zone.appendChild(el('div', 'muro-symbol', d.sym));
      S.muro[d.id].forEach(item => {
        const n = el('div', 'muro-item');
        n.style.left = item.x + '%'; n.style.top = item.y + '%';
        n.appendChild(chipFor(item));
        n.title = item.k === 'club' ? clubName(item.s) : item.P.n;
        n.appendChild(xBtn('Remover', () => { S.muro[d.id] = S.muro[d.id].filter(i => i !== item); commit(); }));
        movable(n, (t, ev) => {
          const tz = t.closest('.muro-zone');
          if (tz){
            const { x, y } = posIn(tz, ev);
            S.muro[d.id] = S.muro[d.id].filter(i => i !== item);
            item.x = x; item.y = y;
            S.muro[tz.dataset.muro].push(item);
          }
          commit();
        });
        zone.appendChild(n);
      });
      muro.appendChild(zone);
    });

    const res = $('#reserves');
    res.replaceChildren();
    S.reserves.forEach((P, i) => {
      const slot = el('div', 'reserve-slot' + (P ? ' filled' : ''));
      slot.dataset.slot = i;
      if (P){
        slot.appendChild(avatar(P, 'md'));
        slot.appendChild(el('div', 'nm', P.n));
        slot.appendChild(xBtn('Remover', () => { S.reserves[i] = null; commit(); }));
        makeDraggable(slot, { type: 'player', P });
      } else {
        slot.textContent = '+'; slot.title = 'Solte um jogador aqui';
      }
      res.appendChild(slot);
    });
  }

  /* ---------- Lista de jogadores por posição (direita) ---------- */
  const rosterUI = {};

  function buildRoster(){
    const root = $('#roster');
    const head = el('div', 'roster-head');
    head.appendChild(el('h2', 'box-title', 'JOGADORES'));
    const clear = el('button', 'btn-mini', 'Limpar lista');
    clear.type = 'button';
    clear.addEventListener('click', () => {
      if (!POS.some(p => S.list[p].length) || !confirm('Esvaziar a lista de jogadores?')) return;
      POS.forEach(p => S.list[p] = []);
      commit();
    });
    head.appendChild(clear);
    root.appendChild(head);
    root.appendChild(el('p', 'roster-hint', 'Arraste um escudo para cá (ou clique nele) para escolher jogadores. Depois arraste o jogador para o campo.'));

    Data.POS_ORDER.forEach(pos => {
      const sec = el('section', 'pos-sec');
      const h = el('div', 'pos-head');
      const title = el('span', 'pos-title', Data.POS_LABEL[pos]);
      const count = el('span', 'pos-count', '0');
      const add = el('button', 'btn-mini', '🔍 Buscar');
      add.type = 'button';
      h.append(title, count, add);
      const searchBox = el('div', 'pos-search');
      searchBox.hidden = true;
      const input = el('input', 'search');
      input.placeholder = 'Nome do jogador ou clube...';
      input.setAttribute('aria-label', 'Buscar ' + Data.POS_LABEL[pos]);
      const results = el('div', 'pos-results');
      const grid = el('div', 'pos-grid');

      const opt = el('label', 'picker-opt');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      opt.append(cb, ' Incluir dúvida, nulos e outros');
      cb.addEventListener('change', () => runSearch());

      // Sem texto: lista os prováveis da posição; com texto: busca por nome/clube
      const runSearch = () => {
        results.replaceChildren();
        const found = Data.search(input.value, pos, 300).filter(P => cb.checked || Data.isProvavel(P));
        if (!found.length){ results.appendChild(el('p', 'picker-empty', 'Nenhum jogador encontrado.')); return; }
        found.forEach(P => {
          const row = el('button', 'res-row' + (inRoster(P) ? ' added' : ''));
          row.type = 'button';
          row.appendChild(avatar(P, 'xs'));
          row.appendChild(el('span', 'res-name', P.n));
          if (!Data.isProvavel(P)) row.appendChild(el('span', 'st st' + P.st, Data.STATUS[P.st] || 'Outro'));
          row.appendChild(el('span', 'res-club', P.c + (P.pr ? ' · C$ ' + P.pr.toFixed(2) : '')));
          row.addEventListener('click', () => { addToRoster(P); commit(); });
          results.appendChild(row);
        });
      };
      searchBox.append(input, opt, results);
      input.addEventListener('input', runSearch);
      add.addEventListener('click', () => {
        searchBox.hidden = !searchBox.hidden;
        if (!searchBox.hidden){ input.focus(); runSearch(); }
      });

      sec.append(h, searchBox, grid);
      root.appendChild(sec);
      rosterUI[pos] = { grid, count, runSearch, searchBox };
    });
  }

  function renderRosterGrids(){
    POS.forEach(pos => {
      const ui = rosterUI[pos];
      if (!ui) return;
      ui.grid.replaceChildren();
      ui.count.textContent = S.list[pos].length;
      S.list[pos].forEach(P => {
        const card = el('div', 'pcard');
        card.title = P.n + ' (' + P.c + ') — arraste para o campo';
        card.appendChild(avatar(P, 'md'));
        card.appendChild(el('div', 'nm', P.n));
        card.appendChild(xBtn('Tirar da lista', () => { removeFromRoster(P); commit(); }));
        makeDraggable(card, { type: 'player', P });
        ui.grid.appendChild(card);
      });
      if (!ui.searchBox.hidden) ui.runSearch(); // atualiza os marcados na busca aberta
    });
  }

  /* ---------- Escolha de jogadores de um clube ---------- */
  let pickerSlug = null;
  let pickerShowAll = false; // por padrão só os prováveis; a caixinha libera dúvida, nulo etc.

  function openPicker(slug){
    pickerSlug = slug;
    renderPicker();
  }
  function closePicker(){ pickerSlug = null; $('#picker').hidden = true; }

  function renderPicker(){
    const box = $('#picker');
    if (!pickerSlug){ box.hidden = true; return; }
    box.hidden = false;
    box.replaceChildren();
    const head = el('div', 'picker-head');
    head.appendChild(shieldAvatar(pickerSlug, 'sm'));
    head.appendChild(el('h3', '', clubName(pickerSlug)));
    const players = Data.byClub(pickerSlug);
    const hidden = players.filter(p => !Data.isProvavel(p)).length;
    head.appendChild(el('span', 'picker-tip', 'Clique nos jogadores para mandá-los para a lista'));
    if (hidden || pickerShowAll){
      const lab = el('label', 'picker-opt');
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = pickerShowAll;
      cb.addEventListener('change', () => { pickerShowAll = cb.checked; renderPicker(); });
      lab.append(cb, ' Mostrar dúvida, nulos e outros' + (pickerShowAll ? '' : ' (+' + hidden + ')'));
      head.appendChild(lab);
    }
    const done = el('button', 'btn', 'Concluir');
    done.type = 'button'; done.addEventListener('click', closePicker);
    head.appendChild(done);
    box.appendChild(head);

    const shown = players.filter(p => pickerShowAll || Data.isProvavel(p));
    if (!shown.length){
      box.appendChild(el('p', 'picker-empty', Data.info.updatedAt ? (players.length ? 'Nenhum jogador provável. Marque "Mostrar dúvida, nulos e outros".' : 'Nenhum jogador encontrado para este clube.') : 'Carregando jogadores...'));
      return;
    }
    const body = el('div', 'picker-body');
    Data.POS_ORDER.forEach(pos => {
      const group = shown.filter(p => p.p === pos);
      if (!group.length) return;
      const sec = el('div', 'picker-sec');
      sec.appendChild(el('h4', '', Data.POS_LABEL[pos]));
      const grid = el('div', 'picker-grid');
      group.forEach(P => {
        const b = el('button', 'picker-p' + (inRoster(P) ? ' added' : ''));
        b.type = 'button';
        b.appendChild(avatar(P, 'sm'));
        b.appendChild(el('span', 'nm', P.n));
        if (!Data.isProvavel(P)) b.appendChild(el('span', 'st st' + P.st, Data.STATUS[P.st] || 'Outro'));
        if (P.pr) b.appendChild(el('span', 'pr', 'C$ ' + P.pr.toFixed(2)));
        b.addEventListener('click', () => {
          if (inRoster(P)) removeFromRoster(P); else addToRoster(P);
          b.classList.toggle('added', inRoster(P));
          save(); renderRosterGrids();
        });
        grid.appendChild(b);
      });
      sec.appendChild(grid);
      body.appendChild(sec);
    });
    box.appendChild(body);
  }

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePicker(); });
  document.addEventListener('mousedown', e => {
    if (pickerSlug && !e.target.closest('#picker, .team-pill, #roster')) closePicker();
  });

  /* ---------- Botões gerais ---------- */
  function wireButtons(){
    $('#spawnStar').addEventListener('click', () => {
      const f = S.fields[S.active];
      f.items.push({ id: uid(), k: 's', x: 50 + (f.items.length % 5) * 3, y: 50 });
      commit();
    });
    $('#clearField').addEventListener('click', () => {
      const f = S.fields[S.active];
      if (!f.items.length) return;
      f.items = [];
      commit();
    });
    $('#clearAll').addEventListener('click', () => {
      if (!confirm('Apagar toda a prancheta (campos, linhas, muro, reservas e lista de jogadores)?')) return;
      State.reset();
      commit(); renderTabs();
    });
    $('#force-update-btn').addEventListener('click', () => Data.load());
    window.addEventListener('data-loading', renderUpdateInfo);
    window.addEventListener('data-ready', () => {
      renderUpdateInfo();
      if (pickerSlug) renderPicker();
    });
  }

  /* ---------- Início ---------- */
  function init(){
    renderTeamsBar();
    buildRoster();
    wireButtons();
    renderFields();
    renderStructure();
    renderRosterGrids();
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    Data.load();
    setInterval(() => Data.load(), 5 * 60 * 1000); // preços e mercado
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
