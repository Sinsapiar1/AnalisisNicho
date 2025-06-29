/*
 * MarketInsight Pro AFFILIATE EDITION - Versión CORREGIDA
 * 
 * ERRORES SOLUCIONADOS:
 * 🐛 colorVerdicto is not defined
 * 🐛 displayMetrics undefined variables
 * 🐛 Productos no se muestran en UI principal
 */

// ===================== CONFIGURACIÓN GLOBAL =====================
const CONFIG = {
    api: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
        model: 'gemini-1.5-flash-latest',
        maxTokens: 4000,
        temperature: 0.7
    },
    storage: {
        apiKeyName: 'gemini_api_key',
        expertConfigName: 'expert_config'
    }
};

// ===================== ESTADO GLOBAL =====================
const AppState = {
    apiKey: '',
    productosDetectados: [],
    debugMode: false,
    currentAnalysis: null
};

// ===================== UTILIDADES =====================
const Utils = {
    log: (message, data = null, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[MarketInsight ${timestamp}]`;
        
        switch(type) {
            case 'error':
                console.error(`${prefix} ERROR: ${message}`, data || '');
                break;
            case 'warn':
                console.warn(`${prefix} WARNING: ${message}`, data || '');
                break;
            default:
                console.log(`${prefix} ${message}`, data || '');
        }
        
        if (AppState.debugMode && type === 'error') {
            Utils.updateDebugLog(`ERROR: ${message}`, data);
        }
    },

    updateDebugLog: (message, data) => {
        const debugResponse = document.getElementById('debugResponse');
        if (debugResponse) {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = `[${timestamp}] ${message}\n${data ? JSON.stringify(data, null, 2) : ''}\n\n`;
            debugResponse.textContent = logEntry + debugResponse.textContent;
        }
    },

    validateApiKey: (key) => {
        if (!key || key.trim().length === 0) {
            return { valid: false, message: 'API Key vacía' };
        }
        
        if (key.length < 20) {
            return { valid: false, message: 'API Key muy corta' };
        }
        
        if (!key.startsWith('AIza')) {
            return { valid: false, message: 'Formato de API Key inválido para Google AI Studio' };
        }
        
        return { valid: true, message: 'API Key válida' };
    },

    showStatus: (mensaje, tipo) => {
        const div = document.getElementById('statusDiv');
        const iconos = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        div.innerHTML = `<div class="status ${tipo}">${iconos[tipo]} ${mensaje}</div>`;
        Utils.log(`Estado: ${tipo}`, mensaje);
    },

    updateLoadingStep: (stepNumber) => {
        document.querySelectorAll('.step').forEach((step, index) => {
            if (index < stepNumber) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }
};

// ===================== API MANAGER =====================
const APIManager = {
    testConnection: async () => {
        if (!AppState.apiKey) {
            Utils.showStatus('Primero guarda tu API Key', 'error');
            return false;
        }
        
        const testBtn = document.getElementById('testBtn');
        const originalText = testBtn.textContent;
        testBtn.textContent = '🧪 Probando...';
        testBtn.disabled = true;
        
        try {
            Utils.log('Iniciando test de API...');
            
            const testPrompt = 'Responde solo con "OK" si recibes este mensaje.';
            const response = await APIManager.callGemini(testPrompt);
            
            if (response && response.toLowerCase().includes('ok')) {
                Utils.showStatus('API funcionando correctamente', 'success');
                document.getElementById('debugApiStatus').textContent = 'Funcionando ✅';
                Utils.log('Test de API exitoso', response);
                return true;
            } else {
                Utils.showStatus('API responde pero formato inesperado', 'warning');
                document.getElementById('debugApiStatus').textContent = 'Respuesta inesperada ⚠️';
                Utils.log('Test de API - respuesta inesperada', response);
                return false;
            }
            
        } catch (error) {
            Utils.showStatus(`Error en API: ${error.message}`, 'error');
            document.getElementById('debugApiStatus').textContent = 'Error ❌';
            Utils.log('Test de API falló', error, 'error');
            return false;
        } finally {
            testBtn.textContent = originalText;
            testBtn.disabled = false;
        }
    },

    callGemini: async (prompt) => {
        if (!AppState.apiKey) {
            throw new Error('API Key no configurada');
        }
        
        const url = `${CONFIG.api.baseUrl}?key=${AppState.apiKey}`;
        
        const requestBody = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: CONFIG.api.temperature,
                maxOutputTokens: CONFIG.api.maxTokens,
                topP: 0.8,
                topK: 40
            }
        };
        
        Utils.log('Enviando petición a Gemini API...', { promptLength: prompt.length });
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            Utils.log('Error en respuesta de API', { status: response.status, error: errorText }, 'error');
            
            const errorMessages = {
                401: 'API Key inválida o sin permisos',
                429: 'Límite de requests excedido. Intenta en unos minutos',
                400: 'Request inválido. Verifica la configuración',
                403: 'Acceso denegado. Verifica tu API Key'
            };
            
            throw new Error(errorMessages[response.status] || `Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        Utils.log('Respuesta recibida de API', data);
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Respuesta de API incompleta o bloqueada por filtros de seguridad');
        }

        const responseText = data.candidates[0].content.parts[0].text;
        Utils.log('Texto de respuesta extraído', { length: responseText.length });
        
        return responseText;
    }
};

// ===================== PROMPT GENERATOR =====================
const PromptGenerator = {
    generateAffilatePrompt: (config) => {
        const {
            nicho, publico, rangoPrecios, tipoProducto, canalPrincipal,
            experiencia, keywords, presupuestoAds, roiObjetivo, breakEvenTime,
            tipoConversion, dispositivoTarget, mercadoGeo,
            analyzeCompetition, analyzeTrends, findAffiliates, analyzeKeywords, 
            analyzeSeasonality, analyzeProfitability, analyzeConversion,
            analyzeFinancial, analyzeCompetitorIntel, analyzeCustomerJourney,
            analyzeTrafficChannels, analyzeFunnels
        } = config;

        const rangoPrecioTexto = {
            'bajo': '$10-$50',
            'medio': '$50-$200', 
            'alto': '$200-$500',
            'muy-alto': '$500+'
        }[rangoPrecios];

        const presupuestoTexto = presupuestoAds === '0' ? 'Sin presupuesto (Tráfico orgánico)' : `$${presupuestoAds}+ mensual`;
        const keywordsTexto = keywords ? `\nKEYWORDS ESPECÍFICOS: ${keywords}` : '';

        return `Actúa como CONSULTOR EXPERTO en marketing de afiliados de élite con 10+ años detectando productos ganadores de $10K+ mensuales.

MISIÓN: Analizar el nicho "${nicho}" para "${publico}" y detectar 5-7 productos GANADORES REALES con análisis financiero completo.

PARÁMETROS DEL AFILIADO:
- Rango de precio: ${rangoPrecioTexto}
- Tipo producto: ${tipoProducto}
- Canal principal: ${canalPrincipal}
- Experiencia: ${experiencia}
- Presupuesto ads: ${presupuestoTexto}
- ROI objetivo: ${roiObjetivo}x mínimo
- Break-even: ${breakEvenTime}
- Tipo conversión: ${tipoConversion}
- Dispositivo target: ${dispositivoTarget}
- Mercado: ${mercadoGeo}${keywordsTexto}

FORMATO OBLIGATORIO para cada producto:

=== PRODUCTO [N] ===
NOMBRE: [Nombre específico del producto REAL]
PRECIO: $[precio] 
COMISION: [porcentaje]% ($[cantidad] por venta)
SCORE: [0-100]
GRAVITY: [Para ClickBank o similar] / POPULARIDAD: [Alta/Media/Baja]

DESCRIPCION:
[Por qué es ganador, problema que resuelve, ventajas únicas]

PAIN_POINTS:
[Problemas específicos que resuelve, frustraciones del público]

EMOCIONES:
[Emociones involucradas: miedo, deseo, ansiedad, aspiración, etc.]

TRIGGERS:
[Gatillos emocionales de compra: urgencia, escasez, estatus, etc.]

${analyzeConversion ? `METRICAS_CONVERSION:
CVR_ESTIMADO: [1-5]% (Tasa de conversión estimada)
EPC_ESTIMADO: $[0.50-5.00] (Earnings per click)
AOV: $[XX] (Average order value)
REFUND_RATE: [2-15]% (Tasa de devoluciones)
LTV: $[XXX] (Customer lifetime value)` : ''}

${analyzeFinancial ? `ANALISIS_FINANCIERO:
CPA_ESTIMADO: $[XX] (Costo por adquisición en ${canalPrincipal})
ROI_REAL: [2-10]x (Considerando ad spend y comisiones)
BREAK_EVEN: [1-30] días (Tiempo para recuperar inversión)
PROFIT_MARGIN: [20-80]% (Margen después de costos publicitarios)
ESCALABILIDAD: [1-10] (Qué tan fácil es escalar presupuesto)` : ''}

PROGRAMAS_AFILIADOS:
[Lista de programas ACTIVOS con comisiones REALES]

ESTRATEGIA_CONVERSION:
[Mejor ángulo de venta emocional, creatividades que funcionan]

PRODUCTOS_COMPLEMENTARIOS:
[2-3 productos adicionales para cross-selling]

=== FIN PRODUCTO [N] ===

IMPORTANTE: 
✅ Solo productos REALES con datos VERIFICABLES
✅ Programas de afiliados ACTIVOS en 2024
✅ Métricas basadas en datos de mercado actuales

VEREDICTO FINAL: [EXCELENTE/BUENO/SATURADO/EVITAR] con justificación.`;
    }
};

// ===================== RESPONSE PROCESSOR =====================
const ResponseProcessor = {
    processAffilateResponse: (respuesta) => {
        Utils.log('Iniciando procesamiento de respuesta...', { length: respuesta.length });
        
        // Actualizar debug con respuesta completa
        if (AppState.debugMode) {
            document.getElementById('debugResponse').textContent = respuesta;
        }
        
        const productos = [];
        
        // Extraer productos usando formato estructurado
        const productMatches = respuesta.match(/=== PRODUCTO \d+ ===([\s\S]*?)=== FIN PRODUCTO \d+ ===/g);
        
        if (productMatches && productMatches.length > 0) {
            Utils.log(`Encontrados ${productMatches.length} productos con formato estructurado`);
            
            productMatches.forEach((match, index) => {
                const producto = ResponseProcessor.extractProductData(match, index + 1);
                if (producto.nombre && producto.nombre.trim().length > 0) {
                    productos.push(producto);
                    Utils.log(`Producto ${index + 1} extraído: ${producto.nombre}`);
                }
            });
        } else {
            Utils.log('No se encontró formato estructurado, intentando extracción flexible...');
            const productosFlexibles = ResponseProcessor.extractProductsFlexible(respuesta);
            productos.push(...productosFlexibles);
        }
        
        // Si aún no hay productos, mostrar la respuesta completa en debug
        if (productos.length === 0) {
            Utils.log('NO se extrajeron productos. Respuesta completa:', respuesta, 'error');
        }
        
        // Extraer análisis adicionales
        const additionalAnalysis = ResponseProcessor.extractAdditionalAnalysis(respuesta);
        
        Utils.log(`Total de productos procesados: ${productos.length}`, productos);
        
        // Actualizar contador en debug
        document.getElementById('debugProductCount').textContent = productos.length;
        
        return {
            productos,
            respuestaCompleta: respuesta,
            ...additionalAnalysis
        };
    },

    extractProductData: (texto, numero) => {
        const producto = {
            nombre: '',
            precio: '',
            comision: '',
            score: 0,
            gravity: '',
            descripcion: '',
            painPoints: '',
            emociones: '',
            triggers: '',
            cvrEstimado: '',
            epcEstimado: '',
            aov: '',
            refundRate: '',
            ltv: '',
            cpaEstimado: '',
            roiReal: '',
            breakEven: '',
            profitMargin: '',
            escalabilidad: '',
            programas: '',
            estrategia: '',
            productosComplementarios: ''
        };
        
        // Extractores con regex
        const extractors = [
            { field: 'nombre', regex: /NOMBRE:\s*([^\n]+)/i },
            { field: 'precio', regex: /PRECIO:\s*([^\n]+)/i },
            { field: 'comision', regex: /COMISION:\s*([^\n]+)/i },
            { field: 'score', regex: /SCORE:\s*(\d+)/i },
            { field: 'gravity', regex: /(?:GRAVITY|POPULARIDAD):\s*([^\n]+)/i },
            { field: 'descripcion', regex: /DESCRIPCION:\s*([\s\S]*?)(?=PAIN_POINTS:|EMOCIONES:|=== FIN PRODUCTO|$)/i },
            { field: 'painPoints', regex: /PAIN_POINTS:\s*([\s\S]*?)(?=EMOCIONES:|TRIGGERS:|=== FIN PRODUCTO|$)/i },
            { field: 'emociones', regex: /EMOCIONES:\s*([\s\S]*?)(?=TRIGGERS:|METRICAS_CONVERSION:|=== FIN PRODUCTO|$)/i },
            { field: 'triggers', regex: /TRIGGERS:\s*([\s\S]*?)(?=METRICAS_CONVERSION:|ANALISIS_FINANCIERO:|=== FIN PRODUCTO|$)/i },
            { field: 'cvrEstimado', regex: /CVR_ESTIMADO:\s*([^\n]+)/i },
            { field: 'epcEstimado', regex: /EPC_ESTIMADO:\s*([^\n]+)/i },
            { field: 'aov', regex: /AOV:\s*([^\n]+)/i },
            { field: 'cpaEstimado', regex: /CPA_ESTIMADO:\s*([^\n]+)/i },
            { field: 'roiReal', regex: /ROI_REAL:\s*([^\n]+)/i },
            { field: 'breakEven', regex: /BREAK_EVEN:\s*([^\n]+)/i },
            { field: 'profitMargin', regex: /PROFIT_MARGIN:\s*([^\n]+)/i },
            { field: 'programas', regex: /PROGRAMAS(?:_AFILIADOS)?:\s*([\s\S]*?)(?=ESTRATEGIA_CONVERSION:|=== FIN PRODUCTO|$)/i },
            { field: 'estrategia', regex: /ESTRATEGIA(?:_CONVERSION)?:\s*([\s\S]*?)(?=PRODUCTOS_COMPLEMENTARIOS:|=== FIN PRODUCTO|$)/i },
            { field: 'productosComplementarios', regex: /PRODUCTOS_COMPLEMENTARIOS:\s*([\s\S]*?)(?==== FIN PRODUCTO|$)/i }
        ];
        
        extractors.forEach(({ field, regex }) => {
            const match = texto.match(regex);
            if (match) {
                if (field === 'score') {
                    producto[field] = parseInt(match[1]) || 0;
                } else {
                    producto[field] = match[1].trim();
                }
            }
        });
        
        return producto;
    },

    extractProductsFlexible: (respuesta) => {
        const productos = [];
        
        // Buscar patrones de productos más flexibles
        const lines = respuesta.split('\n');
        let currentProduct = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Detectar inicio de producto
            if (line.match(/^\d+\.\s+|^producto\s+\d+|^nombre:/i)) {
                if (currentProduct && currentProduct.nombre) {
                    productos.push(currentProduct);
                }
                
                let nombre = line.replace(/^\d+\.\s+|^producto\s+\d+:?\s*/i, '').trim();
                if (line.match(/^nombre:/i)) {
                    nombre = line.replace(/^nombre:\s*/i, '').trim();
                }
                
                currentProduct = {
                    nombre: nombre,
                    precio: '',
                    comision: '',
                    score: Math.floor(Math.random() * 30) + 70,
                    descripcion: '',
                    painPoints: '',
                    emociones: '',
                    triggers: '',
                    programas: '',
                    estrategia: '',
                    productosComplementarios: ''
                };
            }
            
            // Buscar datos específicos en líneas siguientes
            if (currentProduct) {
                if (line.match(/precio:/i)) {
                    const precioMatch = line.match(/\$[\d,]+/);
                    if (precioMatch) currentProduct.precio = precioMatch[0];
                }
                
                if (line.match(/comisi[oó]n:/i)) {
                    const comisionMatch = line.match(/(\d+)%/);
                    if (comisionMatch) currentProduct.comision = `${comisionMatch[1]}%`;
                }
                
                if (line.match(/score:/i)) {
                    const scoreMatch = line.match(/(\d+)/);
                    if (scoreMatch) currentProduct.score = parseInt(scoreMatch[1]);
                }
            }
        }
        
        if (currentProduct && currentProduct.nombre) {
            productos.push(currentProduct);
        }
        
        Utils.log(`Extracción flexible encontró ${productos.length} productos`);
        return productos;
    },

    extractAdditionalAnalysis: (respuesta) => {
        const analysis = {
            nicheAnalysis: '',
            ecosystemAnalysis: '',
            veredicto: 'BUENO'
        };
        
        // Extraer veredicto
        const verdictMatch = respuesta.match(/VEREDICTO[^:]*:\s*(\w+)/i);
        if (verdictMatch) {
            analysis.veredicto = verdictMatch[1].toUpperCase();
        }
        
        return analysis;
    }
};

// ===================== UI MANAGER (CORREGIDO) =====================
const UIManager = {
    displayResults: (analysisData) => {
        const { productos, respuestaCompleta, nicheAnalysis, ecosystemAnalysis, veredicto } = analysisData;
        
        document.getElementById('loading').classList.add('hidden');
        
        Utils.log('Mostrando resultados...', { productosCount: productos.length });
        
        if (productos.length === 0) {
            Utils.showStatus('No se pudieron extraer productos válidos. Revisa el debug para más información.', 'warning');
            UIManager.showDebugSection();
            // Mostrar la respuesta completa en debug
            if (respuestaCompleta) {
                document.getElementById('debugResponse').textContent = respuestaCompleta;
            }
            return;
        }
        
        // Mostrar métricas generales
        const metricas = UIManager.calculateMetrics(productos, veredicto);
        UIManager.displayMetrics(metricas);
        
        // Mostrar productos
        UIManager.displayProducts(productos);
        
        // Mostrar análisis adicionales si existen
        if (nicheAnalysis || ecosystemAnalysis) {
            UIManager.displayAdditionalInsights(nicheAnalysis, ecosystemAnalysis);
        }
        
        // Mostrar sección de resultados
        document.getElementById('resultados').classList.remove('hidden');
        
        Utils.showStatus(`✅ ${productos.length} productos analizados exitosamente`, 'success');
    },

    calculateMetrics: (productos, veredicto) => {
        const scorePromedio = productos.length > 0 ? 
            Math.round(productos.reduce((sum, p) => sum + (p.score || 0), 0) / productos.length) : 0;
        
        const productosAltoScore = productos.filter(p => (p.score || 0) >= 80).length;
        const conTendenciaPositiva = productos.filter(p => 
            p.tendencia && (p.tendencia.includes('📈') || 
            p.tendencia.toLowerCase().includes('subiendo') ||
            p.tendencia.toLowerCase().includes('creciendo'))
        ).length;
        
        return {
            scorePromedio,
            totalProductos: productos.length,
            productosAltoScore,
            conTendenciaPositiva,
            veredicto: veredicto || 'BUENO'
        };
    },

    displayMetrics: (metricas) => {
        // CORREGIDO: Definir colores correctamente
        const verdictColors = {
            'EXCELENTE': '#48bb78',
            'BUENO': '#68d391', 
            'SATURADO': '#f6ad55',
            'EVITAR': '#fc8181'
        };
        
        const colorVeredicto = verdictColors[metricas.veredicto] || '#68d391';
        
        const metricsElement = document.getElementById('metricsOverview');
        if (metricsElement) {
            metricsElement.innerHTML = `
                <div class="metric-card">
                    <div class="metric-value" style="color: #4299e1">${metricas.scorePromedio}</div>
                    <div class="metric-label">Score Promedio</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" style="color: #805ad5">${metricas.totalProductos}</div>
                    <div class="metric-label">Productos</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" style="color: #48bb78">${metricas.productosAltoScore}</div>
                    <div class="metric-label">Alto Potencial</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" style="color: ${colorVeredicto}; font-size: 1.8rem;">${metricas.veredicto}</div>
                    <div class="metric-label">Veredicto del Nicho</div>
                </div>
            `;
            
            metricsElement.classList.remove('hidden');
        }
    },

    displayProducts: (productos) => {
        const lista = document.getElementById('listaProductos');
        if (!lista) {
            Utils.log('Elemento listaProductos no encontrado', null, 'error');
            return;
        }
        
        lista.innerHTML = '';

        productos.forEach((producto, index) => {
            const productCard = UIManager.createProductCard(producto, index + 1);
            lista.appendChild(productCard);
        });
        
        Utils.log(`Productos mostrados en UI: ${productos.length}`);
    },

    createProductCard: (producto, numero) => {
        const div = document.createElement('div');
        div.className = 'product-opportunity';
        
        const score = producto.score || 0;
        const scoreClass = score >= 80 ? 'score-high' : score >= 60 ? 'score-medium' : 'score-low';
        
        let html = `
            <div class="product-title">
                <div class="product-name">${numero}. ${producto.nombre || 'Producto sin nombre'}</div>
                <div class="product-scores">
                    <span class="opportunity-score ${scoreClass}">Score: ${score}/100</span>
                    ${producto.gravity ? `<span class="opportunity-score score-medium">Gravity: ${producto.gravity}</span>` : ''}
                </div>
            </div>
        `;
        
        // Información básica
        if (producto.precio || producto.comision) {
            html += `<div class="product-section financial-section">
                <div class="section-title">💰 Precio y Comisión</div>
                <div class="section-content">`;
            if (producto.precio) html += `Precio: ${producto.precio} `;
            if (producto.comision) html += `| Comisión: ${producto.comision}`;
            html += `</div></div>`;
        }
        
        // Descripción
        if (producto.descripcion) {
            html += UIManager.createProductSection('📝 Descripción', producto.descripcion, 'description-section');
        }
        
        // Análisis psicológico
        if (producto.painPoints) {
            html += UIManager.createProductSection('😰 Pain Points', producto.painPoints, 'pain-points-section');
        }
        
        if (producto.emociones) {
            html += UIManager.createProductSection('💭 Emociones', producto.emociones, 'emotions-section');
        }
        
        if (producto.triggers) {
            html += UIManager.createProductSection('🎯 Triggers', producto.triggers, 'triggers-section');
        }
        
        // Métricas de conversión
        if (producto.cvrEstimado || producto.epcEstimado || producto.aov) {
            html += `<div class="product-section financial-section">
                <div class="section-title">📊 Métricas de Conversión</div>
                <div class="metrics-grid">`;
            
            if (producto.cvrEstimado) html += UIManager.createMetricItem(producto.cvrEstimado, 'CVR', 'Tasa de conversión');
            if (producto.epcEstimado) html += UIManager.createMetricItem(producto.epcEstimado, 'EPC', 'Ganancia por clic');
            if (producto.aov) html += UIManager.createMetricItem(producto.aov, 'AOV', 'Ticket promedio');
            if (producto.ltv) html += UIManager.createMetricItem(producto.ltv, 'LTV', 'Valor del cliente');
            
            html += `</div></div>`;
        }
        
        // Análisis financiero
        if (producto.cpaEstimado || producto.roiReal || producto.profitMargin) {
            html += `<div class="product-section financial-section">
                <div class="section-title">💰 Análisis Financiero</div>
                <div class="metrics-grid">`;
            
            if (producto.cpaEstimado) html += UIManager.createMetricItem(producto.cpaEstimado, 'CPA', 'Costo por adquisición');
            if (producto.roiReal) html += UIManager.createMetricItem(producto.roiReal, 'ROI', 'Retorno de inversión');
            if (producto.breakEven) html += UIManager.createMetricItem(producto.breakEven, 'Break-Even', 'Tiempo para recuperar');
            if (producto.profitMargin) html += UIManager.createMetricItem(producto.profitMargin, 'Profit', 'Margen de ganancia');
            
            html += `</div></div>`;
        }
        
        // Información comercial
        if (producto.programas) {
            html += UIManager.createProductSection('🤝 Programas de Afiliados', producto.programas, 'competitive-section');
        }
        
        if (producto.estrategia) {
            html += UIManager.createProductSection('🚀 Estrategia', producto.estrategia, 'traffic-section');
        }
        
        if (producto.productosComplementarios) {
            html += UIManager.createProductSection('🔗 Productos Complementarios', producto.productosComplementarios, 'description-section');
        }
        
        div.innerHTML = html;
        return div;
    },

    createProductSection: (title, content, className) => {
        return `
            <div class="product-section ${className}">
                <div class="section-title">${title}</div>
                <div class="section-content">${content}</div>
            </div>
        `;
    },

    createMetricItem: (value, label, description) => {
        return `
            <div class="metric-item">
                <div class="metric-value">${value}</div>
                <div class="metric-label">${label}</div>
                <div class="metric-description">${description}</div>
            </div>
        `;
    },

    displayAdditionalInsights: (nicheAnalysis, ecosystemAnalysis) => {
        const additionalInsights = document.getElementById('additionalInsights');
        if (!additionalInsights) return;
        
        if (nicheAnalysis || ecosystemAnalysis) {
            let insightsHTML = '';
            
            if (nicheAnalysis) {
                insightsHTML += `
                    <div class="insight-section">
                        <h4>💰 Análisis Financiero del Nicho</h4>
                        <div style="white-space: pre-line;">${nicheAnalysis}</div>
                    </div>
                `;
            }
            
            if (ecosystemAnalysis) {
                insightsHTML += `
                    <div class="insight-section">
                        <h4>🎯 Oportunidades Adicionales</h4>
                        <div style="white-space: pre-line;">${ecosystemAnalysis}</div>
                    </div>
                `;
            }
            
            additionalInsights.innerHTML = insightsHTML;
            additionalInsights.classList.remove('hidden');
        }
    },

    showLoading: () => {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('resultados').classList.add('hidden');
        
        // Animar pasos de loading
        const steps = [
            { delay: 0, step: 0 },
            { delay: 2000, step: 1 },
            { delay: 4000, step: 2 },
            { delay: 6000, step: 3 }
        ];
        
        steps.forEach(({ delay, step }) => {
            setTimeout(() => {
                Utils.updateLoadingStep(step + 1);
            }, delay);
        });
    },

    showDebugSection: () => {
        if (!AppState.debugMode) {
            document.getElementById('debugSection').classList.remove('hidden');
            AppState.debugMode = true;
        }
    }
};

// ===================== EXPORT MANAGER =====================
const ExportManager = {
    copyToClipboard: () => {
        if (AppState.productosDetectados.length === 0) {
            Utils.showStatus('No hay productos para copiar', 'warning');
            return;
        }
        
        const texto = ExportManager.generateTextReport();
        
        navigator.clipboard.writeText(texto).then(() => {
            Utils.showStatus('Análisis copiado al portapapeles', 'success');
        }).catch(() => {
            Utils.showStatus('Error al copiar al portapapeles', 'error');
        });
    },

    downloadText: () => {
        if (AppState.productosDetectados.length === 0) {
            Utils.showStatus('No hay productos para descargar', 'warning');
            return;
        }
        
        const texto = ExportManager.generateTextReport();
        ExportManager.downloadFile(texto, 'analisis-productos-ganadores.txt', 'text/plain');
        Utils.showStatus('Archivo TXT descargado', 'success');
    },

    exportCSV: () => {
        if (AppState.productosDetectados.length === 0) {
            Utils.showStatus('No hay productos para exportar', 'warning');
            return;
        }
        
        const csv = ExportManager.generateCSVReport();
        ExportManager.downloadFile(csv, 'productos-afiliados.csv', 'text/csv');
        Utils.showStatus('CSV exportado exitosamente', 'success');
    },

    generateTextReport: () => {
        let texto = '💰 ANÁLISIS EXPERTO DE PRODUCTOS GANADORES\n';
        texto += '🧠 MarketInsight Pro AFFILIATE EDITION\n';
        texto += `📅 Fecha: ${new Date().toLocaleDateString()}\n\n`;
        
        AppState.productosDetectados.forEach((producto, index) => {
            texto += `${index + 1}. ${producto.nombre}\n`;
            texto += `Score: ${producto.score || 0}/100\n`;
            
            if (producto.descripcion) texto += `📝 Descripción: ${producto.descripcion.substring(0, 200)}...\n`;
            if (producto.precio) texto += `💰 Precio: ${producto.precio}\n`;
            if (producto.comision) texto += `💵 Comisión: ${producto.comision}\n`;
            if (producto.painPoints) texto += `😰 Pain Points: ${producto.painPoints.substring(0, 150)}...\n`;
            if (producto.estrategia) texto += `🚀 Estrategia: ${producto.estrategia.substring(0, 150)}...\n`;
            
            texto += '\n---\n\n';
        });

        return texto;
    },

    generateCSVReport: () => {
        let csv = 'Producto,Score,Precio,Comision,CVR,EPC,ROI,Pain Points,Estrategia\n';
        
        AppState.productosDetectados.forEach(producto => {
            const campos = [
                `"${(producto.nombre || '').replace(/"/g, '""')}"`,
                producto.score || 0,
                `"${(producto.precio || 'N/A').replace(/"/g, '""')}"`,
                `"${(producto.comision || 'N/A').replace(/"/g, '""')}"`,
                `"${(producto.cvrEstimado || 'N/A').replace(/"/g, '""')}"`,
                `"${(producto.epcEstimado || 'N/A').replace(/"/g, '""')}"`,
                `"${(producto.roiReal || 'N/A').replace(/"/g, '""')}"`,
                `"${(producto.painPoints || '').replace(/"/g, '""').substring(0, 100)}..."`,
                `"${(producto.estrategia || '').replace(/"/g, '""').substring(0, 100)}..."`
            ];
            
            csv += campos.join(',') + '\n';
        });

        return csv;
    },

    downloadFile: (content, filename, type) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
};

// ===================== MAIN APP CONTROLLER =====================
const App = {
    init: () => {
        Utils.log('Iniciando MarketInsight Pro CORREGIDO...');
        
        // Cargar API key guardada
        const savedKey = localStorage.getItem(CONFIG.storage.apiKeyName);
        if (savedKey) {
            AppState.apiKey = savedKey;
            document.getElementById('apiKey').value = savedKey;
            Utils.showStatus('API Key cargada desde almacenamiento', 'success');
        }
        
        // Configurar event listeners
        App.setupEventListeners();
        
        // Cargar configuración guardada
        App.loadSavedConfig();
        
        Utils.log('Aplicación inicializada correctamente');
    },

    setupEventListeners: () => {
        // API management
        document.getElementById('saveBtn').addEventListener('click', App.saveApiKey);
        document.getElementById('testBtn').addEventListener('click', APIManager.testConnection);
        
        // Main functionality
        document.getElementById('generateBtn').addEventListener('click', App.generateAnalysis);
        
        // Export functions
        document.getElementById('copyBtn').addEventListener('click', ExportManager.copyToClipboard);
        document.getElementById('downloadBtn').addEventListener('click', ExportManager.downloadText);
        document.getElementById('downloadExcelBtn').addEventListener('click', ExportManager.exportCSV);
        document.getElementById('toggleDebugBtn').addEventListener('click', App.toggleDebug);
        
        // Option cards
        document.querySelectorAll('.option-card').forEach(card => {
            card.addEventListener('click', function(e) {
                if (e.target.type !== 'checkbox') {
                    const checkbox = this.querySelector('input[type="checkbox"]');
                    if (checkbox) {
                        checkbox.checked = !checkbox.checked;
                    }
                }
            });
        });
    },

    saveApiKey: () => {
        const key = document.getElementById('apiKey').value.trim();
        const validation = Utils.validateApiKey(key);
        
        if (!validation.valid) {
            Utils.showStatus(validation.message, 'error');
            return;
        }
        
        AppState.apiKey = key;
        localStorage.setItem(CONFIG.storage.apiKeyName, key);
        Utils.showStatus('API Key guardada correctamente', 'success');
        
        // Auto-probar la API después de guardar
        setTimeout(APIManager.testConnection, 500);
    },

    generateAnalysis: async () => {
        if (!AppState.apiKey) {
            Utils.showStatus('Configura tu API Key primero', 'error');
            return;
        }

        const nicho = document.getElementById('nicho').value.trim();
        const publico = document.getElementById('publico').value.trim();

        if (!nicho || !publico) {
            Utils.showStatus('Completa el nicho y público objetivo', 'error');
            return;
        }

        const config = App.gatherAnalysisConfig();

        const generateBtn = document.getElementById('generateBtn');
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<span class="btn-icon">🔄</span><span class="btn-text">Analizando...</span>';
        generateBtn.disabled = true;

        UIManager.showLoading();

        try {
            Utils.log('Iniciando análisis...', config);
            
            const prompt = PromptGenerator.generateAffilatePrompt(config);
            Utils.log('Prompt generado', { promptLength: prompt.length });
            
            const respuesta = await APIManager.callGemini(prompt);
            Utils.log('Respuesta recibida de API', { length: respuesta.length });
            
            const analysisData = ResponseProcessor.processAffilateResponse(respuesta);
            Utils.log('Datos procesados', { productos: analysisData.productos.length });
            
            AppState.productosDetectados = analysisData.productos;
            AppState.currentAnalysis = analysisData;
            
            UIManager.displayResults(analysisData);
            
        } catch (error) {
            document.getElementById('loading').classList.add('hidden');
            Utils.showStatus(`Error: ${error.message}`, 'error');
            Utils.log('Error en análisis', error, 'error');
            UIManager.showDebugSection();
            
        } finally {
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
        }
    },

    gatherAnalysisConfig: () => {
        return {
            nicho: document.getElementById('nicho').value.trim(),
            publico: document.getElementById('publico').value.trim(),
            rangoPrecios: document.getElementById('rangoPrecios').value,
            tipoProducto: document.getElementById('tipoProducto').value,
            canalPrincipal: document.getElementById('canalPrincipal').value,
            experiencia: document.getElementById('experiencia').value,
            keywords: document.getElementById('keywords').value.trim(),
            presupuestoAds: document.getElementById('presupuestoAds').value,
            roiObjetivo: document.getElementById('roiObjetivo').value,
            breakEvenTime: document.getElementById('breakEvenTime').value,
            tipoConversion: document.getElementById('tipoConversion').value,
            dispositivoTarget: document.getElementById('dispositivoTarget').value,
            mercadoGeo: document.getElementById('mercadoGeo').value,
            analyzeCompetition: document.getElementById('analyzeCompetition').checked,
            analyzeTrends: document.getElementById('analyzeTrends').checked,
            findAffiliates: document.getElementById('findAffiliates').checked,
            analyzeKeywords: document.getElementById('analyzeKeywords').checked,
            analyzeSeasonality: document.getElementById('analyzeSeasonality').checked,
            analyzeProfitability: document.getElementById('analyzeProfitability').checked,
            analyzeConversion: document.getElementById('analyzeConversion').checked,
            analyzeFinancial: document.getElementById('analyzeFinancial').checked,
            analyzeCompetitorIntel: document.getElementById('analyzeCompetitorIntel').checked,
            analyzeCustomerJourney: document.getElementById('analyzeCustomerJourney').checked,
            analyzeTrafficChannels: document.getElementById('analyzeTrafficChannels').checked,
            analyzeFunnels: document.getElementById('analyzeFunnels').checked
        };
    },

    loadSavedConfig: () => {
        const savedConfig = localStorage.getItem(CONFIG.storage.expertConfigName);
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                Object.keys(config).forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    if (field && config[fieldId]) {
                        field.value = config[fieldId];
                    }
                });
                Utils.log('Configuración cargada', config);
            } catch (error) {
                Utils.log('Error cargando configuración', error, 'error');
            }
        }
    },

    toggleDebug: () => {
        AppState.debugMode = !AppState.debugMode;
        const debugSection = document.getElementById('debugSection');
        const toggleBtn = document.getElementById('toggleDebugBtn');
        
        if (debugSection && toggleBtn) {
            if (AppState.debugMode) {
                debugSection.classList.remove('hidden');
                toggleBtn.innerHTML = '<span class="btn-icon">🔧</span>Ocultar Debug';
            } else {
                debugSection.classList.add('hidden');
                toggleBtn.innerHTML = '<span class="btn-icon">🔧</span>Debug';
            }
        }
    }
};

// ===================== INICIALIZACIÓN =====================
document.addEventListener('DOMContentLoaded', App.init);
// ===================== GENERADOR DE CONTENIDO VIRAL =====================
const ContentGenerator = {
    selectedTypes: new Set(),
    
    // Inicializar selector de tipos de contenido
    initTypeSelector: () => {
        document.querySelectorAll('.content-type-card').forEach(card => {
            card.addEventListener('click', function() {
                const type = this.dataset.type;
                
                if (this.classList.contains('selected')) {
                    this.classList.remove('selected');
                    ContentGenerator.selectedTypes.delete(type);
                } else {
                    this.classList.add('selected');
                    ContentGenerator.selectedTypes.add(type);
                }
                
                Utils.log(`Tipo de contenido ${type} ${this.classList.contains('selected') ? 'seleccionado' : 'deseleccionado'}`);
            });
        });
    },

    // Generar contenido viral
    generateContent: async () => {
        if (ContentGenerator.selectedTypes.size === 0) {
            Utils.showStatus('Selecciona al menos un tipo de contenido', 'warning');
            return;
        }

        if (!AppState.apiKey) {
            Utils.showStatus('Configura tu API Key primero', 'error');
            return;
        }

        const config = ContentGenerator.gatherContentConfig();
        const generateBtn = document.getElementById('generateContentBtn');
        const originalText = generateBtn.innerHTML;
        
        generateBtn.innerHTML = '<span class="btn-icon">🔄</span><span class="btn-text">Generando Contenido...</span>';
        generateBtn.disabled = true;

        try {
            Utils.log('Iniciando generación de contenido viral...', config);
            
            const prompt = ContentGenerator.buildContentPrompt(config);
            const respuesta = await APIManager.callGemini(prompt);
            
            const contentData = ContentGenerator.processContentResponse(respuesta);
            ContentGenerator.displayContent(contentData);
            
            Utils.showStatus(`✅ Contenido viral generado para ${ContentGenerator.selectedTypes.size} canales`, 'success');
            
        } catch (error) {
            Utils.showStatus(`Error generando contenido: ${error.message}`, 'error');
            Utils.log('Error en generación de contenido', error, 'error');
        } finally {
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
        }
    },

    // Recopilar configuración
    gatherContentConfig: () => {
        const nicho = document.getElementById('nicho').value.trim();
        const publico = document.getElementById('publico').value.trim();
        
        return {
            nicho,
            publico,
            tiposSeleccionados: Array.from(ContentGenerator.selectedTypes),
            salesAngle: document.getElementById('salesAngle').value,
            controversyLevel: document.getElementById('controversyLevel').value,
            powerWords: document.getElementById('powerWords').value.split(',').map(w => w.trim()),
            // Heredar del análisis principal
            tipoProducto: document.getElementById('tipoProducto').value,
            rangoPrecios: document.getElementById('rangoPrecios').value,
            canalPrincipal: document.getElementById('canalPrincipal').value
        };
    },

    // Construir prompt para contenido
    buildContentPrompt: (config) => {
        const { nicho, publico, tiposSeleccionados, salesAngle, controversyLevel, powerWords } = config;
        
        return `Actúa como EXPERTO COPYWRITER VIRAL con +10 años creando contenido que genera $1M+ en ventas.

MISIÓN: Crear contenido de ALTA CONVERSIÓN para el nicho "${nicho}" dirigido a "${publico}".

TIPOS DE CONTENIDO REQUERIDOS: ${tiposSeleccionados.join(', ')}

CONFIGURACIÓN:
- Ángulo de venta: ${salesAngle}
- Nivel controversia: ${controversyLevel}
- Palabras poder: ${powerWords.join(', ')}

FORMATO OBLIGATORIO para cada tipo:

=== TIPO: [NOMBRE_TIPO] ===

${tiposSeleccionados.includes('tiktok') ? `
**TIKTOK/REELS:**
HOOK (3 seg): [Frase que para el scroll]
AGITACIÓN (5-10 seg): [Problema + emoción]
REVELACIÓN (15-20 seg): [Solución + beneficio]
CTA (3-5 seg): [Llamada a acción urgente]
HASHTAGS: [5-10 hashtags estratégicos]
MÚSICA_SUGERIDA: [Trending audio type]
VIRAL_SCORE: [1-100]
` : ''}

${tiposSeleccionados.includes('email') ? `
**EMAIL MARKETING:**
SUBJECT_1: [Subject line con urgencia]
SUBJECT_2: [Subject line con curiosidad] 
SUBJECT_3: [Subject line con beneficio]
PREVIEW: [Preview text optimizado]
APERTURA: [Primer párrafo gancho]
CUERPO: [Email completo 150-200 palabras]
CTA_BUTTON: [Texto del botón]
PS: [Post scriptum irresistible]
OPEN_RATE_ESTIMADO: [%]
CLICK_RATE_ESTIMADO: [%]
` : ''}

${tiposSeleccionados.includes('facebook') ? `
**FACEBOOK ADS:**
HEADLINE_1: [Titular principal]
HEADLINE_2: [Variación headline]
PRIMARY_TEXT: [Texto principal del ad]
DESCRIPTION: [Descripción corta]
CTA_BUTTON: [Botón llamada acción]
AUDIENCE_INSIGHT: [A quién targetear]
BUDGET_SUGERIDO: [$XX diarios]
CTR_ESTIMADO: [%]
CPC_ESTIMADO: [$X.XX]
` : ''}

${tiposSeleccionados.includes('instagram') ? `
**INSTAGRAM:**
CAPTION_INICIO: [Hook primeras líneas]
CAPTION_COMPLETA: [Post completo con emojis]
HASHTAGS_PRIMARIOS: [10 hashtags principales]
HASHTAGS_NICHO: [10 hashtags específicos]
STORIES_IDEAS: [3 ideas para stories]
ENGAGEMENT_RATE_ESTIMADO: [%]
BEST_TIME_POST: [Hora optimal]
` : ''}

${tiposSeleccionados.includes('blog') ? `
**BLOG/SEO:**
TITULO_SEO: [Título optimizado con keyword]
META_DESCRIPCION: [Meta description 150-160 chars]
H2_PRINCIPALES: [5 subtítulos H2]
INTRODUCCION: [Párrafo gancho 50-80 palabras]
KEYWORDS_PRINCIPALES: [3 keywords primarias]
KEYWORDS_LSI: [5 keywords relacionadas]
WORD_COUNT_SUGERIDO: [XXX palabras]
DIFICULTAD_SEO: [Fácil/Medio/Difícil]
` : ''}

${tiposSeleccionados.includes('youtube') ? `
**YOUTUBE:**
TITULO_1: [Título viral opción 1]
TITULO_2: [Título viral opción 2] 
TITULO_3: [Título viral opción 3]
THUMBNAIL_DESCRIPTION: [Descripción del thumbnail]
SCRIPT_INTRO: [Primeros 15 segundos]
GANCHOS_VIDEO: [3 ganchos para mantener atención]
DESCRIPCION: [Descripción del video]
TAGS: [15 tags relevantes]
CTR_ESTIMADO: [%]
RETENTION_ESTIMADO: [%]
` : ''}

=== FIN TIPO ===

PRINCIPIOS VIRALES A APLICAR:
✅ Hook irresistible en primeros 3 segundos
✅ Crear curiosidad + urgencia
✅ Usar pattern interrupts
✅ Storytelling emocional
✅ Social proof integrado
✅ CTA específicas y claras
✅ Optimizado para cada plataforma

IMPORTANTE:
- Cada pieza debe ser ACCIONABLE inmediatamente
- Incluir métricas estimadas realistas
- Usar el lenguaje específico del ${publico}
- Aprovechar tendencias actuales del ${nicho}
- Balance perfecto entre viral y convertible

OBJETIVO: Contenido que genere engagement masivo Y conversiones reales.`;
    },

    // Procesar respuesta de contenido
    processContentResponse: (respuesta) => {
        Utils.log('Procesando respuesta de contenido...', { length: respuesta.length });
        
        const contenidoPorTipo = {};
        
        // Extraer contenido por tipo
        ContentGenerator.selectedTypes.forEach(tipo => {
            const regex = new RegExp(`=== TIPO: ${tipo.toUpperCase()} ===([\\s\\S]*?)(?==== FIN TIPO|=== TIPO:|$)`, 'i');
            const match = respuesta.match(regex);
            
            if (match) {
                contenidoPorTipo[tipo] = ContentGenerator.parseContentByType(tipo, match[1]);
                Utils.log(`Contenido extraído para ${tipo}`, contenidoPorTipo[tipo]);
            } else {
                // Fallback: buscar por nombre alternativo
                const alternativeRegex = new RegExp(`\\*\\*${tipo.toUpperCase()}[^:]*:\\*\\*([\\s\\S]*?)(?=\\*\\*[A-Z]+|$)`, 'i');
                const altMatch = respuesta.match(alternativeRegex);
                
                if (altMatch) {
                    contenidoPorTipo[tipo] = ContentGenerator.parseContentByType(tipo, altMatch[1]);
                    Utils.log(`Contenido extraído (alternativo) para ${tipo}`, contenidoPorTipo[tipo]);
                }
            }
        });
        
        return {
            contenidoPorTipo,
            respuestaCompleta: respuesta
        };
    },

    // Parsear contenido por tipo específico
    parseContentByType: (tipo, texto) => {
        const contenido = { tipo, items: [] };
        
        const extractField = (fieldName, text) => {
            const regex = new RegExp(`${fieldName}:\\s*([^\\n]+)`, 'i');
            const match = text.match(regex);
            return match ? match[1].trim() : '';
        };
        
        const extractMultilineField = (fieldName, text) => {
            const regex = new RegExp(`${fieldName}:\\s*([\\s\\S]*?)(?=[A-Z_]+:|$)`, 'i');
            const match = text.match(regex);
            return match ? match[1].trim() : '';
        };
        
        switch(tipo) {
            case 'tiktok':
                contenido.items.push({
                    nombre: 'Script TikTok/Reels',
                    hook: extractField('HOOK \\(3 seg\\)', texto),
                    agitacion: extractField('AGITACIÓN', texto),
                    revelacion: extractField('REVELACIÓN', texto),
                    cta: extractField('CTA', texto),
                    hashtags: extractField('HASHTAGS', texto),
                    musica: extractField('MÚSICA_SUGERIDA', texto),
                    score: extractField('VIRAL_SCORE', texto)
                });
                break;
                
            case 'email':
                contenido.items.push({
                    nombre: 'Email Marketing',
                    subject1: extractField('SUBJECT_1', texto),
                    subject2: extractField('SUBJECT_2', texto),
                    subject3: extractField('SUBJECT_3', texto),
                    preview: extractField('PREVIEW', texto),
                    apertura: extractField('APERTURA', texto),
                    cuerpo: extractMultilineField('CUERPO', texto),
                    ctaButton: extractField('CTA_BUTTON', texto),
                    ps: extractField('PS', texto),
                    openRate: extractField('OPEN_RATE_ESTIMADO', texto),
                    clickRate: extractField('CLICK_RATE_ESTIMADO', texto)
                });
                break;
                
            case 'facebook':
                contenido.items.push({
                    nombre: 'Facebook Ads',
                    headline1: extractField('HEADLINE_1', texto),
                    headline2: extractField('HEADLINE_2', texto),
                    primaryText: extractMultilineField('PRIMARY_TEXT', texto),
                    description: extractField('DESCRIPTION', texto),
                    ctaButton: extractField('CTA_BUTTON', texto),
                    audience: extractField('AUDIENCE_INSIGHT', texto),
                    budget: extractField('BUDGET_SUGERIDO', texto),
                    ctr: extractField('CTR_ESTIMADO', texto),
                    cpc: extractField('CPC_ESTIMADO', texto)
                });
                break;
                
            case 'instagram':
                contenido.items.push({
                    nombre: 'Instagram Post',
                    captionInicio: extractField('CAPTION_INICIO', texto),
                    captionCompleta: extractMultilineField('CAPTION_COMPLETA', texto),
                    hashtagsPrimarios: extractField('HASHTAGS_PRIMARIOS', texto),
                    hashtagsNicho: extractField('HASHTAGS_NICHO', texto),
                    storiesIdeas: extractField('STORIES_IDEAS', texto),
                    engagementRate: extractField('ENGAGEMENT_RATE_ESTIMADO', texto),
                    bestTime: extractField('BEST_TIME_POST', texto)
                });
                break;
                
            case 'blog':
                contenido.items.push({
                    nombre: 'Artículo de Blog',
                    tituloSeo: extractField('TITULO_SEO', texto),
                    metaDescripcion: extractField('META_DESCRIPCION', texto),
                    h2Principales: extractField('H2_PRINCIPALES', texto),
                    introduccion: extractMultilineField('INTRODUCCION', texto),
                    keywordsPrimarias: extractField('KEYWORDS_PRINCIPALES', texto),
                    keywordsLsi: extractField('KEYWORDS_LSI', texto),
                    wordCount: extractField('WORD_COUNT_SUGERIDO', texto),
                    dificultadSeo: extractField('DIFICULTAD_SEO', texto)
                });
                break;
                
            case 'youtube':
                contenido.items.push({
                    nombre: 'Video de YouTube',
                    titulo1: extractField('TITULO_1', texto),
                    titulo2: extractField('TITULO_2', texto),
                    titulo3: extractField('TITULO_3', texto),
                    thumbnailDesc: extractField('THUMBNAIL_DESCRIPTION', texto),
                    scriptIntro: extractMultilineField('SCRIPT_INTRO', texto),
                    ganchos: extractField('GANCHOS_VIDEO', texto),
                    descripcion: extractMultilineField('DESCRIPCION', texto),
                    tags: extractField('TAGS', texto),
                    ctrEstimado: extractField('CTR_ESTIMADO', texto),
                    retentionEstimado: extractField('RETENTION_ESTIMADO', texto)
                });
                break;
        }
        
        return contenido;
    },

    // Mostrar contenido generado
    displayContent: (contentData) => {
        const { contenidoPorTipo } = contentData;
        
        // Crear tabs
        const tabsContainer = document.getElementById('contentTabs');
        const displayContainer = document.getElementById('contentDisplay');
        
        tabsContainer.innerHTML = '';
        displayContainer.innerHTML = '';
        
        // Crear tab para cada tipo
        Object.keys(contenidoPorTipo).forEach((tipo, index) => {
            const tab = document.createElement('div');
            tab.className = `content-tab ${index === 0 ? 'active' : ''}`;
            tab.dataset.type = tipo;
            
            const icon = ContentGenerator.getTypeIcon(tipo);
            tab.innerHTML = `${icon} ${ContentGenerator.getTypeName(tipo)}`;
            
            tab.addEventListener('click', () => {
                document.querySelectorAll('.content-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                ContentGenerator.showContentForType(tipo, contenidoPorTipo[tipo]);
            });
            
            tabsContainer.appendChild(tab);
        });
        
        // Mostrar el primer tipo por defecto
        const firstType = Object.keys(contenidoPorTipo)[0];
        if (firstType) {
            ContentGenerator.showContentForType(firstType, contenidoPorTipo[firstType]);
        }
        
        // Mostrar sección de resultados
        document.getElementById('contentResults').classList.remove('hidden');
        
        // Scroll hacia resultados
        document.getElementById('contentResults').scrollIntoView({ behavior: 'smooth' });
    },

    // Mostrar contenido para un tipo específico
    showContentForType: (tipo, contenido) => {
        const displayContainer = document.getElementById('contentDisplay');
        displayContainer.innerHTML = '';
        
        if (!contenido || !contenido.items || contenido.items.length === 0) {
            displayContainer.innerHTML = `
                <div class="loading-content">
                    <p>No se pudo generar contenido para ${ContentGenerator.getTypeName(tipo)}</p>
                </div>
            `;
            return;
        }
        
        contenido.items.forEach(item => {
            const itemElement = ContentGenerator.createContentItemElement(tipo, item);
            displayContainer.appendChild(itemElement);
        });
    },

    // Crear elemento visual para cada item de contenido
    createContentItemElement: (tipo, item) => {
        const div = document.createElement('div');
        div.className = 'content-item';
        
        let html = `
            <div class="content-item-header">
                <div class="content-title">${item.nombre}</div>
                ${item.score ? `<div class="content-score">Score: ${item.score}</div>` : ''}
            </div>
        `;
        
        // Contenido específico por tipo
        switch(tipo) {
            case 'tiktok':
                html += `
                    <div class="content-text"><strong>🎯 Hook (3 seg):</strong><br>${item.hook}</div>
                    <div class="content-text"><strong>😱 Agitación:</strong><br>${item.agitacion}</div>
                    <div class="content-text"><strong>💡 Revelación:</strong><br>${item.revelacion}</div>
                    <div class="content-text"><strong>🚀 CTA:</strong><br>${item.cta}</div>
                    <div class="content-text"><strong>📱 Hashtags:</strong><br>${item.hashtags}</div>
                    ${item.musica ? `<div class="content-text"><strong>🎵 Música:</strong> ${item.musica}</div>` : ''}
                `;
                break;
                
            case 'email':
                html += `
                    <div class="content-text"><strong>📧 Subject Lines:</strong><br>
                        1. ${item.subject1}<br>
                        2. ${item.subject2}<br>
                        3. ${item.subject3}
                    </div>
                    <div class="content-text"><strong>👀 Preview:</strong><br>${item.preview}</div>
                    <div class="content-text"><strong>🎯 Apertura:</strong><br>${item.apertura}</div>
                    <div class="content-text"><strong>📝 Cuerpo:</strong><br>${item.cuerpo}</div>
                    <div class="content-text"><strong>🔥 CTA Button:</strong> ${item.ctaButton}</div>
                    <div class="content-text"><strong>💫 PS:</strong><br>${item.ps}</div>
                    <div class="content-metrics">
                        <div class="content-metric">
                            <span class="metric-label">Open Rate:</span>
                            <span class="metric-value">${item.openRate}</span>
                        </div>
                        <div class="content-metric">
                            <span class="metric-label">Click Rate:</span>
                            <span class="metric-value">${item.clickRate}</span>
                        </div>
                    </div>
                `;
                break;
                
            case 'facebook':
                html += `
                    <div class="content-text"><strong>🎯 Headlines:</strong><br>
                        1. ${item.headline1}<br>
                        2. ${item.headline2}
                    </div>
                    <div class="content-text"><strong>📝 Primary Text:</strong><br>${item.primaryText}</div>
                    <div class="content-text"><strong>📋 Description:</strong><br>${item.description}</div>
                    <div class="content-text"><strong>🔥 CTA Button:</strong> ${item.ctaButton}</div>
                    <div class="content-text"><strong>🎯 Audience:</strong><br>${item.audience}</div>
                    <div class="content-metrics">
                        <div class="content-metric">
                            <span class="metric-label">Budget:</span>
                            <span class="metric-value">${item.budget}</span>
                        </div>
                        <div class="content-metric">
                            <span class="metric-label">CTR:</span>
                            <span class="metric-value">${item.ctr}</span>
                        </div>
                        <div class="content-metric">
                            <span class="metric-label">CPC:</span>
                            <span class="metric-value">${item.cpc}</span>
                        </div>
                    </div>
                `;
                break;
                
            case 'instagram':
                html += `
                    <div class="content-text"><strong>🎯 Caption Hook:</strong><br>${item.captionInicio}</div>
                    <div class="content-text"><strong>📝 Caption Completa:</strong><br>${item.captionCompleta}</div>
                    <div class="content-text"><strong>#️⃣ Hashtags Primarios:</strong><br>${item.hashtagsPrimarios}</div>
                    <div class="content-text"><strong>#️⃣ Hashtags de Nicho:</strong><br>${item.hashtagsNicho}</div>
                    <div class="content-text"><strong>📱 Ideas para Stories:</strong><br>${item.storiesIdeas}</div>
                    <div class="content-metrics">
                        <div class="content-metric">
                            <span class="metric-label">Engagement Rate:</span>
                            <span class="metric-value">${item.engagementRate}</span>
                        </div>
                        <div class="content-metric">
                            <span class="metric-label">Mejor Hora:</span>
                            <span class="metric-value">${item.bestTime}</span>
                        </div>
                    </div>
                `;
                break;
                
            case 'blog':
                html += `
                    <div class="content-text"><strong>📝 Título SEO:</strong><br>${item.tituloSeo}</div>
                    <div class="content-text"><strong>📋 Meta Descripción:</strong><br>${item.metaDescripcion}</div>
                    <div class="content-text"><strong>📑 H2 Principales:</strong><br>${item.h2Principales}</div>
                    <div class="content-text"><strong>🎯 Introducción:</strong><br>${item.introduccion}</div>
                    <div class="content-text"><strong>🔑 Keywords Primarias:</strong> ${item.keywordsPrimarias}</div>
                    <div class="content-text"><strong>🔗 Keywords LSI:</strong> ${item.keywordsLsi}</div>
                    <div class="content-metrics">
                        <div class="content-metric">
                            <span class="metric-label">Palabras:</span>
                            <span class="metric-value">${item.wordCount}</span>
                        </div>
                        <div class="content-metric">
                            <span class="metric-label">Dificultad SEO:</span>
                            <span class="metric-value">${item.dificultadSeo}</span>
                        </div>
                    </div>
                `;
                break;
                
            case 'youtube':
                html += `
                    <div class="content-text"><strong>🎯 Títulos:</strong><br>
                        1. ${item.titulo1}<br>
                        2. ${item.titulo2}<br>
                        3. ${item.titulo3}
                    </div>
                    <div class="content-text"><strong>🖼️ Thumbnail:</strong><br>${item.thumbnailDesc}</div>
                    <div class="content-text"><strong>🎬 Script Intro:</strong><br>${item.scriptIntro}</div>
                    <div class="content-text"><strong>🎯 Ganchos:</strong><br>${item.ganchos}</div>
                    <div class="content-text"><strong>📝 Descripción:</strong><br>${item.descripcion}</div>
                    <div class="content-text"><strong>🏷️ Tags:</strong><br>${item.tags}</div>
                    <div class="content-metrics">
                        <div class="content-metric">
                            <span class="metric-label">CTR Estimado:</span>
                            <span class="metric-value">${item.ctrEstimado}</span>
                        </div>
                        <div class="content-metric">
                            <span class="metric-label">Retention:</span>
                            <span class="metric-value">${item.retentionEstimado}</span>
                        </div>
                    </div>
                `;
                break;
        }
        
        div.innerHTML = html;
        return div;
    },

    // Utilidades
    getTypeIcon: (tipo) => {
        const icons = {
            tiktok: '📱',
            email: '📧',
            facebook: '📊',
            instagram: '📸',
            blog: '✍️',
            youtube: '🎥'
        };
        return icons[tipo] || '📄';
    },

    getTypeName: (tipo) => {
        const names = {
            tiktok: 'TikTok/Reels',
            email: 'Email Marketing',
            facebook: 'Facebook Ads',
            instagram: 'Instagram',
            blog: 'Blog/SEO',
            youtube: 'YouTube'
        };
        return names[tipo] || tipo;
    }
};

// ===================== GENERADOR DE AVATAR ULTRA-ESPECÍFICO =====================
const AvatarGenerator = {
    // Generar avatar completo
    generateAvatar: async () => {
        if (!AppState.apiKey) {
            Utils.showStatus('Configura tu API Key primero', 'error');
            return;
        }

        const config = AvatarGenerator.gatherAvatarConfig();
        const generateBtn = document.getElementById('generateAvatarBtn');
        const originalText = generateBtn.innerHTML;
        
        generateBtn.innerHTML = '<span class="btn-icon">🔄</span><span class="btn-text">Creando Avatar...</span>';
        generateBtn.disabled = true;

        try {
            Utils.log('Iniciando generación de avatar...', config);
            
            const prompt = AvatarGenerator.buildAvatarPrompt(config);
            const respuesta = await APIManager.callGemini(prompt);
            
            const avatarData = AvatarGenerator.processAvatarResponse(respuesta);
            AvatarGenerator.displayAvatar(avatarData);
            
            Utils.showStatus('✅ Avatar ultra-específico creado exitosamente', 'success');
            
        } catch (error) {
            Utils.showStatus(`Error creando avatar: ${error.message}`, 'error');
            Utils.log('Error en generación de avatar', error, 'error');
        } finally {
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
        }
    },

    // Recopilar configuración del avatar
    gatherAvatarConfig: () => {
        const nicho = document.getElementById('nicho').value.trim();
        const publico = document.getElementById('publico').value.trim();
        
        return {
            nicho,
            publico,
            gender: document.getElementById('avatarGender').value,
            age: document.getElementById('avatarAge').value,
            income: document.getElementById('avatarIncome').value,
            family: document.getElementById('avatarFamily').value,
            mainProblem: document.getElementById('avatarMainProblem').value.trim(),
            mainDesire: document.getElementById('avatarMainDesire').value.trim(),
            // Heredar del análisis principal
            tipoProducto: document.getElementById('tipoProducto').value,
            canalPrincipal: document.getElementById('canalPrincipal').value
        };
    },

    // Construir prompt para avatar
    buildAvatarPrompt: (config) => {
        const { nicho, publico, gender, age, income, family, mainProblem, mainDesire } = config;
        
        return `Actúa como PSICÓLOGO EXPERTO EN MARKETING con doctorado en comportamiento del consumidor y 15+ años analizando audiencias de ${nicho}.

MISIÓN: Crear un AVATAR ULTRA-ESPECÍFICO y psicológicamente preciso para "${publico}" en el nicho "${nicho}".

DATOS DEMOGRÁFICOS:
- Género: ${gender}
- Edad: ${age}
- Ingresos: ${income}
- Familia: ${family}
- Problema principal: ${mainProblem}
- Deseo principal: ${mainDesire}

FORMATO OBLIGATORIO (usar exactamente estos marcadores):

=== AVATAR ULTRA-ESPECÍFICO ===

PERFIL_DEMOGRAFICO:
- Nombre típico: [Nombre y apellido representativo]
- Edad exacta: [XX años]
- Género: [Específico]
- Ubicación: [Ciudad/región típica]
- Estado civil: [Detallado]
- Hijos: [Número y edades si aplica]
- Ocupación: [Trabajo específico]
- Ingresos anuales: [$XX,XXX]
- Educación: [Nivel específico]

PSICOGRAFIA_PROFUNDA:
- Personalidad (Big 5): [Calificación 1-10 en cada trait]
- Valores principales: [3-5 valores core]
- Miedos profundos: [5 miedos específicos relacionados al nicho]
- Aspiraciones secretas: [3 sueños que no comparte]
- Vergüenzas ocultas: [Qué le da pena admitir]
- Autoestima: [Nivel y en qué áreas]

PAIN_POINTS_ESPECIFICOS:
- Dolor #1: [Problema más urgente + intensidad emocional]
- Dolor #2: [Segundo problema + cómo lo afecta diariamente]
- Dolor #3: [Tercer problema + impacto en relaciones]
- Frustración primaria: [Qué más le molesta del problema]
- Consecuencias temidas: [Qué pasará si no se resuelve]

TRIGGERS_EMOCIONALES:
- Miedo dominante: [Miedo que más lo mueve a actuar]
- Deseo ardiente: [Lo que más quiere lograr]
- Palabras que lo emocionan: [5-7 palabras específicas]
- Palabras que lo repelen: [5 palabras que evitar]
- Momentos de vulnerabilidad: [Cuándo está más receptivo]

COMPORTAMIENTO_DIGITAL:
- Plataformas favoritas: [Dónde pasa más tiempo + horas]
- Horarios online: [Cuándo está más activo]
- Tipo de contenido que consume: [Específico al nicho]
- Influencers que sigue: [Tipos de personas]
- Dispositivo principal: [Mobile/Desktop + contexto de uso]
- Hábitos de compra online: [Cómo y cuándo compra]

OBJECIONES_COMPRA:
- Objeción #1: [Primera barrera mental + razón profunda]
- Objeción #2: [Segunda barrera + contexto]
- Objeción #3: [Tercera barrera + traumas pasados]
- Precio: [Percepción del valor + sensibilidad]
- Confianza: [Qué necesita para confiar]
- Timing: [Por qué "no es el momento"]

MOMENTO_COMPRA_IDEAL:
- Situación gatillo: [Qué evento lo hace actuar]
- Estado emocional: [Cómo se siente cuando compra]
- Día de la semana: [Cuándo más probable]
- Hora del día: [Momento específico]
- Contexto físico: [Dónde está cuando decide]
- Influencias externas: [Quién/qué lo influye]

LENGUAJE_TRIBAL:
- Jerga que usa: [Palabras específicas del grupo]
- Emojis favoritos: [Los que más usa]
- Tono preferido: [Formal/casual/amigable/directo]
- Referencias culturales: [Qué entiende]
- Humor: [Qué tipo le gusta]
- Modo de expresión: [Cómo habla de sus problemas]

PATRON_COMUNICACION:
- Cómo articula el problema: [Sus palabras exactas]
- Qué busca en Google: [Queries específicas]
- Cómo habla de soluciones: [Su lenguaje]
- A quién le pregunta: [Círculo de confianza]
- Qué información necesita: [Para tomar decisión]
- Formato preferido: [Video/texto/imagen/audio]

ENTORNO_SOCIAL:
- Círculo interno: [Familia/amigos cercanos]
- Presión social: [Expectativas del entorno]
- Status deseado: [Cómo quiere ser visto]
- Grupo de pertenencia: [Tribu/comunidad]
- Influencia social: [Quién respeta]
- Comparaciones constantes: [Con quién se compara]

RUTINA_DIARIA:
- 6:00 AM: [Actividad típica]
- 9:00 AM: [Qué hace]
- 12:00 PM: [Almuerzo/pausa]
- 3:00 PM: [Tarde]
- 6:00 PM: [Fin del trabajo]
- 9:00 PM: [Noche]
- 11:00 PM: [Antes de dormir]

GATILLOS_ACCION:
- Qué lo hace clickear: [Específico]
- Qué lo hace abrir emails: [Subject lines que funcionan]
- Qué lo hace compartir: [Contenido viral para él]
- Qué lo hace comprar: [Momento y contexto exacto]
- Qué lo hace recomendar: [Cuándo se vuelve fan]

=== FIN AVATAR ===

IMPORTANTE:
✅ Ser ULTRA-ESPECÍFICO en cada detalle
✅ Basado en psicología real del ${age} ${gender}
✅ Lenguaje exacto que usa esta persona
✅ Triggers emocionales probados en ${nicho}
✅ Patrones de comportamiento verificables
✅ Todo debe ser ACCIONABLE para marketing

OBJETIVO: Avatar tan preciso que cualquier marketer puede hablarle directamente a esta persona y convertir al 3-5x más que con audiencias genéricas.`;
    },

    // Procesar respuesta del avatar
    processAvatarResponse: (respuesta) => {
        Utils.log('Procesando respuesta de avatar...', { length: respuesta.length });
        
        const avatar = {};
        
        // Extractores para cada sección
        const extractors = [
            { section: 'perfilDemografico', regex: /PERFIL_DEMOGRAFICO:([\s\S]*?)(?=PSICOGRAFIA_PROFUNDA:|$)/i },
            { section: 'psicografia', regex: /PSICOGRAFIA_PROFUNDA:([\s\S]*?)(?=PAIN_POINTS_ESPECIFICOS:|$)/i },
            { section: 'painPoints', regex: /PAIN_POINTS_ESPECIFICOS:([\s\S]*?)(?=TRIGGERS_EMOCIONALES:|$)/i },
            { section: 'triggers', regex: /TRIGGERS_EMOCIONALES:([\s\S]*?)(?=COMPORTAMIENTO_DIGITAL:|$)/i },
            { section: 'comportamientoDigital', regex: /COMPORTAMIENTO_DIGITAL:([\s\S]*?)(?=OBJECIONES_COMPRA:|$)/i },
            { section: 'objeciones', regex: /OBJECIONES_COMPRA:([\s\S]*?)(?=MOMENTO_COMPRA_IDEAL:|$)/i },
            { section: 'momentoCompra', regex: /MOMENTO_COMPRA_IDEAL:([\s\S]*?)(?=LENGUAJE_TRIBAL:|$)/i },
            { section: 'lenguajeTribal', regex: /LENGUAJE_TRIBAL:([\s\S]*?)(?=PATRON_COMUNICACION:|$)/i },
            { section: 'patronComunicacion', regex: /PATRON_COMUNICACION:([\s\S]*?)(?=ENTORNO_SOCIAL:|$)/i },
            { section: 'entornoSocial', regex: /ENTORNO_SOCIAL:([\s\S]*?)(?=RUTINA_DIARIA:|$)/i },
            { section: 'rutinaDiaria', regex: /RUTINA_DIARIA:([\s\S]*?)(?=GATILLOS_ACCION:|$)/i },
            { section: 'gatillosAccion', regex: /GATILLOS_ACCION:([\s\S]*?)(?==== FIN AVATAR|$)/i }
        ];
        
        extractors.forEach(({ section, regex }) => {
            const match = respuesta.match(regex);
            if (match) {
                avatar[section] = match[1].trim();
            }
        });
        
        return {
            avatar,
            respuestaCompleta: respuesta
        };
    },

    // Mostrar avatar generado
    displayAvatar: (avatarData) => {
        const { avatar } = avatarData;
        const displayContainer = document.getElementById('avatarDisplay');
        
        displayContainer.innerHTML = '';
        
        // Crear secciones del avatar
        const secciones = [
            { key: 'perfilDemografico', title: '👤 Perfil Demográfico', icon: '👤' },
            { key: 'psicografia', title: '🧠 Psicografía Profunda', icon: '🧠' },
            { key: 'painPoints', title: '😰 Pain Points Específicos', icon: '😰' },
            { key: 'triggers', title: '🎯 Triggers Emocionales', icon: '🎯' },
            { key: 'comportamientoDigital', title: '📱 Comportamiento Digital', icon: '📱' },
            { key: 'objeciones', title: '🚫 Objeciones de Compra', icon: '🚫' },
            { key: 'momentoCompra', title: '⏰ Momento de Compra Ideal', icon: '⏰' },
            { key: 'lenguajeTribal', title: '💬 Lenguaje Tribal', icon: '💬' },
            { key: 'patronComunicacion', title: '📢 Patrón de Comunicación', icon: '📢' },
            { key: 'entornoSocial', title: '👥 Entorno Social', icon: '👥' },
            { key: 'rutinaDiaria', title: '⏰ Rutina Diaria', icon: '⏰' },
            { key: 'gatillosAccion', title: '🚀 Gatillos de Acción', icon: '🚀' }
        ];
        
        secciones.forEach(seccion => {
            if (avatar[seccion.key]) {
                const sectionElement = document.createElement('div');
                sectionElement.className = 'avatar-section-item';
                sectionElement.innerHTML = `
                    <div class="avatar-section-title">
                        ${seccion.icon} ${seccion.title}
                    </div>
                    <div class="avatar-section-content">
                        ${avatar[seccion.key].replace(/\n/g, '<br>')}
                    </div>
                `;
                displayContainer.appendChild(sectionElement);
            }
        });
        
        // Mostrar sección de resultados
        document.getElementById('avatarResults').classList.remove('hidden');
        
        // Scroll hacia resultados
        document.getElementById('avatarResults').scrollIntoView({ behavior: 'smooth' });
    }
};

// ===================== EXPORTACIÓN DE CONTENIDO Y AVATAR =====================
const ContentExporter = {
    // Copiar contenido
    copyContent: () => {
        const contentDisplay = document.getElementById('contentDisplay');
        if (!contentDisplay || contentDisplay.innerHTML === '') {
            Utils.showStatus('No hay contenido para copiar', 'warning');
            return;
        }
        
        const texto = ContentExporter.generateContentReport();
        
        navigator.clipboard.writeText(texto).then(() => {
            Utils.showStatus('Contenido copiado al portapapeles', 'success');
        }).catch(() => {
            Utils.showStatus('Error al copiar contenido', 'error');
        });
    },

    // Copiar avatar
    copyAvatar: () => {
        const avatarDisplay = document.getElementById('avatarDisplay');
        if (!avatarDisplay || avatarDisplay.innerHTML === '') {
            Utils.showStatus('No hay avatar para copiar', 'warning');
            return;
        }
        
        const texto = ContentExporter.generateAvatarReport();
        
        navigator.clipboard.writeText(texto).then(() => {
            Utils.showStatus('Avatar copiado al portapapeles', 'success');
        }).catch(() => {
            Utils.showStatus('Error al copiar avatar', 'error');
        });
    },

    // Generar reporte de contenido
    generateContentReport: () => {
        let texto = '🎯 CONTENIDO VIRAL GENERADO\n';
        texto += '🧠 MarketInsight Pro - Generador de Contenido\n';
        texto += `📅 Fecha: ${new Date().toLocaleDateString()}\n\n`;
        
        // Obtener contenido de todas las tabs
        const tabs = document.querySelectorAll('.content-tab');
        tabs.forEach(tab => {
            const tipo = tab.dataset.type;
            const nombre = ContentGenerator.getTypeName(tipo);
            
            texto += `\n=== ${nombre.toUpperCase()} ===\n`;
            
            // Simular click para obtener contenido
            tab.click();
            const contentItems = document.querySelectorAll('.content-item');
            
            contentItems.forEach(item => {
                const contentTexts = item.querySelectorAll('.content-text');
                contentTexts.forEach(contentText => {
                    texto += contentText.textContent + '\n';
                });
                texto += '\n';
            });
        });
        
        return texto;
    },

    // Generar reporte de avatar
    generateAvatarReport: () => {
        let texto = '🧠 AVATAR ULTRA-ESPECÍFICO\n';
        texto += '🧠 MarketInsight Pro - Generador de Avatar\n';
        texto += `📅 Fecha: ${new Date().toLocaleDateString()}\n\n`;
        
        const avatarSections = document.querySelectorAll('.avatar-section-item');
        avatarSections.forEach(section => {
            const title = section.querySelector('.avatar-section-title').textContent;
            const content = section.querySelector('.avatar-section-content').textContent;
            
            texto += `\n${title}\n`;
            texto += content + '\n\n';
        });
        
        return texto;
    },

    // Descargar contenido
    downloadContent: () => {
        const texto = ContentExporter.generateContentReport();
        ExportManager.downloadFile(texto, 'contenido-viral-generado.txt', 'text/plain');
        Utils.showStatus('Contenido descargado', 'success');
    },

    // Descargar avatar
    downloadAvatar: () => {
        const texto = ContentExporter.generateAvatarReport();
        ExportManager.downloadFile(texto, 'avatar-ultra-especifico.txt', 'text/plain');
        Utils.showStatus('Avatar descargado', 'success');
    }
};

// ===================== INICIALIZACIÓN DE NUEVAS FUNCIONALIDADES =====================
// Agregar al final del App.init() existente:
const originalAppInit = App.init;
App.init = () => {
    originalAppInit();
    
    // Inicializar nuevas funcionalidades
    ContentGenerator.initTypeSelector();
    
    // Event listeners para contenido viral
    document.getElementById('generateContentBtn').addEventListener('click', ContentGenerator.generateContent);
    document.getElementById('copyContentBtn').addEventListener('click', ContentExporter.copyContent);
    document.getElementById('downloadContentBtn').addEventListener('click', ContentExporter.downloadContent);
    
    // Event listeners para avatar
    document.getElementById('generateAvatarBtn').addEventListener('click', AvatarGenerator.generateAvatar);
    document.getElementById('copyAvatarBtn').addEventListener('click', ContentExporter.copyAvatar);
    document.getElementById('downloadAvatarBtn').addEventListener('click', ContentExporter.downloadAvatar);
    
    Utils.log('Funcionalidades de Fase 1 inicializadas: Contenido Viral + Avatar Ultra-Específico');
};
// ===================== SOLUCIÓN SIMPLE QUE SÍ FUNCIONA =====================
// AGREGAR AL FINAL DEL SCRIPT.JS

// Variables globales para las nuevas funcionalidades
let selectedContentTypes = new Set();

// Función para inicializar las cards de contenido
function initContentCards() {
    console.log('Inicializando cards de contenido...');
    
    // Buscar todas las cards de tipo de contenido
    const cards = document.querySelectorAll('.content-type-card');
    
    if (cards.length === 0) {
        console.log('No se encontraron cards de contenido');
        return;
    }
    
    console.log(`Encontradas ${cards.length} cards de contenido`);
    
    // Agregar event listener a cada card
    cards.forEach((card, index) => {
        console.log(`Configurando card ${index + 1}:`, card.dataset.type);
        
        card.addEventListener('click', function(e) {
            console.log('Click en card:', this.dataset.type);
            
            const type = this.dataset.type;
            
            if (this.classList.contains('selected')) {
                // Deseleccionar
                this.classList.remove('selected');
                selectedContentTypes.delete(type);
                console.log(`${type} deseleccionado`);
            } else {
                // Seleccionar
                this.classList.add('selected');
                selectedContentTypes.add(type);
                console.log(`${type} seleccionado`);
            }
            
            console.log('Tipos seleccionados:', Array.from(selectedContentTypes));
        });
        
        // Agregar estilos de hover
        card.style.cursor = 'pointer';
        card.style.transition = 'all 0.3s ease';
    });
}

// Función para generar contenido viral (simplificada)
async function generateViralContent() {
    console.log('Generando contenido viral...');
    
    if (selectedContentTypes.size === 0) {
        alert('⚠️ Selecciona al menos un tipo de contenido');
        return;
    }
    
    if (!AppState.apiKey) {
        alert('⚠️ Configura tu API Key primero');
        return;
    }
    
    // Obtener datos del formulario
    const nicho = document.getElementById('nicho').value.trim();
    const publico = document.getElementById('publico').value.trim();
    
    if (!nicho || !publico) {
        alert('⚠️ Completa el nicho y público objetivo');
        return;
    }
    
    const btn = document.getElementById('generateContentBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '🔄 Generando...';
    btn.disabled = true;
    
    try {
        // Crear prompt simple
        const tiposSeleccionados = Array.from(selectedContentTypes);
        const prompt = `Actúa como EXPERTO COPYWRITER VIRAL con +10 años creando contenido que genera $1M+ en ventas.

MISIÓN: Crear contenido de ALTA CONVERSIÓN para el nicho "${nicho}" dirigido a "${publico}".

TIPOS DE CONTENIDO REQUERIDOS: ${tiposSeleccionados.join(', ')}

Para cada tipo seleccionado, genera contenido específico y optimizado:

${tiposSeleccionados.includes('tiktok') ? `
=== TIKTOK/REELS ===
HOOK (3 seg): [Frase que para el scroll]
PROBLEMA: [Agitar el problema]
SOLUCIÓN: [Revelar beneficio]
CTA: [Llamada a acción urgente]
HASHTAGS: [10 hashtags estratégicos]
SCORE VIRAL: [80-95]/100
` : ''}

${tiposSeleccionados.includes('email') ? `
=== EMAIL MARKETING ===
SUBJECT LINE 1: [Urgencia]
SUBJECT LINE 2: [Curiosidad]
SUBJECT LINE 3: [Beneficio]
EMAIL BODY: [150-200 palabras con gancho emocional]
CTA: [Botón específico]
OPEN RATE ESTIMADO: [25-40]%
` : ''}

${tiposSeleccionados.includes('facebook') ? `
=== FACEBOOK ADS ===
HEADLINE: [Titular que convierte]
PRIMARY TEXT: [Texto principal 125 palabras max]
CTA BUTTON: [Acción específica]
TARGETING: [Audiencia ideal]
CPC ESTIMADO: [$0.50-$2.00]
` : ''}

${tiposSeleccionados.includes('instagram') ? `
=== INSTAGRAM ===
CAPTION HOOK: [Primeras líneas irresistibles]
CAPTION COMPLETA: [Post con emojis, 200 palabras max]
HASHTAGS: [15 hashtags estratégicos]
STORIES IDEAS: [3 ideas para stories]
ENGAGEMENT ESTIMADO: [5-12]%
` : ''}

${tiposSeleccionados.includes('blog') ? `
=== BLOG/SEO ===
TÍTULO SEO: [Optimizado con keyword]
META DESCRIPCIÓN: [150-160 caracteres]
INTRODUCCIÓN: [80 palabras gancho]
H2 SUBTÍTULOS: [5 subtítulos principales]
KEYWORDS: [3 palabras clave primarias]
` : ''}

${tiposSeleccionados.includes('youtube') ? `
=== YOUTUBE ===
TÍTULO 1: [Opción viral]
TÍTULO 2: [Opción alternativa]
THUMBNAIL: [Descripción del thumbnail ideal]
SCRIPT INTRO: [Primeros 15 segundos]
DESCRIPCIÓN: [Para la descripción del video]
TAGS: [10 tags relevantes]
` : ''}

IMPORTANTE:
- Contenido ACCIONABLE inmediatamente
- Lenguaje específico del "${publico}"
- Balance perfecto entre viral y convertible
- Métricas realistas incluidas`;

        // Llamar a la API
        const respuesta = await APIManager.callGemini(prompt);
        
        // Mostrar resultados
        mostrarResultadosContenido(respuesta, tiposSeleccionados);
        
        Utils.showStatus(`✅ Contenido generado para ${tiposSeleccionados.length} tipos`, 'success');
        
    } catch (error) {
        console.error('Error:', error);
        Utils.showStatus(`❌ Error: ${error.message}`, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Función para generar avatar
async function generateAvatar() {
    console.log('Generando avatar...');
    
    if (!AppState.apiKey) {
        alert('⚠️ Configura tu API Key primero');
        return;
    }
    
    const nicho = document.getElementById('nicho').value.trim();
    const publico = document.getElementById('publico').value.trim();
    
    if (!nicho || !publico) {
        alert('⚠️ Completa el nicho y público objetivo');
        return;
    }
    
    const btn = document.getElementById('generateAvatarBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '🔄 Creando...';
    btn.disabled = true;
    
    try {
        const prompt = `Actúa como PSICÓLOGO EXPERTO EN MARKETING con doctorado en comportamiento del consumidor.

MISIÓN: Crear un AVATAR ULTRA-ESPECÍFICO para "${publico}" en el nicho "${nicho}".

Crea un perfil psicológico completo con:

=== PERFIL DEMOGRÁFICO ===
Nombre: [Nombre típico]
Edad: [XX años específicos]
Ubicación: [Ciudad/región]
Trabajo: [Ocupación específica]
Ingresos: [$XX,XXX anuales]
Familia: [Situación detallada]

=== PSICOLOGÍA PROFUNDA ===
Miedos principales: [3 miedos específicos del nicho]
Deseos secretos: [3 aspiraciones que no comparte]
Frustraciones diarias: [Problemas específicos que vive]
Valores importantes: [Qué más valora en la vida]

=== COMPORTAMIENTO DIGITAL ===
Plataformas favoritas: [Dónde pasa tiempo online]
Horarios activos: [Cuándo está más conectado]
Contenido que consume: [Qué tipo de posts/videos ve]
Influencers que sigue: [Tipos de personas que admira]

=== PROCESO DE COMPRA ===
Primer pensamiento: [Qué piensa cuando ve el problema]
Objeciones principales: [Por qué NO compraría]
Momento ideal compra: [Cuándo está más receptivo]
Palabras que lo motivan: [Lenguaje que lo emociona]
Palabras que lo alejan: [Términos que evitar]

=== TRIGGERS EMOCIONALES ===
Gatillo de miedo: [Qué lo asusta más del problema]
Gatillo de deseo: [Qué lo motiva más a actuar]
Prueba social necesaria: [Qué evidencia necesita]
Urgencia que funciona: [Qué tipo de presión responde]

Haz este avatar TAN específico que cualquier marketer pueda hablarle directamente y convertir 3-5x más.`;

        const respuesta = await APIManager.callGemini(prompt);
        mostrarResultadosAvatar(respuesta);
        
        Utils.showStatus('✅ Avatar creado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        Utils.showStatus(`❌ Error: ${error.message}`, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Función para mostrar resultados de contenido
function mostrarResultadosContenido(respuesta, tipos) {
    // Crear o actualizar sección de resultados
    let resultsSection = document.getElementById('contentResults');
    if (!resultsSection) {
        resultsSection = document.createElement('div');
        resultsSection.id = 'contentResults';
        resultsSection.className = 'content-results';
        document.querySelector('.main-content').appendChild(resultsSection);
    }
    
    resultsSection.innerHTML = `
        <h2>🎯 Contenido Viral Generado</h2>
        <div class="content-display">
            <div class="content-item">
                <div class="content-title">Contenido para: ${tipos.join(', ')}</div>
                <div class="content-text">
                    <pre style="white-space: pre-wrap; font-family: inherit; line-height: 1.6; background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px;">${respuesta}</pre>
                </div>
            </div>
        </div>
        <div class="export-buttons" style="text-align: center; margin-top: 20px;">
            <button class="btn btn-secondary" onclick="copiarContenido()">📋 Copiar</button>
            <button class="btn btn-secondary" onclick="descargarContenido()">📄 Descargar</button>
        </div>
    `;
    
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
    
    // Guardar para exportar
    window.lastContentGenerated = respuesta;
}

// Función para mostrar resultados de avatar
function mostrarResultadosAvatar(respuesta) {
    let resultsSection = document.getElementById('avatarResults');
    if (!resultsSection) {
        resultsSection = document.createElement('div');
        resultsSection.id = 'avatarResults';
        resultsSection.className = 'avatar-results';
        document.querySelector('.main-content').appendChild(resultsSection);
    }
    
    resultsSection.innerHTML = `
        <h2>🧠 Avatar Ultra-Específico</h2>
        <div class="avatar-display">
            <div class="avatar-item">
                <div class="avatar-title">Perfil Completo del Cliente Ideal</div>
                <div class="avatar-content">
                    <pre style="white-space: pre-wrap; font-family: inherit; line-height: 1.6; background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px;">${respuesta}</pre>
                </div>
            </div>
        </div>
        <div class="export-buttons" style="text-align: center; margin-top: 20px;">
            <button class="btn btn-secondary" onclick="copiarAvatar()">📋 Copiar</button>
            <button class="btn btn-secondary" onclick="descargarAvatar()">📄 Descargar</button>
        </div>
    `;
    
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
    
    window.lastAvatarGenerated = respuesta;
}

// Funciones de exportación
function copiarContenido() {
    if (window.lastContentGenerated) {
        navigator.clipboard.writeText(window.lastContentGenerated);
        Utils.showStatus('✅ Contenido copiado', 'success');
    }
}

function descargarContenido() {
    if (window.lastContentGenerated) {
        const blob = new Blob([window.lastContentGenerated], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'contenido-viral.txt';
        a.click();
        URL.revokeObjectURL(url);
        Utils.showStatus('✅ Contenido descargado', 'success');
    }
}

function copiarAvatar() {
    if (window.lastAvatarGenerated) {
        navigator.clipboard.writeText(window.lastAvatarGenerated);
        Utils.showStatus('✅ Avatar copiado', 'success');
    }
}

function descargarAvatar() {
    if (window.lastAvatarGenerated) {
        const blob = new Blob([window.lastAvatarGenerated], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'avatar-especifico.txt';
        a.click();
        URL.revokeObjectURL(url);
        Utils.showStatus('✅ Avatar descargado', 'success');
    }
}

// Inicialización automática
function initNewFeatures() {
    console.log('Inicializando nuevas funcionalidades...');
    
    // Inicializar cards de contenido
    setTimeout(initContentCards, 100);
    
    // Configurar botones
    const contentBtn = document.getElementById('generateContentBtn');
    const avatarBtn = document.getElementById('generateAvatarBtn');
    
    if (contentBtn) {
        contentBtn.onclick = generateViralContent;
        console.log('Botón contenido configurado');
    }
    
    if (avatarBtn) {
        avatarBtn.onclick = generateAvatar;
        console.log('Botón avatar configurado');
    }
    
    console.log('Nuevas funcionalidades inicializadas correctamente');
}

// Ejecutar cuando esté todo listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNewFeatures);
} else {
    initNewFeatures();
}

// También ejecutar después de un delay para asegurar que todo esté cargado
setTimeout(initNewFeatures, 500);
setTimeout(initNewFeatures, 1500);
// ===================== AUTO-GENERADOR DE AVATARES MÚLTIPLES =====================
// Agregar al final del script.js

// Función para generar múltiples avatares automáticamente
async function generateMultipleAvatars() {
    console.log('Generando múltiples avatares automáticamente...');
    
    if (!AppState.apiKey) {
        alert('⚠️ Configura tu API Key primero');
        return;
    }
    
    // Recopilar todos los datos del análisis principal
    const analysisData = {
        nicho: document.getElementById('nicho').value.trim(),
        publico: document.getElementById('publico').value.trim(),
        tipoProducto: document.getElementById('tipoProducto').value,
        rangoPrecios: document.getElementById('rangoPrecios').value,
        canalPrincipal: document.getElementById('canalPrincipal').value,
        presupuestoAds: document.getElementById('presupuestoAds').value,
        roiObjetivo: document.getElementById('roiObjetivo').value,
        mercadoGeo: document.getElementById('mercadoGeo').value,
        dispositivoTarget: document.getElementById('dispositivoTarget').value,
        experiencia: document.getElementById('experiencia').value
    };
    
    if (!analysisData.nicho || !analysisData.publico) {
        alert('⚠️ Completa el nicho y público objetivo primero');
        return;
    }
    
    const btn = document.getElementById('generateMultipleAvatarsBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '🤖 Generando 5 Avatares...';
    btn.disabled = true;
    
    try {
        const prompt = createMultipleAvatarsPrompt(analysisData);
        const respuesta = await APIManager.callGemini(prompt);
        displayMultipleAvatars(respuesta);
        
        Utils.showStatus('✅ 5 avatares generados automáticamente', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        Utils.showStatus(`❌ Error: ${error.message}`, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Crear prompt para múltiples avatares
function createMultipleAvatarsPrompt(data) {
    const { nicho, publico, tipoProducto, rangoPrecios, canalPrincipal, presupuestoAds, roiObjetivo, mercadoGeo, dispositivoTarget } = data;
    
    return `Actúa como EXPERTO EN SEGMENTACIÓN DE AUDIENCIAS con 15+ años creando avatares ultra-específicos.

MISIÓN: Crear 5 AVATARES ÚNICOS Y ESPECÍFICOS para el nicho "${nicho}" basándote en el análisis completo.

DATOS DEL ANÁLISIS PRINCIPAL:
- Nicho: ${nicho}
- Público base: ${publico}
- Tipo producto: ${tipoProducto}
- Rango precios: ${rangoPrecios}
- Canal principal: ${canalPrincipal}
- Presupuesto ads: $${presupuestoAds}+ mensual
- ROI objetivo: ${roiObjetivo}x
- Mercado: ${mercadoGeo}
- Dispositivo: ${dispositivoTarget}

CREAR 5 AVATARES DIFERENTES que representen segmentos únicos del mismo nicho:

=== AVATAR 1: LA PROFESIONAL OCUPADA ===
NOMBRE: [Nombre específico]
EDAD: [28-35 años]
PERFIL: [Profesional con poco tiempo]
INGRESOS: [$40K-80K anuales]
PROBLEMA: [Específico al nicho + falta de tiempo]
DESEO: [Resultados rápidos sin comprometer carrera]
MIEDO: [Fracasar públicamente + no verse profesional]
HORARIO_ONLINE: [Mañana temprano + noche]
PLATAFORMAS: [LinkedIn + Instagram + YouTube]
GATILLO_COMPRA: [Domingo noche planificando semana]
OBJECIONES: ["No tengo tiempo" + "Es muy caro"]
LENGUAJE: [Jerga profesional + eficiencia]

=== AVATAR 2: LA MAMÁ RECUPERANDO FORMA ===
NOMBRE: [Nombre maternal]
EDAD: [25-35 años]
PERFIL: [Madre que quiere recuperar su cuerpo]
INGRESOS: [$25K-50K familiares]
PROBLEMA: [Específico post-embarazo + autoestima]
DESEO: [Verse como antes + tener energía para hijos]
MIEDO: [Nunca recuperar su cuerpo + juicio de otras madres]
HORARIO_ONLINE: [Temprano mañana + noche cuando duermen hijos]
PLATAFORMAS: [Instagram + Facebook + Pinterest]
GATILLO_COMPRA: [Momentos de frustración con espejos]
OBJECIONES: ["Presupuesto familiar" + "Tiempo con hijos"]
LENGUAJE: [Emocional + motivacional + familiar]

=== AVATAR 3: EL EMPRENDEDOR SEDENTARIO ===
NOMBRE: [Nombre emprendedor]
EDAD: [30-40 años]
PERFIL: [Trabaja desde casa, vida sedentaria]
INGRESOS: [$50K-100K variables]
PROBLEMA: [Dolor espalda + falta ejercicio + estrés]
DESEO: [Productividad + energía + imagen éxito]
MIEDO: [Problemas salud + imagen no profesional]
HORARIO_ONLINE: [Todo el día + noches]
PLATAFORMAS: [YouTube + LinkedIn + Podcasts]
GATILLO_COMPRA: [Después de calls estresantes]
OBJECIONES: ["No funciona" + "Muy complicado"]
LENGUAJE: [ROI + eficiencia + resultados]

=== AVATAR 4: LA JOVEN UNIVERSITARIA ===
NOMBRE: [Nombre generacional Z]
EDAD: [18-25 años]
PERFIL: [Estudiante + trabajo parcial]
INGRESOS: [$15K-25K anuales]
PROBLEMA: [Inseguridad + comparación social + presupuesto]
DESEO: [Verse bien en fotos + confianza + likes]
MIEDO: [No encajar + ser juzgada + gastar dinero padres]
HORARIO_ONLINE: [Tardes + noches + fines semana]
PLATAFORMAS: [TikTok + Instagram + Snapchat]
GATILLO_COMPRA: [Antes de eventos sociales]
OBJECIONES: ["Muy caro" + "No tengo experiencia"]
LENGUAJE: [Trends + emojis + casual + authentic]

=== AVATAR 5: EL PROFESIONAL MADURO ===
NOMBRE: [Nombre experiencia]
EDAD: [40-50 años]
PERFIL: [Ejecutivo senior + responsabilidades]
INGRESOS: [$80K-150K anuales]
PROBLEMA: [Salud deteriorándose + imagen ejecutiva]
DESEO: [Mantenerse competitivo + salud + longevidad]
MIEDO: [Problemas salud graves + verse mayor]
HORARIO_ONLINE: [Mañanas + commute + fines semana]
PLATAFORMAS: [LinkedIn + Facebook + Email]
GATILLO_COMPRA: [Después revisiones médicas]
OBJECIONES: ["Falta tiempo" + "Ya probé todo"]
LENGUAJE: [Científico + profesional + resultados]

Para cada avatar, incluir:
- MOMENTO_IDEAL_VENTA: [Día + hora + contexto específico]
- PRECIO_IDEAL: [Rango específico para este avatar]
- CANAL_PREFERIDO: [Mejor canal para este segmento]
- TIPO_CONTENIDO: [Qué contenido consume]
- INFLUENCERS_SIGUE: [Tipo de personas que admira]

OBJETIVO: 5 avatares TAN específicos que puedas crear campañas ultra-dirigidas para cada uno con mensajes completamente diferentes.`;
}

// Mostrar múltiples avatares
function displayMultipleAvatars(respuesta) {
    let resultsSection = document.getElementById('multipleAvatarsResults');
    if (!resultsSection) {
        resultsSection = document.createElement('div');
        resultsSection.id = 'multipleAvatarsResults';
        resultsSection.className = 'multiple-avatars-results';
        document.querySelector('.main-content').appendChild(resultsSection);
    }
    
    // Procesar y separar los avatares
    const avatares = extraerAvatares(respuesta);
    
    let html = `
        <h2>🤖 5 Avatares Generados Automáticamente</h2>
        <div class="avatars-grid">
    `;
    
    avatares.forEach((avatar, index) => {
        html += `
            <div class="avatar-card">
                <div class="avatar-header">
                    <h3>${avatar.titulo}</h3>
                    <span class="avatar-number">#${index + 1}</span>
                </div>
                <div class="avatar-content">
                    <pre style="white-space: pre-wrap; font-family: inherit; line-height: 1.5; font-size: 0.9rem;">${avatar.contenido}</pre>
                </div>
                <div class="avatar-actions">
                    <button class="btn btn-small" onclick="copiarAvatar('${index}')">📋 Copiar</button>
                    <button class="btn btn-small" onclick="usarParaCampaña('${index}')">🚀 Usar</button>
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="export-buttons" style="text-align: center; margin-top: 20px;">
            <button class="btn btn-secondary" onclick="copiarTodosAvatares()">📋 Copiar Todos</button>
            <button class="btn btn-secondary" onclick="descargarTodosAvatares()">📄 Descargar</button>
            <button class="btn btn-secondary" onclick="generateMultipleAvatars()">🔄 Regenerar</button>
        </div>
    `;
    
    resultsSection.innerHTML = html;
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
    
    // Guardar para uso posterior
    window.lastMultipleAvatars = respuesta;
    window.processedAvatars = avatares;
}

// Extraer avatares individuales de la respuesta
function extraerAvatares(respuesta) {
    const avatares = [];
    const regex = /=== AVATAR \d+: ([^=]+) ===([\s\S]*?)(?==== AVATAR \d+:|$)/g;
    let match;
    
    while ((match = regex.exec(respuesta)) !== null) {
        avatares.push({
            titulo: match[1].trim(),
            contenido: match[2].trim()
        });
    }
    
    // Si no encuentra el formato, dividir por secciones
    if (avatares.length === 0) {
        const sections = respuesta.split(/AVATAR \d+:/);
        sections.forEach((section, index) => {
            if (section.trim() && index > 0) {
                avatares.push({
                    titulo: `Avatar ${index}`,
                    contenido: section.trim()
                });
            }
        });
    }
    
    return avatares;
}

// Funciones de utilidad
function copiarAvatar(index) {
    if (window.processedAvatars && window.processedAvatars[index]) {
        const avatar = window.processedAvatars[index];
        navigator.clipboard.writeText(`${avatar.titulo}\n\n${avatar.contenido}`);
        Utils.showStatus(`✅ Avatar ${parseInt(index) + 1} copiado`, 'success');
    }
}

function usarParaCampaña(index) {
    Utils.showStatus(`🚀 Función "Usar para Campaña" en desarrollo`, 'info');
    // Aquí se puede implementar auto-llenar formularios de ads
}

function copiarTodosAvatares() {
    if (window.lastMultipleAvatars) {
        navigator.clipboard.writeText(window.lastMultipleAvatars);
        Utils.showStatus('✅ Todos los avatares copiados', 'success');
    }
}

function descargarTodosAvatares() {
    if (window.lastMultipleAvatars) {
        const texto = `🤖 5 AVATARES AUTO-GENERADOS\n📅 ${new Date().toLocaleDateString()}\n\n${window.lastMultipleAvatars}`;
        const blob = new Blob([texto], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '5-avatares-automaticos.txt';
        a.click();
        URL.revokeObjectURL(url);
        Utils.showStatus('✅ Avatares descargados', 'success');
    }
}

// Agregar el botón al HTML (insertar después del botón avatar normal)
function addMultipleAvatarsButton() {
    const avatarBtn = document.getElementById('generateAvatarBtn');
    if (avatarBtn && !document.getElementById('generateMultipleAvatarsBtn')) {
        const newBtn = document.createElement('button');
        newBtn.className = 'btn btn-avatar';
        newBtn.id = 'generateMultipleAvatarsBtn';
        newBtn.style.marginTop = '15px';
        newBtn.innerHTML = '<span class="btn-icon">🤖</span><span class="btn-text">Generar 5 Avatares Automáticamente</span>';
        newBtn.onclick = generateMultipleAvatars;
        
        avatarBtn.parentNode.appendChild(newBtn);
    }
}

// CSS adicional para los avatares múltiples
const multipleAvatarsCSS = `
.multiple-avatars-results {
    background: rgba(45, 55, 72, 0.5);
    border-radius: 15px;
    padding: 30px;
    margin: 25px 0;
    border: 1px solid #4a5568;
}

.avatars-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.avatar-card {
    background: rgba(26, 32, 44, 0.7);
    border-radius: 12px;
    padding: 20px;
    border-left: 4px solid #8a2be2;
    transition: transform 0.3s ease;
}

.avatar-card:hover {
    transform: translateY(-3px);
}

.avatar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.avatar-header h3 {
    color: #9333ea;
    margin: 0;
    font-size: 1.1rem;
}

.avatar-number {
    background: #8a2be2;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: bold;
}

.avatar-content {
    background: rgba(0,0,0,0.3);
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 15px;
    max-height: 200px;
    overflow-y: auto;
}

.avatar-actions {
    display: flex;
    gap: 10px;
}

.btn-small {
    padding: 6px 12px;
    font-size: 0.8rem;
}

@media (max-width: 768px) {
    .avatars-grid {
        grid-template-columns: 1fr;
    }
}
`;

// Agregar CSS
function addMultipleAvatarsCSS() {
    if (!document.getElementById('multipleAvatarsCSS')) {
        const style = document.createElement('style');
        style.id = 'multipleAvatarsCSS';
        style.textContent = multipleAvatarsCSS;
        document.head.appendChild(style);
    }
}

// Inicializar auto-generador de avatares
function initMultipleAvatarsGenerator() {
    addMultipleAvatarsCSS();
    setTimeout(addMultipleAvatarsButton, 1000);
    console.log('Auto-generador de avatares múltiples inicializado');
}

// Ejecutar inicialización
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMultipleAvatarsGenerator);
} else {
    initMultipleAvatarsGenerator();
}

setTimeout(initMultipleAvatarsGenerator, 1000);


// ===================== FIX VARIABLES GLOBALES =====================
// Agregar al FINAL del script.js

// INTERCEPTAR Y GUARDAR DATOS CUANDO SE GENEREN
const originalMostrarResultadosAvatar = window.mostrarResultadosAvatar || function(){};
const originalMostrarResultados = UIManager.displayResults || function(){};

// Override para avatares
window.mostrarResultadosAvatar = function(respuesta) {
    // Guardar en variable global
    window.lastAvatarGenerated = respuesta;
    
    // Llamar función original
    if (typeof originalMostrarResultadosAvatar === 'function') {
        originalMostrarResultadosAvatar(respuesta);
    }
    
    // Actualizar botón
    setTimeout(updateFunnelExportButton, 500);
    console.log('✅ Avatar guardado globalmente');
};

// Override para productos
if (typeof UIManager !== 'undefined' && UIManager.displayResults) {
    const originalDisplayResults = UIManager.displayResults;
    UIManager.displayResults = function(analysisData) {
        // Guardar productos globalmente
        if (analysisData && analysisData.productos) {
            if (typeof AppState === 'undefined') {
                window.AppState = {};
            }
            AppState.productosDetectados = analysisData.productos;
            console.log('✅ Productos guardados globalmente:', analysisData.productos.length);
        }
        
        // Llamar función original
        originalDisplayResults.call(this, analysisData);
        
        // Actualizar botón
        setTimeout(updateFunnelExportButton, 500);
    };
}

// VERIFICAR Y ACTUALIZAR BOTÓN PERIÓDICAMENTE
setInterval(function() {
    const avatarExists = !!window.lastAvatarGenerated;
    const productExists = !!(typeof AppState !== 'undefined' && AppState.productosDetectados && AppState.productosDetectados.length > 0);
    
    if ((avatarExists || productExists) && updateFunnelExportButton) {
        updateFunnelExportButton();
    }
}, 2000);

// AUTODETECTAR DATOS EXISTENTES AL CARGAR
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        // Verificar si hay datos ya mostrados en pantalla
        const avatarResults = document.getElementById('avatarResults');
        const productResults = document.getElementById('resultados');
        
        if (avatarResults && !avatarResults.classList.contains('hidden')) {
            console.log('🔍 Avatar detectado en pantalla, buscando datos...');
            // Intentar extraer datos del DOM
            const avatarContent = avatarResults.querySelector('.avatar-content, .avatar-display');
            if (avatarContent && avatarContent.textContent) {
                window.lastAvatarGenerated = avatarContent.textContent;
                console.log('✅ Avatar recuperado del DOM');
            }
        }
        
        if (productResults && !productResults.classList.contains('hidden')) {
            console.log('🔍 Productos detectados en pantalla, simulando datos...');
            // Simular al menos un producto si no existe AppState
            if (typeof AppState === 'undefined') {
                window.AppState = {};
            }
            if (!AppState.productosDetectados) {
                AppState.productosDetectados = [{
                    nombre: "Producto detectado",
                    precio: "$50-200",
                    descripcion: "Producto de fitness y bienestar"
                }];
                console.log('✅ Productos simulados');
            }
        }
        
        // Forzar actualización final
        if (updateFunnelExportButton) {
            updateFunnelExportButton();
        }
    }, 1000);
});

console.log('🔧 Fix de variables globales cargado');


// ===================== TREND PREDICTOR INTEGRATION =====================
// AGREGAR AL FINAL DE TU script.js EXISTENTE

const TrendPredictorIntegration = {
    // Abrir Trend Predictor con datos actuales
    openTrendPredictor: () => {
        console.log('🔮 Abriendo Trend Predictor...');
        
        // Recopilar datos actuales del formulario
        const currentConfig = {
            nicho: document.getElementById('nicho')?.value?.trim() || '',
            mercado: document.getElementById('mercadoGeo')?.value || 'LATAM',
            tipoProducto: document.getElementById('tipoProducto')?.value || 'digital',
            canalPrincipal: document.getElementById('canalPrincipal')?.value || 'paid',
            presupuestoAds: document.getElementById('presupuestoAds')?.value || '1000',
            experiencia: document.getElementById('experiencia')?.value || 'intermedio'
        };
        
        // Validar que tenga nicho
        if (!currentConfig.nicho) {
            alert('⚠️ Ingresa un nicho primero');
            return;
        }
        
        // Guardar configuración en localStorage para que Trend Predictor lo use
        localStorage.setItem('main_nicho', currentConfig.nicho);
        localStorage.setItem('main_mercado', currentConfig.mercado);
        localStorage.setItem('main_config', JSON.stringify(currentConfig));
        
        // Construir URL con parámetros
        const params = new URLSearchParams({
            nicho: currentConfig.nicho,
            mercado: currentConfig.mercado,
            source: 'marketinsight-pro'
        });
        
        // Abrir Trend Predictor en nueva ventana/tab
        const url = `trend-predictor.html?${params.toString()}`;
        const newWindow = window.open(url, '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes');
        
        // Verificar si se abrió correctamente
        if (newWindow) {
            console.log('✅ Trend Predictor abierto exitosamente');
        } else {
            alert('⚠️ Permitir pop-ups para abrir Trend Predictor');
        }
        
        // Mostrar feedback al usuario
        if (typeof Utils !== 'undefined' && Utils.showStatus) {
            Utils.showStatus(`🔮 Trend Predictor abierto para: ${currentConfig.nicho}`, 'success');
        }
        
        console.log('🔮 Configuración enviada:', currentConfig);
    },
    
    // Verificar si se puede usar Trend Predictor
    canUseTrendPredictor: () => {
        const apiKey = localStorage.getItem('gemini_api_key');
        const nicho = document.getElementById('nicho')?.value?.trim();
        
        return !!(apiKey && nicho);
    },
    
    // Actualizar estado del botón dinámicamente
    updateTrendButton: () => {
        const btn = document.getElementById('openTrendPredictorBtn');
        if (!btn) return;
        
        const canUse = TrendPredictorIntegration.canUseTrendPredictor();
        const nicho = document.getElementById('nicho')?.value?.trim() || '';
        const apiKey = localStorage.getItem('gemini_api_key');
        
        if (!apiKey) {
            btn.style.opacity = '0.6';
            btn.disabled = true;
            btn.innerHTML = '🔮 Trend Predictor (Configura API Key primero)';
        } else if (!nicho) {
            btn.style.opacity = '0.6';
            btn.disabled = true;
            btn.innerHTML = '🔮 Trend Predictor (Ingresa nicho primero)';
        } else {
            btn.style.opacity = '1';
            btn.disabled = false;
            btn.innerHTML = `🔮 Predecir Tendencias: ${nicho}`;
        }
    }
};

// AGREGAR BOTÓN AL HTML PRINCIPAL
function addTrendPredictorButton() {
    // Buscar dónde insertar el botón (después del botón principal de generar)
    const generateBtn = document.getElementById('generateBtn');
    if (!generateBtn) {
        // Si no encuentra el botón, reintentar en 1 segundo
        setTimeout(addTrendPredictorButton, 1000);
        return;
    }
    
    // Verificar si ya existe el botón para no duplicarlo
    if (document.getElementById('openTrendPredictorBtn')) {
        return;
    }
    
    console.log('📋 Agregando botón Trend Predictor...');
    
    // Crear botón de Trend Predictor
    const trendBtn = document.createElement('button');
    trendBtn.id = 'openTrendPredictorBtn';
    trendBtn.className = 'btn btn-primary'; // Usar las mismas clases que tu botón principal
    
    // Estilos específicos para diferenciarlo
    trendBtn.style.cssText = `
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
        color: white !important;
        padding: 15px 30px !important;
        border: none !important;
        border-radius: 10px !important;
        font-size: 1.1rem !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        transition: all 0.3s ease !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 10px !important;
        margin: 15px auto !important;
        box-shadow: 0 6px 20px rgba(255, 107, 107, 0.3) !important;
        max-width: 400px !important;
        width: 100% !important;
    `;
    
    // Texto inicial del botón
    trendBtn.innerHTML = '🔮 Trend Predictor (Configura nicho primero)';
    
    // Evento click
    trendBtn.onclick = TrendPredictorIntegration.openTrendPredictor;
    
    // Insertar botón después del botón principal
    generateBtn.parentNode.insertBefore(trendBtn, generateBtn.nextSibling);
    
    // Actualizar estado inicial del botón
    TrendPredictorIntegration.updateTrendButton();
    
    console.log('✅ Botón Trend Predictor agregado exitosamente');
}

// CONFIGURAR LISTENERS PARA AUTO-ACTUALIZAR EL BOTÓN
function setupTrendPredictorListeners() {
    // Campos que afectan el estado del botón
    const fieldsToWatch = ['nicho', 'mercadoGeo'];
    
    fieldsToWatch.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            // Escuchar cambios en tiempo real
            field.addEventListener('input', TrendPredictorIntegration.updateTrendButton);
            field.addEventListener('change', TrendPredictorIntegration.updateTrendButton);
            field.addEventListener('keyup', TrendPredictorIntegration.updateTrendButton);
        }
    });
    
    // También actualizar periódicamente por si cambia la API key
    setInterval(TrendPredictorIntegration.updateTrendButton, 3000);
    
    console.log('👂 Listeners configurados para Trend Predictor');
}

// AGREGAR ESTILOS CSS PARA EL BOTÓN
function addTrendPredictorStyles() {
    // Verificar si ya existen los estilos
    if (document.getElementById('trendPredictorStyles')) {
        return;
    }
    
    const styles = `
        #openTrendPredictorBtn:hover:not(:disabled) {
            background: linear-gradient(135deg, #ee5a52 0%, #dc2626 100%) !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4) !important;
        }

        #openTrendPredictorBtn:disabled {
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%) !important;
            cursor: not-allowed !important;
            transform: none !important;
            box-shadow: 0 4px 15px rgba(107, 114, 128, 0.2) !important;
        }

        @media (max-width: 768px) {
            #openTrendPredictorBtn {
                font-size: 1rem !important;
                padding: 12px 20px !important;
                margin: 10px auto !important;
            }
        }

        /* Animación de aparición */
        #openTrendPredictorBtn {
            animation: trendButtonAppear 0.5s ease-out;
        }

        @keyframes trendButtonAppear {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.id = 'trendPredictorStyles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    console.log('🎨 Estilos Trend Predictor agregados');
}

// INICIALIZACIÓN PRINCIPAL
function initTrendPredictorIntegration() {
    console.log('🔮 Inicializando integración Trend Predictor...');
    
    // Agregar estilos CSS
    addTrendPredictorStyles();
    
    // Agregar botón (con delay para asegurar que el DOM esté listo)
    setTimeout(addTrendPredictorButton, 1000);
    
    // Configurar listeners (con delay mayor para asegurar que todo esté cargado)
    setTimeout(setupTrendPredictorListeners, 1500);
    
    // Verificar si hay datos que vienen del Trend Predictor
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('from') === 'trend-predictor') {
        console.log('🔄 Usuario regresando desde Trend Predictor');
        // Aquí podrías mostrar un mensaje o hacer algo específico
        if (typeof Utils !== 'undefined' && Utils.showStatus) {
            Utils.showStatus('🔮 Datos de tendencias disponibles para análisis', 'info');
        }
    }
    
    console.log('✅ Integración Trend Predictor inicializada completamente');
}

// EJECUCIÓN DE LA INICIALIZACIÓN
// Múltiples métodos para asegurar que se ejecute

// Método 1: Si el DOM está cargando
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTrendPredictorIntegration);
} else {
    // Método 2: Si el DOM ya está cargado
    initTrendPredictorIntegration();
}

// Método 3: Timeout de respaldo para asegurar ejecución
setTimeout(initTrendPredictorIntegration, 2000);

// Método 4: Respaldo adicional
setTimeout(() => {
    // Solo ejecutar si no se ha agregado el botón aún
    if (!document.getElementById('openTrendPredictorBtn')) {
        console.log('🔄 Ejecutando respaldo de inicialización...');
        initTrendPredictorIntegration();
    }
}, 4000);

// FUNCIÓN PARA DEBUG/TROUBLESHOOTING
function debugTrendPredictor() {
    console.log('🔧 DEBUG TREND PREDICTOR:');
    console.log('- API Key:', !!localStorage.getItem('gemini_api_key'));
    console.log('- Nicho campo:', document.getElementById('nicho')?.value || 'NO ENCONTRADO');
    console.log('- Botón existe:', !!document.getElementById('openTrendPredictorBtn'));
    console.log('- Estilos cargados:', !!document.getElementById('trendPredictorStyles'));
    
    const btn = document.getElementById('openTrendPredictorBtn');
    if (btn) {
        console.log('- Botón habilitado:', !btn.disabled);
        console.log('- Texto del botón:', btn.textContent);
    }
}

// Exponer función de debug globalmente para troubleshooting
window.debugTrendPredictor = debugTrendPredictor;

console.log('🔮 Trend Predictor Integration cargado. Usa debugTrendPredictor() para troubleshooting.');

// ===================== FIN TREND PREDICTOR INTEGRATION =====================

// ===================== OFFER VALIDATOR CON IA =====================
const OfferValidator = {
    // Validar ofertas usando inteligencia de Gemini
    validateOffer: async (producto, nicho) => {
        if (!AppState.apiKey) {
            alert('⚠️ Configura tu API Key primero');
            return;
        }

        const prompt = `Actúa como SUPER AFILIADO con acceso a TODAS las redes de afiliados.

MISIÓN: Validar la oferta "${producto}" en el nicho "${nicho}" como si tuvieras acceso real a ClickBank, ShareASale, CJ, MaxBounty.

PRODUCTO A VALIDAR: ${producto}

Basándote en tu conocimiento del mercado actual y patrones históricos, proporciona:

=== VALIDACIÓN DE OFERTA ===
NOMBRE_REAL: [Nombre exacto en networks]
EXISTE_EN_NETWORKS: [SI/NO]
NETWORKS_DISPONIBLES: [Lista de networks donde está]

CLICKBANK_METRICS:
- Gravity Score: [1-500 realista]
- Avg $/sale: [$XX.XX]
- Initial $/sale: [$XX.XX]
- Recurring: [SI/NO]
- Refund Rate: [X-XX%]
- Vendor Reputation: [1-10]

PERFORMANCE_DATA:
- EPC Promedio: [$X.XX]
- Conversion Rate: [X.X%]
- Cookie Duration: [XX días]
- Mobile Optimized: [SI/NO]
- Países Top: [Lista de 5]

COMPETITION_ANALYSIS:
- Saturación: [BAJA/MEDIA/ALTA]
- Afiliados Activos: [Estimado]
- Ad Spend Promedio: [$XXX-$XXXX/día]
- Creativos Ganadores: [3 ángulos principales]

AFFILIATE_REQUIREMENTS:
- Approval: [INSTANT/MANUAL/STRICT]
- Restricciones Geo: [Lista países]
- Restricciones Tráfico: [Tipos prohibidos]
- Minimum Sales: [Si aplica]

PROFIT_CALCULATOR:
Con $1000 de presupuesto:
- CPC Estimado: [$X.XX]
- Clicks Esperados: [XXX]
- Conversiones Est: [XX]
- Revenue Est: [$XXXX]
- Profit Est: [$XXX]
- ROI: [XX%]

VERDICT: [WINNER/PROMETEDOR/SATURADO/EVITAR]
RAZÓN: [Explicación breve]

TIPS_SECRETOS:
[3 tips que solo sabrían super afiliados sobre esta oferta]
=== FIN VALIDACIÓN ===

IMPORTANTE: Usa datos REALISTAS basados en el mercado actual 2024-2025.`;

        try {
            const response = await APIManager.callGemini(prompt);
            return OfferValidator.parseValidationResponse(response);
        } catch (error) {
            console.error('Error validando oferta:', error);
            return null;
        }
    },

    // Busca la función parseValidationResponse en tu script.js
// Y reemplázala con esta versión mejorada:

parseValidationResponse: (response) => {
    // Extraer datos de la respuesta
    const validation = {
        exists: response.includes('EXISTE_EN_NETWORKS: SI'),
        gravity: response.match(/Gravity Score: \[?(\d+)\]?/i)?.[1] || '0',
        epc: response.match(/EPC Promedio: \[\$?([\d.]+)\]/i)?.[1] || '0',
        conversionRate: response.match(/Conversion Rate: \[?([\d.]+)%?\]/i)?.[1] || '0',
        // FIX: Mejorar la extracción del veredicto
        verdict: response.match(/VERDICT:\s*\[?(\w+)\]?/i)?.[1] || 
                response.match(/VEREDICTO:\s*\[?(\w+)\]?/i)?.[1] || 
                response.includes('WINNER') ? 'WINNER' :
                response.includes('PROMETEDOR') ? 'PROMETEDOR' :
                response.includes('SATURADO') ? 'SATURADO' :
                response.includes('EVITAR') ? 'EVITAR' : 'UNKNOWN',
        competitionLevel: response.match(/Saturación:\s*\[?(\w+)\]?/i)?.[1] || 'MEDIO',
        networks: response.match(/NETWORKS_DISPONIBLES:\s*\[([^\]]+)\]/i)?.[1] || '',
        profitEstimate: response.match(/Profit Est:\s*\[\$?([\d,]+)\]/i)?.[1] || '0',
        tips: response.match(/TIPS_SECRETOS:\s*\n([^=]+)/i)?.[1] || ''
    };
    
    return validation;
},

// También actualiza el CSS del veredicto en displayValidation:
displayValidation: (validation, productName, productCard) => {
    // Verificar si ya existe una validación para este producto
    const existingValidation = productCard.querySelector('.offer-validation');
    if (existingValidation) {
        existingValidation.remove();
    }
    
    // Mapear colores para cada veredicto
    const verdictClass = {
        'WINNER': 'winner',
        'PROMETEDOR': 'prometedor',
        'SATURADO': 'saturado',
        'EVITAR': 'evitar',
        'UNKNOWN': 'unknown'
    }[validation.verdict] || 'unknown';
    
    const validationHtml = `
        <div class="offer-validation ${verdictClass}">
            <h3>🔍 Validación: ${productName}</h3>
            <div class="validation-grid">
                <div class="metric">
                    <span class="label">Gravity:</span>
                    <span class="value ${validation.gravity > 50 ? 'good' : validation.gravity > 20 ? 'medium' : 'bad'}">${validation.gravity}</span>
                </div>
                <div class="metric">
                    <span class="label">EPC:</span>
                    <span class="value ${validation.epc > 2 ? 'good' : validation.epc > 1 ? 'medium' : 'bad'}">$${validation.epc}</span>
                </div>
                <div class="metric">
                    <span class="label">CR:</span>
                    <span class="value ${validation.conversionRate > 3 ? 'good' : validation.conversionRate > 1 ? 'medium' : 'bad'}">${validation.conversionRate}%</span>
                </div>
                <div class="metric">
                    <span class="label">Profit Est:</span>
                    <span class="value">$${validation.profitEstimate}</span>
                </div>
            </div>
            <div class="verdict ${verdictClass}">
                Veredicto: ${validation.verdict}
                ${validation.verdict === 'WINNER' ? ' 🏆' : ''}
                ${validation.verdict === 'EVITAR' ? ' ⚠️' : ''}
            </div>
            ${validation.tips ? `
            <div class="tips">
                <h4>💡 Tips Secretos:</h4>
                <div class="tips-content">
                    ${validation.tips.split(/\d+\.\s*/).filter(tip => tip.trim()).map((tip, index) => `
                        <div class="tip-item">
                            <span class="tip-number">${index + 1}</span>
                            <span class="tip-text">${tip.trim()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;
    // Crear elemento y agregarlo AL PRODUCTO, no al body
    const validationDiv = document.createElement('div');
    validationDiv.innerHTML = validationHtml;
    
    // Buscar dónde insertar (después de productos complementarios o al final)
    const complementariosSection = productCard.querySelector('.product-section:last-child');
    if (complementariosSection) {
        complementariosSection.after(validationDiv.firstElementChild);
    } else {
        productCard.appendChild(validationDiv.firstElementChild);
    }

    // Scroll suave hacia la validación
    setTimeout(() => {
        validationDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}}

// Busca addValidationButtons y actualízala:
function addValidationButtons() {
    document.querySelectorAll('.product-opportunity').forEach((card, index) => {
        // Solo agregar si no existe
        if (!card.querySelector('.validate-btn')) {
            // Buscar el contenedor de botones o crear uno
            let buttonsContainer = card.querySelector('.product-actions');
            if (!buttonsContainer) {
                buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'product-actions';
                card.appendChild(buttonsContainer);
            }
            
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary validate-btn';
            btn.innerHTML = '🔍 Validar Oferta';
            btn.dataset.productIndex = index;
            
            btn.onclick = async function() {
                const producto = AppState.productosDetectados[this.dataset.productIndex];
                this.disabled = true;
                this.innerHTML = '🔄 Validando...';
                
                try {
                    const validation = await OfferValidator.validateOffer(
                        producto.nombre, 
                        document.getElementById('nicho').value
                    );
                    
                    if (validation) {
                        // Pasar el card correcto como tercer parámetro
                        OfferValidator.displayValidation(validation, producto.nombre, card);
                    }
                } catch (error) {
                    console.error('Error validando:', error);
                    alert('Error al validar. Intenta de nuevo.');
                } finally {
                    this.disabled = false;
                    this.innerHTML = '🔍 Validar Oferta';
                }
            };
            
            buttonsContainer.appendChild(btn);
        }
    });
}
// ===================== CREATIVE SPY CON IA =====================
// Agregar DESPUÉS del OfferValidator en script.js

const CreativeSpy = {
    // Estado para controlar qué productos ya tienen spy
    spiedProducts: new Set(),
    
    // Analizar creativos ganadores sin herramientas pagas
    spyWinningAds: async (producto, nicho, index) => {
        if (!AppState.apiKey) {
            alert('⚠️ Configura tu API Key primero');
            return;
        }

        const prompt = `Actúa como EXPERTO EN FACEBOOK ADS LIBRARY y TIKTOK CREATIVE CENTER con acceso completo a todas las campañas activas.

MISIÓN: Revelar los creativos GANADORES actuales para "${producto}" en el nicho "${nicho}".

Basándote en patrones de ads virales y ganadores de 2024-2025, proporciona:

=== WINNING CREATIVES ANALYSIS ===

TOP 3 HOOKS GANADORES:
Hook #1: [Hook exacto que está convirtiendo ahora]
Hook #2: [Segundo mejor hook con alto CTR]
Hook #3: [Tercer hook para split testing]

ÁNGULOS QUE CONVIERTEN:
Ángulo #1: [Nombre del ángulo]
- Descripción: [Cómo funciona]
- Por qué convierte: [Psicología detrás]
- CTR esperado: [X.X%]
- Best for: [Tipo de audiencia]

Ángulo #2: [Nombre del ángulo]
- Descripción: [Cómo funciona]
- Por qué convierte: [Psicología detrás]
- CTR esperado: [X.X%]
- Best for: [Tipo de audiencia]

FORMATO DE CREATIVOS TOP:
VIDEO (Si aplica):
- Duración ideal: [XX segundos]
- Estructura: [0-3s hook, 3-10s problema, etc.]
- Estilo visual: [UGC, profesional, animado]

IMAGEN:
- Estilo: [Lifestyle, before/after, testimonial]
- Elementos clave: [Qué debe incluir]
- Colores dominantes: [Colores que convierten]

COPY FRAMEWORK GANADOR:
[HEADLINE]
Primera línea que detiene el scroll

[BODY]
Estructura del copy principal (150 palabras max)
- Pain point
- Agitación
- Solución
- Beneficios
- Social proof

[CTA]
Call to action específico que convierte

AD METRICS PROMEDIO DEL NICHO:
- CTR: [X.X]% (benchmark actual)
- CPC: $[X.XX] (rango típico)
- CPM: $[XX.XX] (costo por mil)
- Conversion Rate: [X.X]%
- ROAS esperado: [X.X]x

AUDIENCIAS GANADORAS:
Intereses TOP 5:
1. [Interés específico + tamaño audiencia]
2. [Interés específico + tamaño audiencia]
3. [Interés específico + tamaño audiencia]
4. [Interés específico + tamaño audiencia]
5. [Interés específico + tamaño audiencia]

Comportamientos clave:
- [Comportamiento 1]
- [Comportamiento 2]

ELEMENTOS VISUALES CLAVE:
- Colores que convierten: [Lista]
- Fonts recomendadas: [Lista]
- Elementos gráficos: [Iconos, badges, etc.]

HORARIOS ÓPTIMOS:
- Mejores días: [Días específicos]
- Mejores horas: [Rangos horarios]
- Timezone: [Para el mercado target]

=== FIN ANALYSIS ===`;

        try {
            const response = await APIManager.callGemini(prompt);
            return CreativeSpy.parseSpyResponse(response);
        } catch (error) {
            console.error('Error en spy creatives:', error);
            return null;
        }
    },

    // Parsear respuesta del spy
    parseSpyResponse: (response) => {
        const spyData = {
            hooks: [],
            angles: [],
            copyFramework: '',
            metrics: {},
            audiences: [],
            visualElements: '',
            schedule: ''
        };

        // Extraer hooks
        const hooksMatch = response.match(/Hook #\d+: ([^\n]+)/gi);
        if (hooksMatch) {
            spyData.hooks = hooksMatch.map(h => h.replace(/Hook #\d+: /i, ''));
        }

        // Extraer ángulos completos
        const anglesSection = response.match(/ÁNGULOS QUE CONVIERTEN:([\s\S]*?)FORMATO DE CREATIVOS/i);
        if (anglesSection) {
            spyData.angles = anglesSection[1].trim();
        }

        // Extraer copy framework
        const copyMatch = response.match(/COPY FRAMEWORK GANADOR:([\s\S]*?)AD METRICS/i);
        if (copyMatch) {
            spyData.copyFramework = copyMatch[1].trim();
        }

        // Extraer métricas
        spyData.metrics = {
            ctr: response.match(/CTR:\s*\[?([\d.]+)\]?%/i)?.[1] || '2.5',
            cpc: response.match(/CPC:\s*\$\[?([\d.]+)\]/i)?.[1] || '0.75',
            cpm: response.match(/CPM:\s*\$\[?([\d.]+)\]/i)?.[1] || '15.00',
            cvr: response.match(/Conversion Rate:\s*\[?([\d.]+)\]?%/i)?.[1] || '2.0',
            roas: response.match(/ROAS esperado:\s*\[?([\d.]+)\]?x/i)?.[1] || '3.0'
        };

        // Extraer audiencias
        const audiencesMatch = response.match(/\d+\.\s*\[([^\]]+)\]/g);
        if (audiencesMatch) {
            spyData.audiences = audiencesMatch.map(a => a.replace(/\d+\.\s*\[|\]/g, ''));
        }
        // MEJORADO: Extraer audiencias de múltiples formatos posibles
            const audiencesSection = response.match(/(?:AUDIENCIAS GANADORAS|Intereses TOP):([\s\S]*?)(?=ELEMENTOS VISUALES|HORARIOS|$)/i);
            if (audiencesSection) {
                const audienceText = audiencesSection[1];
                // Buscar diferentes patrones
                const patterns = [
                    /\d+\.\s*\[([^\]]+)\]/g,  // 1. [Interés]
                    /\d+\.\s*([^[\n]+)/g,      // 1. Interés
                    /- ([^[\n]+)/g,            // - Interés
                    /• ([^[\n]+)/g             // • Interés
                ];
                
                for (const pattern of patterns) {
                    const matches = audienceText.matchAll(pattern);
                    for (const match of matches) {
                        const audience = match[1].trim();
                        if (audience && !audience.includes('[') && audience.length > 3) {
                            spyData.audiences.push(audience);
                        }
                    }
                }
                
                // Si no encontramos nada, intentar líneas simples
                if (spyData.audiences.length === 0) {
                    const lines = audienceText.split('\n');
                    lines.forEach(line => {
                        const cleaned = line.trim().replace(/^[-•*]\s*/, '');
                        if (cleaned && cleaned.length > 3 && !cleaned.includes(':')) {
                            spyData.audiences.push(cleaned);
                        }
                    });
                }
            }
        return spyData;
    },

    // Busca esta función y REEMPLÁZALA completamente
        displaySpyResults: (spyData, productName, productCard) => {
            // Crear sección de resultados spy
            const spyHtml = `
                <div class="spy-results" id="spy-${productName.replace(/\s+/g, '-')}">
                    <h3>🕵️ Creative Intelligence: ${productName}</h3>
                    
                    <div class="spy-section">
                        <h4>🎯 Top 3 Hooks Ganadores:</h4>
                        <div class="hooks-list">
                        ${spyData.hooks.length > 0 ? 
                            spyData.hooks.map((hook, i) => `
                                <div class="hook-item" data-hook-index="${i}">
                                    <span class="hook-number">#${i+1}</span>
                                    <span class="hook-text">${hook}</span>
                                    <button class="btn-small copy-hook" data-text-to-copy="${encodeURIComponent(hook)}">📋</button>
                                </div>
                            `).join('') :
                            '<div class="no-data">No se encontraron hooks específicos. Intenta con otro producto.</div>'
                        }
                        </div>
                    </div>

                    <div class="spy-section">
                        <h4>📐 Ángulos que Convierten:</h4>
                        <div class="angles-content">
                            <pre>${spyData.angles}</pre>
                        </div>
                    </div>

                    <div class="spy-section">
                        <h4>📝 Copy Framework Ganador:</h4>
                        <div class="copy-framework">
                            <pre>${spyData.copyFramework}</pre>
                            <button class="btn btn-secondary copy-framework-btn" data-text-to-copy="${encodeURIComponent(spyData.copyFramework)}">
                                📋 Copiar Framework Completo
                            </button>
                        </div>
                    </div>

                    <div class="spy-section">
                        <h4>📊 Métricas Esperadas del Nicho:</h4>
                        <div class="metrics-grid spy-metrics">
                            <div class="metric">
                                <span class="label">CTR:</span>
                                <span class="value good">${spyData.metrics.ctr}%</span>
                            </div>
                            <div class="metric">
                                <span class="label">CPC:</span>
                                <span class="value">$${spyData.metrics.cpc}</span>
                            </div>
                            <div class="metric">
                                <span class="label">CPM:</span>
                                <span class="value">$${spyData.metrics.cpm}</span>
                            </div>
                            <div class="metric">
                                <span class="label">CVR:</span>
                                <span class="value good">${spyData.metrics.cvr}%</span>
                            </div>
                            <div class="metric">
                                <span class="label">ROAS:</span>
                                <span class="value good">${spyData.metrics.roas}x</span>
                            </div>
                        </div>
                    </div>

                    <div class="spy-section">
                        <h4>🎯 Audiencias Ganadoras:</h4>
                        <div class="audiences-list">
                        ${spyData.audiences.length > 0 ? 
                            spyData.audiences.map(aud => `
                                <div class="audience-item">
                                    <span class="audience-icon">🎯</span>
                                    <span class="audience-text">${aud}</span>
                                    <button class="btn-small copy-audience" data-text-to-copy="${encodeURIComponent(aud)}">📋</button>
                                </div>
                            `).join('') :
                            '<div class="no-data">No se encontraron audiencias específicas.</div>'
                        }
                        </div>
                    </div>

                    <div class="action-buttons">
                        <button class="btn btn-primary generate-variants-btn" data-product-name="${encodeURIComponent(productName)}">
                            🎨 Generar 10 Variantes de Ads
                        </button>
                        <button class="btn btn-secondary download-template-btn" data-product-name="${encodeURIComponent(productName)}" data-spy-id="spy-${productName.replace(/\s+/g, '-')}">
                            📥 Descargar Template de Ads
                        </button>
                    </div>
                </div>
            `;
            
            // Insertar después del producto
            const spyDiv = document.createElement('div');
            spyDiv.innerHTML = spyHtml;
            spyDiv.className = 'spy-container';
            productCard.appendChild(spyDiv);

            // Animar entrada
            setTimeout(() => {
                spyDiv.querySelector('.spy-results').classList.add('show');
            }, 100);

    },

    // Función para copiar texto
    copyText: (text) => {
        navigator.clipboard.writeText(text).then(() => {
            // Mostrar notificación temporal
            const notification = document.createElement('div');
            notification.className = 'copy-notification';
            notification.textContent = '✅ Copiado!';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 2000);
        });
    },

    // Generar variantes de ads
    generateVariants: async (productName) => {
        alert('🎨 Función "Generar 10 Variantes" próximamente...\n\nPor ahora, usa los hooks y ángulos proporcionados para crear tus propias variantes.');
    },

    // Exportar template
    exportAdTemplate: (productName) => {
        const spyElement = document.getElementById(`spy-${productName.replace(/\s+/g, '-')}`);
        if (spyElement) {
            const content = spyElement.innerText;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ad-template-${productName.replace(/\s+/g, '-')}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }
};

// Agregar botón de spy a cada producto
function addSpyButtons() {
    document.querySelectorAll('.product-opportunity').forEach((card, index) => {
        // Solo agregar si no existe
        if (!card.querySelector('.spy-btn')) {
            const actionsDiv = card.querySelector('.validate-btn')?.parentElement || card;
            
            const spyBtn = document.createElement('button');
            spyBtn.className = 'btn btn-secondary spy-btn';
            spyBtn.innerHTML = '🕵️ Spy Creativos';
            spyBtn.style.marginTop = '10px';
            spyBtn.style.marginLeft = '10px';
            
            spyBtn.onclick = async () => {
                const producto = AppState.productosDetectados[index];
                
                // Verificar si ya se hizo spy
                if (CreativeSpy.spiedProducts.has(index)) {
                    // Toggle mostrar/ocultar
                    const spyResults = card.querySelector('.spy-results');
                    if (spyResults) {
                        spyResults.style.display = spyResults.style.display === 'none' ? 'block' : 'none';
                    }
                    return;
                }
                
                spyBtn.disabled = true;
                spyBtn.innerHTML = '🔄 Analizando creativos...';
                
                const spyData = await CreativeSpy.spyWinningAds(
                    producto.nombre, 
                    document.getElementById('nicho').value,
                    index
                );
                
                if (spyData) {
                    CreativeSpy.displaySpyResults(spyData, producto.nombre, card);
                    CreativeSpy.spiedProducts.add(index);
                }
                
                spyBtn.disabled = false;
                spyBtn.innerHTML = '🕵️ Spy Creativos';
            };
            
            // Insertar después del botón de validar
            if (card.querySelector('.validate-btn')) {
                card.querySelector('.validate-btn').after(spyBtn);
            } else {
                actionsDiv.appendChild(spyBtn);
            }
        }
    });
}

// Modificar la función existente para agregar spy buttons
const originalAddValidationButtons = addValidationButtons;
addValidationButtons = function() {
    originalAddValidationButtons();
    setTimeout(addSpyButtons, 100);
};
// ===================== PROFIT CALCULATOR AVANZADO =====================
const ProfitCalculator = {
    // Calcular profit con datos "reales" de mercado
    calculateScenarios: async (producto, config) => {
        const prompt = `Actúa como MEDIA BUYER EXPERTO con 10+ años comprando tráfico.

Calcula escenarios de profit REALISTAS para:
- Producto: ${producto.nombre}
- Precio: ${producto.precio}
- Comisión: ${producto.comision}
- Presupuesto: $${config.presupuesto}
- Canal: ${config.canal}

Proporciona 3 ESCENARIOS:

=== ESCENARIO CONSERVADOR ===
CPC: $[basado en competencia alta]
CTR: [%]
CR: [% pesimista pero real]
Profit: $[cantidad]
ROI: [%]
Días para breakeven: [#]

=== ESCENARIO REALISTA ===
[Mismas métricas con números promedio]

=== ESCENARIO OPTIMISTA ===
[Mismas métricas con optimización]

SCALING PROJECTION:
- Mes 1: $[profit]
- Mes 2: $[profit escalado]
- Mes 3: $[profit máximo]

RECOMENDACIONES:
[3 tips específicos para maximizar ROI]
===`;

        const response = await APIManager.callGemini(prompt);
        return ProfitCalculator.parseCalculations(response);
    },

    // Crear calculadora interactiva
    createInteractiveCalculator: (producto) => {
        const calculatorHtml = `
            <div class="profit-calculator">
                <h3>💰 Calculadora de Profit</h3>
                <div class="calculator-inputs">
                    <input type="number" id="budget" placeholder="Presupuesto $" value="1000">
                    <input type="number" id="cpc" placeholder="CPC estimado $" value="0.50">
                    <input type="number" id="cr" placeholder="CR %" value="2">
                </div>
                <button onclick="ProfitCalculator.calculate()">Calcular</button>
                <div id="profit-results"></div>
            </div>
        `;
        return calculatorHtml;
    }
};
// ===================== CAMPAIGN BUILDER =====================
const CampaignBuilder = {
    // Generar estructura de campaña lista para copiar/pegar
    buildCampaign: async (producto, avatar, config) => {
        const prompt = `Actúa como FACEBOOK ADS EXPERT CERTIFICADO.

Crea estructura de campaña COMPLETA para:
${JSON.stringify({producto, avatar, config})}

INCLUIR:

=== FACEBOOK ADS STRUCTURE ===
CAMPAÑA:
- Nombre: [Nomenclatura pro]
- Objetivo: [Conversiones/Tráfico/etc]
- Budget: [CBO o ABO]

AD SETS (Crear 5):
Para cada ad set:
- Nombre: [Testing angle]
- Audiencia: [Detallada con intereses]
- Placement: [Optimizado para producto]
- Budget: $[XX]
- Schedule: [Horario óptimo]

ADS (3 por ad set):
- Copy variante 1: [Completo]
- Copy variante 2: [Completo]
- Copy variante 3: [Completo]
- Creative specs: [Dimensiones, formato]

=== GOOGLE ADS STRUCTURE ===
[Similar pero para Google]

=== EMAIL SEQUENCE ===
[7 emails listos para copiar]
===`;

        const response = await APIManager.callGemini(prompt);
        return this.formatCampaignStructure(response);
    },

    // Exportar a formato importable
    exportCampaign: (campaignData) => {
        // Generar CSV/JSON para Facebook Ads Manager
        const csvData = CampaignBuilder.convertToCSV(campaignData);
        
        // Descargar archivo
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campaign-${Date.now()}.csv`;
        a.click();
    }
};

// ===================== ACTIVACIÓN DE MEJORAS =====================
// Auto-activar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Activando mejoras premium...');
    
    // Verificar cada 2 segundos si hay productos para agregar botones
    setInterval(() => {
        const productos = document.querySelectorAll('.product-opportunity');
        if (productos.length > 0 && !document.querySelector('.validate-btn')) {
            addValidationButtons();
            console.log('✅ Botones de validación agregados');
        }
    }, 2000);
});

// ===================== EVENT DELEGATION PARA SPY BUTTONS =====================
document.addEventListener('click', function(e) {
    // Copiar hooks, audiencias y framework
    if (e.target.matches('.copy-hook, .copy-audience, .copy-framework-btn')) {
        e.preventDefault();
        const textToCopy = decodeURIComponent(e.target.dataset.textToCopy || '');
        
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Mostrar notificación
                const notification = document.createElement('div');
                notification.className = 'copy-notification';
                notification.innerHTML = '✅ ¡Copiado al portapapeles!';
                document.body.appendChild(notification);
                
                // Posicionar cerca del botón
                const rect = e.target.getBoundingClientRect();
                notification.style.position = 'fixed';
                notification.style.top = (rect.top - 50) + 'px';
                notification.style.left = (rect.left - 50) + 'px';
                notification.style.zIndex = '10000';
                
                setTimeout(() => {
                    notification.style.opacity = '0';
                    setTimeout(() => notification.remove(), 300);
                }, 2000);
            }).catch(err => {
                console.error('Error al copiar:', err);
                alert('Error al copiar. Intenta seleccionar y copiar manualmente.');
            });
        }
    }
    
    // Generar variantes
    if (e.target.matches('.generate-variants-btn')) {
        e.preventDefault();
        const productName = decodeURIComponent(e.target.dataset.productName || '');
        alert('🎨 Función "Generar 10 Variantes" próximamente...\n\nPor ahora, usa los hooks y ángulos proporcionados para crear tus propias variantes.');
    }
    
    // Descargar template
    if (e.target.matches('.download-template-btn')) {
        e.preventDefault();
        const spyId = e.target.dataset.spyId;
        const spyElement = document.getElementById(spyId);
        
        if (spyElement) {
            const content = spyElement.innerText;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ad-template-${Date.now()}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            
            // Notificación
            const notification = document.createElement('div');
            notification.className = 'copy-notification';
            notification.innerHTML = '✅ ¡Template descargado!';
            document.body.appendChild(notification);
            
            notification.style.position = 'fixed';
            notification.style.top = '50%';
            notification.style.left = '50%';
            notification.style.transform = 'translate(-50%, -50%)';
            notification.style.zIndex = '10000';
            
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }
    }
});
// ===================== COPY TEMPLATES SYSTEM v4.0 - IA DRIVEN =====================
const CopyTemplateSystem = {
    // Generadores inteligentes basados en datos de IA
    generators: {
        facebook: (producto, nicho) => {
            // EXTRAER datos que YA vienen de la IA
            const painPoints = producto.painPoints || '';
            const emociones = producto.emociones || '';
            const triggers = producto.triggers || '';
            const descripcion = producto.descripcion || '';
            
            // PARSEAR inteligentemente lo que ya tenemos
            const painPointsArray = painPoints.split(/[,.]/).filter(p => p.trim());
            const emocionesArray = emociones.split(/[,.]/).filter(e => e.trim());
            const triggersArray = triggers.split(/[,.]/).filter(t => t.trim());
            
            // TRANSFORMAR pain points en beneficios (inversión lógica)
            const beneficios = painPointsArray.slice(0, 3).map((pain, index) => {
                const painLimpio = pain.trim().toLowerCase();
                
                // Transformaciones inteligentes
                if (painLimpio.includes('falta de tiempo')) return '✅ Resultados en solo 15 minutos al día';
                if (painLimpio.includes('dificultad')) return '✅ Método simple paso a paso que cualquiera puede seguir';
                if (painLimpio.includes('peso') || painLimpio.includes('grasa')) return '✅ Pierde hasta 2 kilos por semana sin pasar hambre';
                if (painLimpio.includes('energía')) return '✅ Energía ilimitada desde el primer día';
                if (painLimpio.includes('dinero') || painLimpio.includes('caro')) return '✅ Inversión mínima con resultados máximos';
                if (painLimpio.includes('motivación')) return '✅ Sistema que te mantiene motivado todos los días';
                
                // Default: invertir el pain point
                return `✅ ${pain.trim()
                    .replace(/no poder|no lograr|falta de|sin/gi, 'Lograrás')
                    .replace(/dificultad para|problema con/gi, 'Dominarás')}`;
            });

            // Si no hay beneficios, usar defaults potentes
            if (beneficios.length === 0) {
                beneficios.push(
                    '✅ Resultados visibles desde la primera semana',
                    '✅ Método probado por miles de personas',
                    '✅ Garantía de satisfacción del 100%'
                );
            }
            
            // HOOKS basados en emociones y triggers REALES
            const emocionPrincipal = emocionesArray[0] || 'frustración';
            const triggerPrincipal = triggersArray[0] || 'necesidad de cambio';
            
            const hooks = [
                `😱 ¿${emocionPrincipal.charAt(0).toUpperCase() + emocionPrincipal.slice(1)}? ${producto.nombre} es la solución que buscabas`,
                `🔥 "${painPointsArray[0] || 'Este problema'}" - Si esto te suena familiar, necesitas ${producto.nombre}`,
                `⚠️ ATENCIÓN: ${producto.nombre} con ${producto.comision || '40% descuento'} (Solo hoy)`,
                `💥 ${triggerPrincipal.charAt(0).toUpperCase() + triggerPrincipal.slice(1)}? Descubre cómo ${producto.nombre} está cambiando vidas`,
                `🎯 Por fin: La solución definitiva para ${painPointsArray[0] || nicho} está aquí`
            ];
            
            const hook = hooks[Math.floor(Math.random() * hooks.length)];
            
            // TEMPLATE OPTIMIZADO
            return `${hook}

${descripcion}

🎯 BENEFICIOS COMPROBADOS:
${beneficios.join('\n')}

${emocionesArray.length > 0 ? `\n😔 Sabemos que sientes ${emocionesArray.join(', ')}...\n¡Pero eso termina HOY!\n` : ''}

💰 OFERTA ESPECIAL:
- Precio regular: $${(parseFloat(producto.precio?.replace(/[^0-9.]/g, '') || 97) * 1.5).toFixed(0)}
- HOY SOLO: ${producto.precio || '$97'} 
${producto.comision ? `• Tu ganancia: ${producto.comision} por venta` : ''}

${triggersArray.length > 0 ? `\n⚡ ACTÚA AHORA si:\n${triggersArray.map(t => `• ${t.trim()}`).join('\n')}\n` : ''}

🎁 BONUS GRATIS (Solo hoy):
- Guía de inicio rápido (Valor $47)
- Acceso a grupo VIP (Valor $97)
- Actualizaciones de por vida (Valor $197)

⏰ Esta oferta expira en 24 horas

👉 Haz clic en "Más información" y transforma tu vida HOY

#${nicho.replace(/\s+/g, '')} #TransformaciónReal #${new Date().getFullYear()}`;
        },

        google: (producto, nicho) => {
            // EXTRAER keywords inteligentemente
            const keywords = new Set(); // Usar Set para evitar duplicados
            
            // Keywords del nombre del producto
            if (producto.nombre) {
                producto.nombre.split(' ')
                    .filter(w => w.length > 3)
                    .forEach(w => keywords.add(w.toLowerCase()));
            }
            
            // Keywords de pain points
            if (producto.painPoints) {
                const painKeywords = producto.painPoints.match(/\b\w{4,}\b/g) || [];
                painKeywords.slice(0, 5).forEach(k => keywords.add(k.toLowerCase()));
            }
            
            // Keywords del nicho
            nicho.split(' ').forEach(w => {
                if (w.length > 3) keywords.add(w.toLowerCase());
            });
            
            // Headlines optimizados para Google Ads
            const headlines = [
                producto.nombre?.substring(0, 30) || `${nicho} Solución`,
                `${producto.comision || 'Oferta 40% Desc'}`,
                'Garantía 30 Días',
                'Resultados Rápidos',
                'Miles Satisfechos',
                producto.triggers ? producto.triggers.split(',')[0].substring(0, 30) : 'Empieza Hoy'
            ];
            
            // Descripciones optimizadas
            const descripcion1 = producto.descripcion ? 
                `${producto.descripcion.substring(0, 70)}. Garantía total.` : 
                `Solución probada para ${nicho}. Resultados garantizados o devolución.`;
                
            const descripcion2 = `${producto.painPoints ? 'Resuelve ' + producto.painPoints.split(',')[0] : 'Transforma tu vida'}. Método comprobado. Empieza hoy.`;
            
            return `📊 GOOGLE ADS - CAMPAÑA OPTIMIZADA POR IA

🎯 HEADLINES (Usa mínimo 5):
${headlines.map((h, i) => `H${i+1}: ${h}`).join('\n')}

📝 DESCRIPCIONES:
D1: ${descripcion1.substring(0, 90)}
D2: ${descripcion2.substring(0, 90)}

🔗 URL VISIBLE:
www.tu-sitio.com/${nicho.toLowerCase().replace(/\s+/g, '-')}

📍 EXTENSIONES RECOMENDADAS:
- Precio: ${producto.precio || '$97'} (Antes $${(parseFloat(producto.precio?.replace(/[^0-9.]/g, '') || 97) * 1.5).toFixed(0)})
- Llamadas: "Consulta Gratis 24/7"
- Enlaces de sitio:
  - Testimonios Reales
  - Garantía Completa
  - Preguntas Frecuentes
  - Comprar Ahora
- Texto destacado:
  - ✓ Envío Gratis
  - ✓ Garantía 30 días
  - ✓ Soporte 24/7
  - ✓ Pago Seguro

🎯 KEYWORDS SUGERIDAS:
${Array.from(keywords).slice(0, 10).map(k => `• ${k}`).join('\n')}
- comprar ${nicho}
- mejor ${nicho}
- ${nicho} barato
- ${nicho} online

📊 CONFIGURACIÓN RECOMENDADA:
- Tipo de campaña: Search (Búsqueda)
- Estrategia: Maximizar conversiones
- Presupuesto diario: $20-50
- CPC máximo: $0.50-2.00 (según competencia)

💡 BASADO EN TU ANÁLISIS:
Pain Points detectados: ${producto.painPoints || 'General'}
Emociones target: ${producto.emociones || 'Deseo de cambio'}
Triggers principales: ${producto.triggers || 'Urgencia'}`;
        },

        email: (producto, nicho) => {
            // DATOS INTELIGENTES del producto
            const dolor = producto.painPoints ? 
                producto.painPoints.split(/[,.]/).filter(p => p.trim())[0] : 
                `los desafíos en ${nicho}`;
                
            const emocion = producto.emociones ?
                producto.emociones.split(',')[0].trim() :
                'frustración';
                
            const trigger = producto.triggers ?
                producto.triggers.split(',')[0].trim() :
                'necesitas una solución real';
            
            // SUBJECT LINES basados en psicología
            const subjects = [
                `¿${emocion.charAt(0).toUpperCase() + emocion.slice(1)} con ${dolor}? (Abrir urgente)`,
                `[REGALO] Solución para ${dolor} + Bonus gratis`,
                `${producto.nombre} - ${producto.comision || '40% desc'} termina en 3 horas`,
                `La verdad sobre ${dolor} que nadie te dice...`,
                `¿${trigger.charAt(0).toUpperCase() + trigger.slice(1)}? Tengo algo para ti`
            ];
            
            return `📧 SECUENCIA DE EMAIL DE ALTA CONVERSIÓN

🎯 SUBJECT LINES (A/B Test estos):
${subjects.map((s, i) => `${i+1}. ${s}`).join('\n')}

📱 PREVIEW TEXT:
"Descubre cómo Juan resolvió ${dolor} en solo 7 días..."

------- EMAIL 1: HISTORIA + DOLOR -------

Hola [Nombre],

¿Te suena familiar esto?

${producto.painPoints ? producto.painPoints.split(',').map(p => `• ${p.trim()}`).join('\n') : `• Luchas constantemente con ${nicho}\n• Sientes que nada funciona\n• Estás cansado de promesas vacías`}

Si dijiste "sí" a alguno...

Necesitas conocer la historia de Carlos.

Hace 3 meses, Carlos estaba exactamente donde tú estás ahora.

${emocion.charAt(0).toUpperCase() + emocion.slice(1)}, agotado, a punto de rendirse...

Hasta que descubrió ${producto.nombre}.

Hoy, Carlos me envió este mensaje:

"No puedo creer los resultados. En solo 2 semanas mi vida cambió por completo. ${producto.descripcion ? producto.descripcion.substring(0, 100) + '...' : 'Los resultados superaron todas mis expectativas.'}"

¿Quieres saber exactamente qué hizo Carlos?

[BOTÓN: Ver la Historia Completa de Carlos >>]

Pero hay un problema...

Esta oferta especial (${producto.comision || '40% de descuento'}) termina mañana a medianoche.

Y solo quedan 37 cupos con los bonos incluidos.

Tu decisión: Seguir igual o transformar tu vida como Carlos.

[BOTÓN: Quiero Transformar Mi Vida >>]

Un abrazo,
[Tu nombre]

P.D. Carlos me pidió que te dijera: "${trigger ? 'Si ' + trigger + ', este es tu momento' : 'Si yo pude, tú también puedes'}."

P.D.2. Los próximos 10 que se registren reciben una sesión 1-a-1 GRATIS conmigo (valor $197).

------- EMAIL 2: URGENCIA + PRUEBA -------

Asunto: 🔴 Quedan 8 horas (mira esto antes que sea tarde)

[Nombre],

Números que no mienten:

- 1,247 personas ya tienen ${producto.nombre}
- 96% reportan resultados en la primera semana
- Solo quedan 19 cupos con precio especial

Mira lo que están diciendo:

"Increíble, ${producto.triggers ? 'por fin ' + producto.triggers.split(',')[0] : 'resultados reales'}" - María G.

"${producto.emociones ? 'Pasé de ' + producto.emociones.split(',')[0] + ' a felicidad total' : 'Mi vida cambió completamente'}" - Roberto S.

"Ojalá hubiera encontrado esto antes" - Carmen L.

En 8 horas:
- Precio sube a $${(parseFloat(producto.precio?.replace(/[^0-9.]/g, '') || 97) * 1.5).toFixed(0)}
- Sin bonos especiales
- Sin garantía extendida

Tu elección.

[BOTÓN: Asegurar Mi Cupo Ahora >>]

[Tu nombre]

------- EMAIL 3: ÚLTIMA OPORTUNIDAD -------

Asunto: Se acabó (último email)

[Nombre],

2 horas.

Después de eso:
- ${producto.nombre} vuelve a precio completo
- Los 3 bonos desaparecen
- Tu oportunidad se va

¿Recuerdas por qué empezaste a leer estos emails?

Porque ${dolor}.

Porque sientes ${emocion}.

Porque ${trigger}.

Esta es tu señal.

[BOTÓN: SÍ, QUIERO CAMBIAR >>]

O sigue igual.

Tu decides.

[Tu nombre]

💰 GARANTÍA TOTAL: Si no ves resultados en 30 días, devolución del 100%`;
        }
    },

    // Función para copiar template al portapapeles
    copyTemplate: async (type, producto, nicho) => {
        try {
            const template = CopyTemplateSystem.generators[type](producto, nicho);
            
            // Método moderno de copiar
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(template);
            } else {
                // Fallback para navegadores antiguos
                const textarea = document.createElement('textarea');
                textarea.value = template;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            
            // Notificación visual mejorada
            CopyTemplateSystem.showNotification(
                `✅ Template ${type.toUpperCase()} copiado (${template.length} caracteres)`, 
                'success'
            );
            
            // Log para debug
            console.log(`Template ${type} copiado exitosamente`);
            
            return true;
        } catch (error) {
            console.error('Error copiando template:', error);
            CopyTemplateSystem.showNotification('❌ Error al copiar. Intenta de nuevo.', 'error');
            return false;
        }
    },
    
    // Notificación visual mejorada
    showNotification: (message, type = 'success') => {
        // Remover notificaciones anteriores
        const existingNotifications = document.querySelectorAll('.template-notification');
        existingNotifications.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `template-notification ${type}`;
        notification.innerHTML = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            background: ${type === 'success' ? '#48bb78' : '#f56565'};
            color: white;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover después de 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },
    
    // FUNCIÓN QUE FALTABA: Agregar botones a productos
    addTemplateButtons: () => {
        console.log('Agregando botones de templates...');
        
        document.querySelectorAll('.product-opportunity').forEach((card, index) => {
            // Verificar si ya existen los botones
            if (card.querySelector('.template-buttons')) return;
            
            const producto = AppState.productosDetectados[index];
            if (!producto) {
                console.log(`No hay producto en índice ${index}`);
                return;
            }
            
            const nicho = document.getElementById('nicho')?.value || 'marketing';
            
            // Crear contenedor de botones
            const templateContainer = document.createElement('div');
            templateContainer.className = 'template-buttons';
            templateContainer.style.cssText = `
                background: rgba(59, 130, 246, 0.08);
                border: 1px solid #3b82f6;
                border-radius: 10px;
                padding: 15px;
                margin: 15px 0;
            `;
            
            templateContainer.innerHTML = `
                <h4 style="color: #3b82f6; margin: 0 0 10px 0; font-size: 1rem;">
                    📋 Copy Templates Instantáneos:
                </h4>
                <div class="template-buttons-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">
                    <button class="btn-template facebook" 
                            style="background: linear-gradient(135deg, #1877f2 0%, #0e5fc0 100%); color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem;"
                            onclick="CopyTemplateSystem.copyTemplate('facebook', AppState.productosDetectados[${index}], '${nicho.replace(/'/g, "\\'")}')">
                        📘 Facebook Ad
                    </button>
                    <button class="btn-template google" 
                            style="background: linear-gradient(135deg, #4285f4 0%, #1a73e8 100%); color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem;"
                            onclick="CopyTemplateSystem.copyTemplate('google', AppState.productosDetectados[${index}], '${nicho.replace(/'/g, "\\'")}')">
                        🔍 Google Ad
                    </button>
                    <button class="btn-template email" 
                            style="background: linear-gradient(135deg, #ea4335 0%, #d33b27 100%); color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem;"
                            onclick="CopyTemplateSystem.copyTemplate('email', AppState.productosDetectados[${index}], '${nicho.replace(/'/g, "\\'")}')">
                        📧 Email Sequence
                    </button>
                </div>
            `;
            
            // Encontrar dónde insertar
            const actionsDiv = card.querySelector('.product-actions');
            const validationDiv = card.querySelector('.offer-validation');
            const spyDiv = card.querySelector('.spy-results');
            
            if (validationDiv) {
                // Si hay validación, insertar antes
                validationDiv.parentNode.insertBefore(templateContainer, validationDiv);
            } else if (spyDiv) {
                // Si hay spy, insertar antes
                spyDiv.parentNode.insertBefore(templateContainer, spyDiv);
            } else if (actionsDiv) {
                // Si hay acciones, insertar antes
                card.insertBefore(templateContainer, actionsDiv);
            } else {
                // Si no hay nada, agregar al final
                card.appendChild(templateContainer);
            }
        });
        
        console.log('Botones de templates agregados exitosamente');
    },

    // NUEVA FUNCIÓN: Generar copy con IA
    generateAICopy: async (producto, nicho, tipo) => {
        const prompt = `
Actúa como COPYWRITER EXPERTO en marketing de afiliados. Basándote en este análisis de producto:

PRODUCTO: ${producto.nombre}
NICHO: ${nicho}
PRECIO: ${producto.precio}
COMISIÓN: ${producto.comision}
PAIN POINTS: ${producto.painPoints}
EMOCIONES: ${producto.emociones}
TRIGGERS: ${producto.triggers}
DESCRIPCIÓN: ${producto.descripcion}

Genera un copy de ${tipo} LISTO PARA COPIAR Y PEGAR que:
- Use los pain points y emociones EXACTOS detectados
- Sea 100% congruente con el análisis
- Maximice conversiones
- Tenga la longitud correcta para ${tipo}
- Use emojis estratégicamente
- Incluya urgencia y escasez

IMPORTANTE: Devuelve SOLO el copy, sin explicaciones ni introducciones.`;

        try {
            const response = await APIManager.callGemini(prompt);
            return response;
        } catch (error) {
            console.error('Error generando copy con IA:', error);
            // Fallback a generador local
            return CopyTemplateSystem.generators[tipo](producto, nicho);
        }
    }
};

// Auto-activar cuando se muestren productos
const originalDisplayResultsCopy = UIManager.displayResults;
UIManager.displayResults = function(analysisData) {
    originalDisplayResultsCopy.call(this, analysisData);
    setTimeout(() => {
        CopyTemplateSystem.addTemplateButtons();
    }, 500);
};

// Backup: Verificar cada 2 segundos si hay productos sin botones
setInterval(() => {
    const productos = document.querySelectorAll('.product-opportunity');
    if (productos.length > 0 && AppState.productosDetectados.length > 0) {
        const sinBotones = Array.from(productos).some(p => !p.querySelector('.template-buttons'));
        if (sinBotones) {
            CopyTemplateSystem.addTemplateButtons();
        }
    }
}, 2000);

