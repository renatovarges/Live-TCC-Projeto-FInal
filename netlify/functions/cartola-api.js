exports.handler = async (event, context) => {
  // Configurar headers CORS robustos
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  // Responder a requisições OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Extrair o endpoint da query string ou path
    let endpoint = event.queryStringParameters?.endpoint || 'mercado/status';
    
    // Se não há endpoint na query, tentar extrair do path
    if (!event.queryStringParameters?.endpoint && event.path) {
      const pathParts = event.path.split('/api/cartola/');
      if (pathParts.length > 1) {
        endpoint = pathParts[1];
      }
    }
    
    const apiUrl = `https://api.cartola.globo.com/${endpoint}`;
    
    console.log(`[Cartola API] Fazendo requisição para: ${apiUrl}`);
    console.log(`[Cartola API] Endpoint solicitado: ${endpoint}`);
    console.log(`[Cartola API] Method: ${event.httpMethod}`);
    console.log(`[Cartola API] Headers recebidos:`, event.headers);
    
    // Headers mais específicos para simular um navegador real
    const requestHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://cartola.globo.com/',
      'Origin': 'https://cartola.globo.com',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'Connection': 'keep-alive'
    };

    // Fazer a requisição para a API do Cartola com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: requestHeaders,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log(`[Cartola API] Status da resposta: ${response.status}`);
    console.log(`[Cartola API] Headers da resposta:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`[Cartola API] Dados recebidos com sucesso. Tamanho: ${JSON.stringify(data).length} caracteres`);
    
    // Log específico para diferentes endpoints
    if (endpoint.includes('atletas/mercado')) {
      console.log(`[Cartola API] Atletas carregados: ${Object.keys(data.atletas || {}).length}`);
      console.log(`[Cartola API] Clubes carregados: ${Object.keys(data.clubes || {}).length}`);
    } else if (endpoint.includes('mercado/status')) {
      console.log(`[Cartola API] Status do mercado: ${data.status_mercado} (1=aberto, 2=fechado)`);
      console.log(`[Cartola API] Rodada atual: ${data.rodada_atual}`);
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
    
  } catch (error) {
    console.error('[Cartola API] Erro na função:', error);
    
    // Diferentes tipos de erro
    let errorMessage = 'Erro desconhecido';
    let statusCode = 500;
    
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout na requisição para a API do Cartola';
      statusCode = 408;
      console.error('[Cartola API] Timeout - API muito lenta');
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Erro de conexão com a API do Cartola';
      statusCode = 502;
      console.error('[Cartola API] Erro de conexão');
    } else {
      errorMessage = error.message;
      console.error('[Cartola API] Erro geral:', error.message);
    }
    
    return {
      statusCode: statusCode,
      headers,
      body: JSON.stringify({
        error: 'Erro ao acessar API do Cartola',
        message: errorMessage,
        timestamp: new Date().toISOString(),
        endpoint: event.queryStringParameters?.endpoint || 'não especificado',
        debug: {
          path: event.path,
          method: event.httpMethod,
          query: event.queryStringParameters
        }
      })
    };
  }
};
