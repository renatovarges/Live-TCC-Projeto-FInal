# Prancheta TCC — Estratégias de Escalação

Prancheta para as lives do TCC (Treinando Campeões de Cartola): o jogador é montado em campos, linhas estratégicas, Teoria do Muro e reservas de luxo, com dados do Cartola FC.

## Como usar

1. **Montar a lista (direita):** arraste um escudo do topo para a lista (ou clique no escudo). Abre a escolha de jogadores do clube; clique nos jogadores para mandá-los para a lista, separados por posição. Também dá para usar **Buscar** em cada posição.
2. **Campo (centro):** arraste os jogadores da lista para o campo. Arraste dentro do campo para reposicionar. Para tirar do campo: botão ×, ou arraste de volta para a lista. Duplo clique no jogador marca/desmarca a estrela de unanimidade.
3. **Vários campos:** `+ Novo campo` (até 3). `Comparar lado a lado` mostra todos juntos; dá para arrastar jogadores de um campo para outro. Duplo clique na aba renomeia.
4. **Estrutura (esquerda):** solte escudos ou jogadores nas linhas Ofensiva/Defensiva (Estatístico, Estratégico, Especulativo), na Teoria do Muro (posição livre) e nas Reservas de Luxo.

Tudo é **salvo automaticamente no navegador**: recarregar a página não perde a prancheta. `Limpar Tudo` zera.

## Rodar localmente

```bash
python dev_server.py     # http://localhost:8002 (serve os arquivos e faz o proxy da API do Cartola)
```

Não use `python -m http.server`: a API do Cartola bloqueia chamadas diretas do navegador (CORS), então o app depende do proxy (`/api/cartola/*`) — no Netlify é a função `netlify/functions/cartola-api.js`; localmente é o `dev_server.py`. Sem proxy o app usa o CSV.

## Dados e fotos

- **API do Cartola** (via proxy) é a fonte principal; `cartola_jogadores_time_posicao_preco.csv` é o fallback (atualizado por `update_prices.py` e pelos workflows em `.github/workflows`; inclui a coluna `ID` do atleta).
- **Fotos:** `https://cdn.provaveisdocartola.com.br/atletas/<ID>.webp`. O CDN bloqueia requisições com `Referer`, por isso as imagens são carregadas com `referrerPolicy="no-referrer"`. Jogadores sem foto no CDN aparecem com o uniforme do time.

## Estrutura

```
index.html            página única
css/style.css         estilos (campo escala por --u = 1% da largura do campo)
js/state.js           estado + salvamento no localStorage
js/data.js            carga de jogadores (API/CSV), busca, fotos
js/app.js             interface: campos, lista, linhas, muro, reservas, arrastar e soltar
js/shields-data.js    clubes, caminhos de escudos/uniformes
js/auth.js            tela de PIN
assets/               escudos e uniformes
netlify/functions/    proxy da API do Cartola
dev_server.py         servidor local com proxy
```

## Novos clubes
Escudo em `assets/shields/<slug>.png`, uniforme em `assets/uniformes/<nome> uniforme.png`, e atualizar `js/shields-data.js` (`SLUG_MAP`, `CLUBS`) e `CODE_TO_SLUG` em `js/data.js`.
