# 🏆 Cartola FC - Montagem Live

Uma aplicação web interativa para montar escalações do Cartola FC com dados em tempo real, interface drag-and-drop e preços atualizados automaticamente.

## ✨ Funcionalidades

- 🎯 **Interface Drag & Drop**: Arraste escudos dos times para o campo e selecione jogadores
- 💰 **Preços Atualizados**: Integração com API oficial do Cartola FC para preços em tempo real
- 📊 **Dados Híbridos**: Combina API oficial + CSV local para cobertura completa de jogadores
- 🟢 **Status do Mercado**: Mostra se o mercado está aberto ou fechado
- 👕 **Uniformes e Escudos**: Visualização com uniformes dos times
- 📱 **Responsivo**: Funciona em desktop e mobile

## 🚀 Como Usar

1. **Visualizar Times**: Os escudos dos times aparecem na lateral
2. **Adicionar Jogadores**: Arraste um escudo para o campo
3. **Selecionar Jogador**: Clique no jogador desejado na lista que aparece
4. **Montar Escalação**: Continue adicionando jogadores até completar sua escalação
5. **Remover Jogadores**: Clique no "×" sobre qualquer jogador no campo

## 🛠️ Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **API**: Cartola FC API oficial
- **Dados**: CSV local como fallback
- **Deploy**: Netlify / Vercel ready

## 📦 Instalação Local

```bash
# Clone o repositório
git clone [URL_DO_REPOSITORIO]

# Entre na pasta
cd PROJETO-MONTAGEM-LIVE

# Inicie um servidor local
python -m http.server 8002
# ou
npx serve .
# ou
live-server

# Acesse http://localhost:8002
```

## 🌐 Deploy

### Netlify
1. Conecte seu repositório no [Netlify](https://netlify.com)
2. Configure:
   - **Build command**: `echo 'Site estático pronto'`
   - **Publish directory**: `.`
3. Deploy automático configurado!

### Vercel
1. Conecte seu repositório no [Vercel](https://vercel.com)
2. Deploy automático com `vercel.json` incluído

### GitHub Pages
1. Vá em Settings > Pages no seu repositório
2. Selecione source: Deploy from a branch
3. Branch: main, folder: / (root)

## 📁 Estrutura do Projeto

```
├── index.html              # Página principal
├── css/
│   └── style.css          # Estilos da aplicação
├── js/
│   ├── app.js             # Lógica principal e drag & drop
│   ├── players.js         # Carregamento de dados (API + CSV)
│   ├── dnd.js             # Sistema de drag and drop
│   └── shields-data.js    # Dados dos escudos dos times
├── assets/
│   ├── shields/           # Escudos dos times (.png)
│   └── uniformes/         # Uniformes dos times (.png)
├── cartola_jogadores_time_posicao_preco.csv  # Dados locais
├── netlify.toml           # Configuração Netlify
├── vercel.json            # Configuração Vercel
└── README.md              # Este arquivo
```

## 🔧 Configuração

### API do Cartola
- **Endpoint**: `https://api.cartola.globo.com/atletas/mercado`
- **Timeout**: 10 segundos
- **Fallback**: CSV local quando API indisponível
- **Atualização**: A cada 5 minutos

### Dados Locais
- **Arquivo**: `cartola_jogadores_time_posicao_preco.csv`
- **Uso**: Fallback e jogadores não disponíveis na API
- **Formato**: Nome, Time, Posição, Preço

## 🎨 Personalização

### Adicionar Novos Times
1. Adicione escudo em `assets/shields/[slug-do-time].png`
2. Adicione uniforme em `assets/uniformes/[nome-do-time] uniforme.png`
3. Atualize `js/shields-data.js` com os dados do time

### Modificar Estilos
- Edite `css/style.css`
- Cores principais: `#21c35c` (verde), `#0d1a14` (fundo escuro)

## 🐛 Solução de Problemas

### Jogadores não aparecem
- Verifique se a API está respondendo
- Confirme se o CSV está no formato correto
- Veja o console do navegador para erros

### Imagens não carregam
- Verifique se os arquivos estão na pasta correta
- Confirme se os nomes dos arquivos estão corretos
- Use o console para ver erros 404

### CORS errors
- Use um servidor local (não abra o HTML diretamente)
- Configure proxy se necessário

## 📄 Licença

Este projeto é de código aberto. Use livremente para fins educacionais e pessoais.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

**Desenvolvido com ❤️ para a comunidade do Cartola FC**