exports.handler = async (event, context) => {
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Responder a requisições OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('[CSV Update] Iniciando atualização do CSV...');
    
    // Buscar dados da API do Cartola
    const apiUrl = 'https://api.cartola.globo.com/atletas/mercado';
    
    const requestHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Referer': 'https://cartola.globo.com/',
      'Origin': 'https://cartola.globo.com'
    };

    console.log('[CSV Update] Fazendo requisição para API do Cartola...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 segundos

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: requestHeaders,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[CSV Update] Dados recebidos: ${Object.keys(data.atletas || {}).length} atletas`);

    // Mapeamento de clubes da API
    const API_CLUB_MAPPING = {
      263: 'Botafogo', 264: 'Corinthians', 265: 'Bahia', 266: 'Fluminense', 267: 'Vasco',
      275: 'Palmeiras', 276: 'São Paulo', 277: 'Santos', 285: 'Atlético-MG',
      293: 'Grêmio', 294: 'Internacional', 356: 'Fortaleza', 373: 'Cruzeiro',
      1371: 'Juventude', 1372: 'Ceará', 1373: 'Sport', 1376: 'Vitória',
      1377: 'Red Bull Bragantino', 2305: 'Mirassol'
    };

    // Mapeamento de posições da API
    const API_POSITION_MAPPING = {
      1: 'Goleiro', 2: 'Lateral', 3: 'Zagueiro', 4: 'Meia', 5: 'Atacante', 6: 'Técnico'
    };

    // Converter dados da API para formato CSV
    const csvLines = ['Nome,Clube,Posicao,Preco']; // Header
    let processedCount = 0;

    Object.values(data.atletas).forEach(atleta => {
      const clubeId = atleta.clube_id;
      const clubeNome = API_CLUB_MAPPING[clubeId];
      
      if (clubeNome && data.clubes[clubeId]) {
        const posicao = API_POSITION_MAPPING[atleta.posicao_id] || 'Meia';
        const nome = (atleta.apelido || atleta.nome).replace(/,/g, ''); // Remover vírgulas
        const preco = atleta.preco_num.toFixed(2);
        
        csvLines.push(`${nome},${clubeNome},${posicao},${preco}`);
        processedCount++;
      }
    });

    const csvContent = csvLines.join('\n');
    
    console.log(`[CSV Update] CSV gerado com ${processedCount} jogadores`);
    console.log(`[CSV Update] Tamanho do CSV: ${csvContent.length} caracteres`);

    // Obter informações do mercado
    let marketInfo = {};
    try {
      const statusResponse = await fetch('https://api.cartola.globo.com/mercado/status', {
        headers: requestHeaders,
        signal: AbortSignal.timeout(5000)
      });
      if (statusResponse.ok) {
        marketInfo = await statusResponse.json();
      }
    } catch (error) {
      console.log('[CSV Update] Não foi possível obter status do mercado');
    }

    // Retornar resultado
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'CSV atualizado com sucesso',
        timestamp: new Date().toISOString(),
        stats: {
          total_atletas: Object.keys(data.atletas || {}).length,
          processed_atletas: processedCount,
          total_clubes: Object.keys(data.clubes || {}).length,
          csv_size: csvContent.length,
          csv_lines: csvLines.length
        },
        market_info: {
          rodada_atual: marketInfo.rodada_atual || 'N/A',
          status_mercado: marketInfo.status_mercado || 'N/A',
          game_over: marketInfo.game_over || false
        },
        csv_content: csvContent, // Retornar o CSV para download
        download_ready: true
      })
    };

  } catch (error) {
    console.error('[CSV Update] Erro:', error);
    
    let errorMessage = 'Erro desconhecido';
    let statusCode = 500;
    
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout na requisição para a API do Cartola';
      statusCode = 408;
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Erro de conexão com a API do Cartola';
      statusCode = 502;
    } else {
      errorMessage = error.message;
    }
    
    return {
      statusCode: statusCode,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Erro ao atualizar CSV',
        message: errorMessage,
        timestamp: new Date().toISOString()
      })
    };
  }
};
