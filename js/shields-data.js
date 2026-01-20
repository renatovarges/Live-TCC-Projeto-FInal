// Listagem dos 20 clubes + util de normalização para encontrar os PNGs
window.SLUG_MAP = {
  "atletico-mg":"atlético mg",
  "athletico-pr":"athletico pr",
  "bahia":"bahia",
  "botafogo":"botafogo",
  "chapecoense":"chapecoense",
  "corinthians":"corinthians",
  "coritiba":"coritiba",
  "cruzeiro":"cruzeiro",
  "flamengo":"flamengo",
  "fluminense":"fluminense",
  "gremio":"gremio",
  "internacional":"internacional",
  "mirassol":"mirassol",
  "palmeiras":"palmeiras",
  "red-bull-bragantino":"red bull bragantino",
  "remo":"remo",
  "santos":"santos",
  "sao-paulo":"são paulo",
  "vasco":"vasco",
  "vitoria":"vitória"
};

// Normaliza nome de clube vindo do CSV para o slug de arquivo em assets/shields/
function normalizeClub(name){
  if(!name) return "";
  const n = name.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
             .toLowerCase().replace(/[^a-z0-9\s-]/g,'')
             .replace(/\s+/g,'-');
  // Casos especiais
  if(n.includes("bragantino")) return "red-bull-bragantino";
  if(n === "sao-paulo" || n.includes("sao-paulo")) return "sao-paulo";
  if(n.includes("atletico-mg") || n.includes("atletico--mg")) return "atletico-mg";
  if(n.includes("athletico") || n.includes("athletico-pr")) return "athletico-pr";
  if(n.includes("gremio")) return "gremio";
  if(n.includes("vitoria")) return "vitoria";
  if(n.includes("internacional")) return "internacional";
  if(n.includes("mirassol")) return "mirassol";
  if(n.includes("fluminense")) return "fluminense";
  if(n.includes("palmeiras")) return "palmeiras";
  if(n.includes("vasco")) return "vasco";
  if(n.includes("santos")) return "santos";
  if(n.includes("corinthians")) return "corinthians";
  if(n.includes("cruzeiro")) return "cruzeiro";
  if(n.includes("bahia")) return "bahia";
  if(n.includes("botafogo")) return "botafogo";
  if(n.includes("flamengo")) return "flamengo";
  if(n.includes("chapecoense")) return "chapecoense";
  if(n.includes("coritiba")) return "coritiba";
  if(n.includes("remo")) return "remo";
  return n;
}

function shieldPath(slug){
  // tenta dois padrões: exatamente slug.png e versão com espaços/acentos (map)
  return `assets/shields/${slug}.png`;
}

function kitPath(slug){
  // Mapear slug para nome do arquivo de uniforme
  const uniformName = SLUG_MAP[slug] || slug;
  return `assets/uniformes/${uniformName} uniforme.png`;
}

window.normalizeClub = normalizeClub;
window.shieldPath = shieldPath;
window.kitPath = kitPath;

// lista base para o cabeçalho (ordem alfabética)
window.CLUBS = [
  "Athletico-PR","Atlético-MG","Bahia","Botafogo","Chapecoense","Corinthians","Coritiba","Cruzeiro","Flamengo","Fluminense",
  "Grêmio","Internacional","Mirassol","Palmeiras","Red Bull Bragantino","Remo","Santos","São Paulo","Vasco","Vitória"
].map(n => ({ name:n, slug: normalizeClub(n) }));
