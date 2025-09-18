# 🔄 Sistema de Atualização Automática do CSV

## 📋 Visão Geral

Este sistema mantém o arquivo CSV sempre atualizado com os dados mais recentes da API do Cartola, garantindo que você tenha um backup confiável mesmo quando a API estiver indisponível.

## 🎯 Benefícios

✅ **CSV sempre atualizado** com preços e dados mais recentes  
✅ **Backup confiável** quando a API estiver fora do ar  
✅ **Atualização automática** sem intervenção manual  
✅ **Múltiplas opções** de frequência de atualização  
✅ **Logs detalhados** de todas as atualizações  
✅ **Interface administrativa** para gerenciamento  

## 🛠️ Componentes Implementados

### 1. **Função Netlify** (`netlify/functions/update-csv.js`)
- Busca dados da API do Cartola
- Converte para formato CSV
- Retorna CSV atualizado para download
- Logs detalhados de execução

### 2. **Painel Administrativo** (`admin-csv.html`)
- Interface web para gerenciar atualizações
- Atualização manual com um clique
- Verificação de status da API
- Download do CSV atualizado
- Estatísticas em tempo real

### 3. **GitHub Actions** (`.github/workflows/update-csv-auto.yml`)
- Atualização automática programada
- Commit automático das mudanças
- Logs detalhados no GitHub
- Múltiplas opções de frequência

## ⏰ Opções de Frequência

### 🕐 **A Cada Hora**
```yaml
schedule:
  - cron: '0 * * * *'  # A cada hora
```
- **Prós**: Dados sempre fresquíssimos
- **Contras**: Mais uso de recursos
- **Recomendado**: Durante períodos de mercado ativo

### 🕕 **A Cada 6 Horas** (PADRÃO)
```yaml
schedule:
  - cron: '0 */6 * * *'  # A cada 6 horas
```
- **Prós**: Equilibra atualização com performance
- **Contras**: Dados podem ficar até 6h desatualizados
- **Recomendado**: Para uso geral

### 🌅 **Diário (6h da manhã)**
```yaml
schedule:
  - cron: '0 6 * * *'  # Diariamente às 6h
```
- **Prós**: Baixo uso de recursos
- **Contras**: Dados podem ficar 24h desatualizados
- **Recomendado**: Para sites com baixo tráfego

## 🚀 Como Configurar

### Passo 1: Ativar GitHub Actions
1. Vá no seu repositório GitHub
2. Clique na aba "Actions"
3. Ative as GitHub Actions se não estiverem ativas
4. O workflow será executado automaticamente

### Passo 2: Configurar Frequência
1. Edite o arquivo `.github/workflows/update-csv-auto.yml`
2. Modifique a linha `cron:` para a frequência desejada
3. Faça commit das mudanças

### Passo 3: Testar Manualmente
1. Acesse `https://seu-site.netlify.app/admin-csv.html`
2. Clique em "🚀 Atualizar Agora"
3. Verifique se o CSV foi atualizado

## 📊 Monitoramento

### Via Painel Administrativo
- Acesse `admin-csv.html`
- Veja estatísticas em tempo real
- Monitore status da API
- Baixe CSV atualizado

### Via GitHub Actions
- Vá na aba "Actions" do seu repositório
- Veja histórico de execuções
- Logs detalhados de cada atualização
- Resumos automáticos

### Via Logs do Netlify
- Painel do Netlify → Functions
- Logs da função `update-csv`
- Detalhes de cada execução

## 🔧 Personalização

### Modificar Frequência
Edite o arquivo `.github/workflows/update-csv-auto.yml`:

```yaml
# Exemplos de frequências
schedule:
  - cron: '0 * * * *'      # A cada hora
  - cron: '0 */2 * * *'    # A cada 2 horas
  - cron: '0 */6 * * *'    # A cada 6 horas
  - cron: '0 6,18 * * *'   # 6h e 18h todos os dias
  - cron: '0 6 * * 1-5'    # 6h apenas em dias úteis
```

### Adicionar Notificações
Você pode adicionar notificações por email ou Slack modificando o workflow:

```yaml
- name: 📧 Notificar atualização
  if: steps.check-changes.outputs.changes == 'true'
  run: |
    # Adicionar código para enviar notificação
    echo "CSV atualizado com ${{ steps.fetch-data.outputs.processed_count }} jogadores"
```

## 📈 Estatísticas Típicas

### Dados Processados
- **Atletas**: ~774 jogadores
- **Clubes**: 20 times
- **Posições**: 6 posições
- **Tamanho CSV**: ~50KB

### Performance
- **Tempo de execução**: 10-30 segundos
- **Uso de recursos**: Mínimo
- **Frequência recomendada**: A cada 6 horas

## 🚨 Solução de Problemas

### CSV não está sendo atualizado
1. Verifique se as GitHub Actions estão ativas
2. Veja os logs na aba "Actions"
3. Teste manualmente via `admin-csv.html`

### API retornando erro
1. Verifique status da API via painel admin
2. Aguarde alguns minutos e tente novamente
3. O sistema usará o CSV existente como fallback

### Arquivo muito grande
1. O CSV típico tem ~50KB (muito leve)
2. Se crescer muito, considere filtrar apenas jogadores ativos
3. Monitore via estatísticas do painel

## 📝 Logs de Exemplo

### Sucesso
```
🔄 Iniciando atualização do CSV...
📊 Buscando dados dos atletas...
📈 Buscando status do mercado...
💾 Salvando 774 jogadores no CSV...
✅ CSV atualizado com sucesso!
📊 Estatísticas:
   - Total de atletas: 774
   - Atletas processados: 774
   - Clubes: 20
   - Rodada atual: 24
```

### Erro
```
🔄 Iniciando atualização do CSV...
📊 Buscando dados dos atletas...
❌ Erro: Timeout na requisição
🔄 Usando CSV existente como fallback
```

## 🎯 Próximos Passos

1. **Ativar o sistema**: Faça commit dos arquivos
2. **Testar**: Use o painel administrativo
3. **Monitorar**: Acompanhe as primeiras execuções
4. **Ajustar**: Modifique a frequência conforme necessário

---

**Data de implementação**: 16 de setembro de 2025  
**Versão**: 1.0 - Sistema completo de atualização automática  
**Status**: ✅ PRONTO PARA USO
