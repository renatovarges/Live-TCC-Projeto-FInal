#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para atualizar preços dos jogadores do Cartola FC automaticamente
"""

import requests
import pandas as pd
import json
from datetime import datetime
import os
import time
import shutil

def fetch_with_retry(url, headers, max_retries=3, timeout=30):
    """
    Faz requisição HTTP com retry automático e backoff exponencial
    """
    for attempt in range(max_retries):
        try:
            print(f"🔄 Tentativa {attempt + 1}/{max_retries} - Buscando dados da API...")
            response = requests.get(url, headers=headers, timeout=timeout)
            response.raise_for_status()
            
            # Validar se a resposta contém dados válidos
            data = response.json()
            if not data or 'atletas' not in data:
                raise ValueError("Resposta da API não contém dados de atletas")
            
            # Verificar se há um número mínimo de atletas
            if len(data['atletas']) < 100:
                raise ValueError(f"Número insuficiente de atletas: {len(data['atletas'])}")
            
            print(f"✅ Dados obtidos com sucesso: {len(data['atletas'])} atletas")
            return data
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Erro de rede na tentativa {attempt + 1}: {e}")
        except ValueError as e:
            print(f"❌ Erro de validação na tentativa {attempt + 1}: {e}")
        except Exception as e:
            print(f"❌ Erro inesperado na tentativa {attempt + 1}: {e}")
        
        if attempt < max_retries - 1:
            wait_time = 2 ** attempt  # Backoff exponencial: 1s, 2s, 4s
            print(f"⏳ Aguardando {wait_time}s antes da próxima tentativa...")
            time.sleep(wait_time)
    
    print(f"❌ Todas as {max_retries} tentativas falharam")
    return None

def get_cartola_data():
    """
    Busca dados atualizados da API do Cartola FC com retry automático
    """
    url = "https://api.cartola.globo.com/atletas/mercado"
    
    # Headers mais robustos para simular um navegador real
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site'
    }
    
    return fetch_with_retry(url, headers)

def process_player_data(api_data):
    """
    Processa os dados da API e converte para o formato do CSV com validação robusta
    """
    if not api_data or 'atletas' not in api_data:
        print("❌ Dados da API inválidos ou sem atletas")
        return None
    
    # Mapear posições
    posicoes = {
        1: 'Goleiro',
        2: 'Lateral', 
        3: 'Zagueiro',
        4: 'Meia',
        5: 'Atacante',
        6: 'Técnico'
    }
    
    # Mapear times
    times = api_data.get('clubes', {})
    if not times:
        print("⚠️ Nenhum clube encontrado nos dados da API")
    
    players_data = []
    processed_count = 0
    error_count = 0
    
    # Verificar se atletas é lista ou dicionário
    atletas = api_data['atletas']
    if isinstance(atletas, list):
        # Se for lista, iterar diretamente
        for player in atletas:
            try:
                # Validar dados essenciais do jogador
                if not player.get('apelido'):
                    print(f"⚠️ Jogador sem nome encontrado, pulando...")
                    error_count += 1
                    continue
                
                # Buscar nome do time
                time_id = player.get('clube_id')
                time_nome = times.get(str(time_id), {}).get('nome', 'Desconhecido') if time_id else 'Desconhecido'
                
                # Dados do jogador com validação
                jogador_data = {
                    'Jogador': player.get('apelido', ''),
                    'Time': time_nome,
                    'Posição': posicoes.get(player.get('posicao_id'), 'Desconhecido'),
                    'Preço (C$)': player.get('preco_num', 0),
                    'Média (pts)': player.get('media_num', 0),
                    'Variação última (C$)': player.get('variacao_num', 0),
                    'Jogos': player.get('jogos_num', 0),
                    'ID': player.get('atleta_id', '')
                }
                
                players_data.append(jogador_data)
                processed_count += 1
                
            except Exception as e:
                print(f"❌ Erro ao processar jogador: {e}")
                error_count += 1
                continue
    else:
         # Se for dicionário, usar o método original
         for player_id, player in atletas.items():
             try:
                 # Validar dados essenciais do jogador
                 if not player.get('apelido'):
                     print(f"⚠️ Jogador {player_id} sem nome encontrado, pulando...")
                     error_count += 1
                     continue
                 
                 # Buscar nome do time
                 time_id = player.get('clube_id')
                 time_nome = times.get(str(time_id), {}).get('nome', 'Desconhecido') if time_id else 'Desconhecido'
                 
                 # Dados do jogador com validação
                 jogador_data = {
                     'Jogador': player.get('apelido', ''),
                     'Time': time_nome,
                     'Posição': posicoes.get(player.get('posicao_id'), 'Desconhecido'),
                     'Preço (C$)': player.get('preco_num', 0),
                     'Média (pts)': player.get('media_num', 0),
                     'Variação última (C$)': player.get('variacao_num', 0),
                     'Jogos': player.get('jogos_num', 0),
                     'ID': player.get('atleta_id', '')
                 }
                 
                 players_data.append(jogador_data)
                 processed_count += 1
                 
             except Exception as e:
                 print(f"❌ Erro ao processar jogador {player_id}: {e}")
                 error_count += 1
                 continue
    
    # Estatísticas finais e validação
    print(f"📊 Processamento concluído:")
    print(f"   ✅ Jogadores processados: {processed_count}")
    print(f"   ❌ Erros encontrados: {error_count}")
    
    if processed_count < 50:
        raise ValueError(f"Número insuficiente de jogadores processados: {processed_count}")
    
    return players_data

def update_csv_file(players_data, csv_path):
    """
    Atualiza o arquivo CSV com os novos dados
    """
    try:
        # Criar DataFrame
        df = pd.DataFrame(players_data)
        
        # Ordenar por Time e depois por Posição
        df = df.sort_values(['Time', 'Posição', 'Jogador'])
        
        # Salvar CSV
        df.to_csv(csv_path, index=False, encoding='utf-8')
        
        print(f"✅ CSV atualizado com {len(players_data)} jogadores")
        print(f"📅 Última atualização: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao salvar CSV: {e}")
        return False

def main():
    """
    Função principal com tratamento robusto de erros
    """
    start_time = datetime.now()
    print("🔄 Iniciando atualização dos preços do Cartola FC...")
    print(f"⏰ Horário de início: {start_time.strftime('%d/%m/%Y %H:%M:%S')}")
    
    try:
        # Caminho do arquivo CSV
        csv_path = "cartola_jogadores_time_posicao_preco.csv"
        
        # Criar backup do arquivo existente
        if os.path.exists(csv_path):
            backup_path = f"{csv_path}.backup_{start_time.strftime('%Y%m%d_%H%M%S')}"
            shutil.copy2(csv_path, backup_path)
            print(f"💾 Backup criado: {backup_path}")
        
        # Buscar dados da API
        print("📡 Buscando dados da API do Cartola FC...")
        api_data = get_cartola_data()
        
        if not api_data:
            raise Exception("Falha ao obter dados da API do Cartola FC")
        
        print(f"✅ Dados da API obtidos com sucesso")
        
        # Processar dados
        print("⚙️ Processando dados dos jogadores...")
        players_data = process_player_data(api_data)
        
        if not players_data:
            raise Exception("Falha ao processar dados dos jogadores")
        
        # Atualizar CSV
        print("💾 Atualizando arquivo CSV...")
        success = update_csv_file(players_data, csv_path)
        
        if not success:
            raise Exception("Falha ao salvar arquivo CSV")
        
        # Estatísticas finais
        end_time = datetime.now()
        duration = end_time - start_time
        file_size = os.path.getsize(csv_path) / 1024  # KB
        
        print("\n🎉 ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!")
        print(f"⏱️ Tempo de execução: {duration.total_seconds():.2f} segundos")
        print(f"📊 Total de jogadores: {len(players_data)}")
        print(f"📁 Tamanho do arquivo: {file_size:.2f} KB")
        print(f"🕐 Finalizado em: {end_time.strftime('%d/%m/%Y %H:%M:%S')}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO DURANTE A ATUALIZAÇÃO: {e}")
        print(f"🔍 Detalhes técnicos:")
        print(f"   - Horário do erro: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        print(f"   - Tipo do erro: {type(e).__name__}")
        print(f"\n💡 Possíveis soluções:")
        print(f"   1. Verificar conexão com a internet")
        print(f"   2. Tentar novamente em alguns minutos")
        print(f"   3. Verificar se a API do Cartola FC está funcionando")
        
        return False

if __name__ == "__main__":
    main()