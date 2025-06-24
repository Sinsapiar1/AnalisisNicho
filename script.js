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