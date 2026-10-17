// Camada de dados: carrega jogadores da API do Cartola (via proxy) com CSV como fallback.
(function(){
  const POS_ORDER = ['GOL','LAT','ZAG','MEI','ATA','TEC'];
  const POS_LABEL = { GOL:'Goleiros', LAT:'Laterais', ZAG:'Zagueiros', MEI:'Meias', ATA:'Atacantes', TEC:'Técnicos' };

  // Sigla do clube (API e CSV) -> slug dos arquivos em assets/
  const CODE_TO_SLUG = {
    CAM:'atletico-mg', CAP:'athletico-pr', BAH:'bahia', BOT:'botafogo', CHA:'chapecoense',
    COR:'corinthians', CFC:'coritiba', CRU:'cruzeiro', FLA:'flamengo', FLU:'fluminense',
    GRE:'gremio', INT:'internacional', MIR:'mirassol', PAL:'palmeiras', RBB:'red-bull-bragantino',
    REM:'remo', SAN:'santos', SAO:'sao-paulo', VAS:'vasco', VIT:'vitoria'
  };
  const API_POS = { 1:'GOL', 2:'LAT', 3:'ZAG', 4:'MEI', 5:'ATA', 6:'TEC' };
  const CSV_POS = { 'goleiro':'GOL', 'lateral':'LAT', 'zagueiro':'ZAG', 'meia':'MEI', 'meio-campo':'MEI', 'atacante':'ATA', 'técnico':'TEC', 'tecnico':'TEC' };

  // status_id do Cartola: 7 = Provável (o padrão mostrado); os demais ficam atrás de uma opção
  const STATUS = { 2:'Dúvida', 3:'Suspenso', 5:'Contundido', 6:'Nulo', 7:'Provável' };
  const PROVAVEL = 7;

  let all = [];
  let byKey = new Map();
  const info = { source:'', market:'', round:null, updatedAt:null, loading:false };

  const plain = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const clubName = slug => ((window.CLUBS || []).find(c => c.slug === slug) || {}).name || slug;

  function slugFromClub(code, fallbackName){
    if (code && CODE_TO_SLUG[String(code).toUpperCase()]) return CODE_TO_SLUG[String(code).toUpperCase()];
    return window.normalizeClub(fallbackName || code || '');
  }

  function make(nome, slug, pos, extra){
    return Object.assign({
      k: slug + '|' + plain(nome), // identidade do jogador (estável entre atualizações)
      n: nome, s: slug, c: clubName(slug), p: pos, i: null, pr: 0, m: 0
    }, extra);
  }

  function fromAPI(api){
    const clubs = api.clubes || {};
    const list = Array.isArray(api.atletas) ? api.atletas : Object.values(api.atletas || {});
    const out = [];
    list.forEach(a => {
      const c = clubs[a.clube_id];
      if (!c) return;
      const slug = slugFromClub(c.abreviacao, c.nome_fantasia || c.nome);
      if (!(window.CLUBS || []).some(x => x.slug === slug)) return;
      const nome = a.apelido || a.nome;
      if (!nome) return;
      out.push(make(nome, slug, API_POS[a.posicao_id] || 'MEI', {
        i: a.atleta_id, pr: +a.preco_num || 0, m: +a.media_num || 0, st: a.status_id
      }));
    });
    return out;
  }

  function parseCSV(text){
    const rows = []; let cur = '', row = [], q = false;
    for (let i = 0; i < text.length; i++){
      const ch = text[i];
      if (q){
        if (ch === '"' && text[i+1] === '"'){ cur += '"'; i++; }
        else if (ch === '"') q = false;
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cur.trim()); cur = ''; }
      else if (ch === '\n') { row.push(cur.trim()); rows.push(row); row = []; cur = ''; }
      else if (ch !== '\r') cur += ch;
    }
    if (cur.length || row.length){ row.push(cur.trim()); rows.push(row); }
    const header = (rows.shift() || []).map(h => h.toLowerCase());
    return rows.filter(r => r.length > 1).map(r => Object.fromEntries(header.map((h, i) => [h, r[i] || ''])));
  }

  function fromCSV(text){
    return parseCSV(text).map(r => {
      const nome = r['jogador'] || r['nome'] || '';
      const slug = slugFromClub(r['time'] || r['clube'], r['time'] || r['clube']);
      const pos = CSV_POS[plain(r['posição'] || r['posicao'])] || (r['posição'] || r['posicao'] || '').toUpperCase();
      return nome ? make(nome, slug, pos, {
        i: r['id'] ? +r['id'] : null,
        st: r['status'] ? +r['status'] : undefined,
        pr: parseFloat(r['preço (c$)'] || r['preco']) || 0,
        m: parseFloat(r['média (pts)'] || r['media']) || 0
      }) : null;
    }).filter(Boolean);
  }

  async function getJSON(url, ms){
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    try {
      const r = await fetch(url, { signal: ctl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally { clearTimeout(t); }
  }

  function setAll(list, source){
    // IDs (fotos) do CSV complementam jogadores que o CSV conhece e a lista atual não tem
    const dedup = new Map();
    list.forEach(p => { if (!dedup.has(p.k)) dedup.set(p.k, p); });
    all = [...dedup.values()].sort((a, b) => (b.m - a.m) || a.n.localeCompare(b.n));
    byKey = new Map(all.map(p => [p.k, p]));
    info.source = source;
    info.updatedAt = new Date();
  }

  async function load(){
    if (info.loading) return;
    info.loading = true;
    window.dispatchEvent(new CustomEvent('data-loading'));
    let ok = false;
    try {
      const list = fromAPI(await getJSON('/api/cartola/atletas/mercado', 15000));
      if (list.length > 100){ setAll(list, 'API'); ok = true; }
    } catch (e) { console.warn('API do Cartola indisponível, usando CSV:', e.message); }

    if (!ok){
      try {
        const text = await (await fetch('cartola_jogadores_time_posicao_preco.csv', { cache:'no-store' })).text();
        setAll(fromCSV(text), 'CSV');
        ok = true;
      } catch (e) { console.error('Falha ao carregar o CSV:', e); }
    }

    info.market = '';
    try {
      const st = await getJSON('/api/cartola/mercado/status', 8000);
      info.round = st.rodada_atual;
      info.market = st.status_mercado === 1 ? 'aberto' : 'fechado';
    } catch (e) { /* status é opcional */ }

    info.loading = false;
    window.dispatchEvent(new CustomEvent('data-ready', { detail: { ok } }));
  }

  function byClub(slug){
    const order = Object.fromEntries(POS_ORDER.map((p, i) => [p, i]));
    return all.filter(p => p.s === slug).sort((a, b) => (order[a.p] - order[b.p]) || a.n.localeCompare(b.n));
  }

  function search(q, pos, limit){
    const needle = plain(q);
    return all.filter(p => (!pos || p.p === pos) && (!needle || (plain(p.n) + ' ' + plain(p.c)).includes(needle)))
              .slice(0, limit || 30);
  }

  // Fotos do jogador pelo ID do atleta: cópia local em assets/jogadores (rápida) e depois o CDN.
  // Sem nenhuma das duas, a interface cai no uniforme/escudo.
  function photoUrls(p){
    if (!p || !p.i) return [];
    return ['assets/jogadores/' + p.i + '.webp', window.playerPhotoPath(p.i)];
  }

  // Snapshot guardado no estado salvo (leve, independe de a lista ter carregado)
  function snap(p){ return { k:p.k, n:p.n, s:p.s, c:p.c, p:p.p, i:p.i }; }

  // Sem status conhecido (CSV antigo) não dá para filtrar: trata como provável.
  const isProvavel = p => p.st == null || p.st === PROVAVEL;

  window.Data = { load, STATUS, isProvavel, byClub, search, photoUrls, snap, clubName, info, POS_ORDER, POS_LABEL,
                  get all(){ return all; }, get(k){ return byKey.get(k); } };
})();
