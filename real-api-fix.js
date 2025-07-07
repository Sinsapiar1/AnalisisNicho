// ===== RESTAURAR API REAL - NO MÁS CONTENIDO ESTÁTICO =====
// Versión 1.0 - API real con manejo de errores mejorado

console.log('🔄 Restaurando funcionalidad de API REAL...');

// EJECUTAR INMEDIATAMENTE
(function() {
    console.log('🚀 Configurando API real de Google AI Studio...');
    
    // SOBRESCRIBIR analyzeWithGemini para usar API REAL
    window.analyzeWithGemini = async function(prompt, retries = 0) {
        console.log('🎯 API REAL: Analizando con Google AI Studio...');
        
        const maxRetries = 3;
        const apiKey = localStorage.getItem('gemini-api-key');
        
        // Validar API Key
        if (!apiKey || apiKey.trim() === '') {
            throw new Error('❌ API Key no configurada. Ve a Configuración → Guardar tu API Key de Google AI Studio');
        }
        
        const basePrompt = `
ERES UN EXPERTO EN MARKETING DE AFILIADOS CON 15 AÑOS DE EXPERIENCIA.

Tu trabajo es analizar el siguiente nicho y generar un informe ESPECÍFICO con productos REALES que existen en el mercado.

NICHO A ANALIZAR: "${document.getElementById('nicho')?.value || 'No especificado'}"
PÚBLICO OBJETIVO: "${document.getElementById('publico')?.value || 'No especificado'}"
RANGO DE PRECIOS: "${document.getElementById('rangoPrecios')?.value || 'medio'}"
CANAL PRINCIPAL: "${document.getElementById('canalPrincipal')?.value || 'paid'}"

INSTRUCCIONES CRÍTICAS:
1. DEBES mencionar productos ESPECÍFICOS que existen realmente (nombres reales, marcas, cursos)
2. INCLUIR precios aproximados REALES del mercado actual
3. CALCULAR comisiones basadas en programas de afiliados conocidos
4. ANALIZAR competencia actual (no teórica)
5. USAR datos de búsquedas y tendencias ACTUALES

FORMATO DE RESPUESTA REQUERIDO:

🎯 PRODUCTOS GANADORES DETECTADOS - [NICHO]

📊 RESUMEN EJECUTIVO:
- Nicho analizado: [nicho específico]
- Productos encontrados: [número]
- Score promedio: [X]/100
- Potencial ROI: [X]%-[X]%

═══════════════════════════════════════════════════

1. [NOMBRE ESPECÍFICO DEL PRODUCTO REAL]

💰 INFORMACIÓN FINANCIERA:
- Precio: $[precio real]
- Comisión: [%] ($[cantidad por venta])
- ROI Estimado: [X]%-[X]%
- CPC Promedio: $[X]-[X]
- Tasa Conversión: [X]%-[X]%

📋 DESCRIPCIÓN:
[Descripción del producto real específico]

📊 ANÁLISIS DE MERCADO:
- Demanda: [ALTA/MEDIA/BAJA] - [X] búsquedas mensuales
- Competencia: [ALTA/MEDIA/BAJA] - [descripción]
- Estacionalidad: [descripción específica]
- Mercados principales: [países/regiones específicas]

🧠 ANÁLISIS PSICOLÓGICO:
- Dolor principal: [específico del nicho]
- Deseo principal: [específico del público]
- Momento de compra: [cuándo compran]
- Objeciones: [objeciones reales específicas]

🎯 ESTRATEGIAS DE MARKETING:
- [estrategia específica 1]
- [estrategia específica 2]
- [estrategia específica 3]
- [estrategia específica 4]

💡 HOOKS GANADORES:
- "[hook específico 1]"
- "[hook específico 2]"
- "[hook específico 3]"

═══════════════════════════════════════════════════

[REPETIR PARA PRODUCTO 2]

═══════════════════════════════════════════════════

📈 PROYECCIÓN FINANCIERA (30 DÍAS):

ESCENARIO CONSERVADOR:
- Inversión total: $[X]
- Revenue estimado: $[X]
- Profit proyectado: $[X]
- ROI: [X]%

ESCENARIO OPTIMISTA:
- Inversión total: $[X]
- Revenue estimado: $[X]
- Profit proyectado: $[X]
- ROI: [X]%

🎯 PLAN DE ACCIÓN RECOMENDADO:

SEMANA 1-2: SETUP Y TESTING
- [acción específica 1]
- [acción específica 2]
- [acción específica 3]
- [acción específica 4]

SEMANA 3-4: OPTIMIZACIÓN Y ESCALAMIENTO
- [acción específica 1]
- [acción específica 2]
- [acción específica 3]
- [acción específica 4]

MES 2+: DIVERSIFICACIÓN Y CRECIMIENTO
- [acción específica 1]
- [acción específica 2]
- [acción específica 3]
- [acción específica 4]

═══════════════════════════════════════════════════

✅ ANÁLISIS COMPLETADO - PRODUCTOS ESPECÍFICOS IDENTIFICADOS
Generado el [fecha] a las [hora]

IMPORTANTE: Todos los productos mencionados deben ser REALES y verificables. No inventes nombres o precios.
        `;
        
        try {
            console.log(`🔄 Intento ${retries + 1}/${maxRetries} - Llamando a Google AI Studio...`);
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: basePrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 8192,
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error en respuesta de API:', response.status, errorText);
                
                if (response.status === 429) {
                    throw new Error('🚫 Rate limit excedido. Espera unos minutos antes de volver a intentar.');
                } else if (response.status === 401) {
                    throw new Error('🔑 API Key inválida. Verifica tu clave en la configuración.');
                } else if (response.status >= 500) {
                    throw new Error('🔧 Error del servidor de Google. Inténtalo en unos minutos.');
                } else {
                    throw new Error(`❌ Error de API (${response.status}): ${errorText}`);
                }
            }

            const data = await response.json();
            console.log('✅ Respuesta exitosa de Google AI Studio');

            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const content = data.candidates[0].content.parts[0].text;
                console.log('📝 Contenido recibido:', content.substring(0, 200) + '...');
                return content;
            } else {
                console.error('❌ Estructura de respuesta inesperada:', data);
                throw new Error('⚠️ Respuesta de IA vacía o malformada');
            }

        } catch (error) {
            console.error(`❌ Error en intento ${retries + 1}:`, error.message);
            
            if (retries < maxRetries - 1) {
                console.log(`🔄 Reintentando en 3 segundos... (${retries + 2}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 3000));
                return window.analyzeWithGemini(prompt, retries + 1);
            } else {
                console.error('💀 Todos los intentos fallaron');
                throw new Error(`❌ Error persistente después de ${maxRetries} intentos: ${error.message}`);
            }
        }
    };
    
    console.log('✅ API REAL restaurada correctamente');
    
})();

// BACKUP: Solo si la API falla completamente, mostrar mensaje útil
window.fallbackError = function(error) {
    return `
❌ ERROR DE ANÁLISIS

La API de Google AI Studio no está disponible en este momento.

Error: ${error.message}

🔧 POSIBLES SOLUCIONES:
1. Verifica tu API Key en la configuración
2. Revisa tu quota de Google AI Studio
3. Espera unos minutos si hay rate limiting
4. Verifica tu conexión a internet

💡 MIENTRAS TANTO:
- Usa herramientas manuales como Google Trends
- Revisa marketplaces como ClickBank, Commission Junction
- Analiza competidores directos en tu nicho
- Investiga redes sociales para productos trending

🔄 Inténtalo de nuevo en unos minutos.
    `;
};

console.log('🔄 API REAL configurada - Sistema listo para análisis dinámico');