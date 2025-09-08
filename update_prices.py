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

def get_cartola_data():
    """
    Busca dados atualizados da API do Cartola FC
    """
    try:
        # URL da API do Cartola FC
        url = "https://api.cartola.globo.com/atletas/mercado"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        return data
    
    except Exception as e:
        print(f"Erro ao buscar dados da API: {e}")
        return None

def process_player_data(api_data):
    """
    Processa os dados da API e converte para o formato do CSV
    """
    if not api_data or 'atletas' not in api_data:
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
    
    players_data = []
    
    # Verificar se atletas é lista ou dicionário
    atletas = api_data['atletas']
    if isinstance(atletas, list):
        # Se for lista, iterar diretamente
        for player in atletas:
            try:
                # Buscar nome do time
                time_id = player.get('clube_id')
                time_nome = times.get(str(time_id), {}).get('nome', 'Desconhecido') if time_id else 'Desconhecido'
                
                # Dados do jogador
                jogador_data = {
                    'Jogador': player.get('apelido', ''),
                    'Time': time_nome,
                    'Posição': posicoes.get(player.get('posicao_id'), 'Desconhecido'),
                    'Preço (C$)': player.get('preco_num', 0),
                    'Média (pts)': player.get('media_num', 0),
                    'Variação última (C$)': player.get('variacao_num', 0),
                    'Jogos': player.get('jogos_num', 0)
                }
                
                players_data.append(jogador_data)
                
            except Exception as e:
                print(f"Erro ao processar jogador: {e}")
                continue
    else:
         # Se for dicionário, usar o método original
         for player_id, player in atletas.items():
             try:
                 # Buscar nome do time
                 time_id = player.get('clube_id')
                 time_nome = times.get(str(time_id), {}).get('nome', 'Desconhecido') if time_id else 'Desconhecido'
                 
                 # Dados do jogador
                 jogador_data = {
                     'Jogador': player.get('apelido', ''),
                     'Time': time_nome,
                     'Posição': posicoes.get(player.get('posicao_id'), 'Desconhecido'),
                     'Preço (C$)': player.get('preco_num', 0),
                     'Média (pts)': player.get('media_num', 0),
                     'Variação última (C$)': player.get('variacao_num', 0),
                     'Jogos': player.get('jogos_num', 0)
                 }
                 
                 players_data.append(jogador_data)
                 
             except Exception as e:
                 print(f"Erro ao processar jogador {player_id}: {e}")
                 continue
    
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
    Função principal
    """
    print("🔄 Iniciando atualização dos preços do Cartola FC...")
    
    # Caminho do arquivo CSV
    csv_path = "cartola_jogadores_time_posicao_preco.csv"
    
    # Buscar dados da API
    print("📡 Buscando dados da API do Cartola FC...")
    api_data = get_cartola_data()
    
    if not api_data:
        print("❌ Falha ao obter dados da API")
        return False
    
    # Processar dados
    print("⚙️ Processando dados dos jogadores...")
    players_data = process_player_data(api_data)
    
    if not players_data:
        print("❌ Falha ao processar dados dos jogadores")
        return False
    
    # Atualizar CSV
    print("💾 Atualizando arquivo CSV...")
    success = update_csv_file(players_data, csv_path)
    
    if success:
        print("✅ Atualização concluída com sucesso!")
        return True
    else:
        print("❌ Falha na atualização")
        return False

if __name__ == "__main__":
    main()