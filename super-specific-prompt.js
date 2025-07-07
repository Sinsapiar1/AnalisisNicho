// ===== PROMPT SÚPER ESPECÍFICO - PRODUCTOS REALES =====
// Sobrescribir el generador de prompts para ser MÁS ESPECÍFICO

console.log('🎯 Activando prompt súper específico para productos REALES...');

// Esperar a que el PromptGenerator esté disponible
setTimeout(() => {
    if (typeof PromptGenerator !== 'undefined') {
        // Guardar el original
        const originalGeneratePrompt = PromptGenerator.generateAffilatePrompt;
        
        // Sobrescribir con versión súper específica
        PromptGenerator.generateAffilatePrompt = function(config) {
            const {
                nicho, publico, rangoPrecios, tipoProducto, canalPrincipal,
                experiencia, keywords, presupuestoAds, roiObjetivo, breakEvenTime,
                tipoConversion, dispositivoTarget, mercadoGeo
            } = config;

            const rangoPrecioTexto = {
                'bajo': '$10-$50',
                'medio': '$50-$200', 
                'alto': '$200-$500',
                'muy-alto': '$500+'
            }[rangoPrecios];

            const presupuestoTexto = presupuestoAds === '0' ? 'Sin presupuesto (Tráfico orgánico)' : `$${presupuestoAds}+ mensual`;

            return `ERES UN AFILIADO EXPERTO CON ACCESO A BASES DE DATOS REALES DE PRODUCTOS.

🚨 INSTRUCCIONES CRÍTICAS - LEE ESTO PRIMERO:
1. DEBES mencionar productos que EXISTEN REALMENTE en el mercado con NOMBRES EXACTOS
2. INCLUYE marcas, modelos, ediciones específicas (ej: "iPhone 15 Pro Max", "Curso Complete Python Bootcamp 2024", "Philips Sonicare 4100")
3. PRECIOS deben ser REALES del mercado actual 2024
4. COMISIONES basadas en programas REALES (Amazon Associates, ClickBank, etc.)
5. NO inventes productos genéricos como "auriculares inalámbricos" - DA NOMBRES ESPECÍFICOS

🎯 MISIÓN:
Analizar el nicho "${nicho}" para "${publico}" y encontrar 5-8 productos ESPECÍFICOS que existen REALMENTE en:
- Amazon (Amazon Associates)
- ClickBank 
- ShareASale
- Commission Junction
- Programas directos

📊 CONTEXTO DEL ANÁLISIS:
- Nicho: ${nicho}
- Audiencia: ${publico}
- Budget: ${presupuestoTexto}
- Canal: ${canalPrincipal}
- Experiencia: ${experiencia}
- ROI objetivo: ${roiObjetivo}x
- Precio target: ${rangoPrecioTexto}
- Mercado: ${mercadoGeo}
- Device: ${dispositivoTarget}

🚨 FORMATO OBLIGATORIO (SIN EXCEPCIONES):

=== OPORTUNIDAD [N] ===
NOMBRE_EXACTO: [Nombre COMPLETO del producto con marca, modelo, año]
EJEMPLO_CORRECTO: "Sony WH-1000XM5 Wireless Noise Canceling Headphones"
EJEMPLO_INCORRECTO: "Auriculares inalámbricos con cancelación de ruido"

MARCA: [Marca específica: Sony, Apple, Samsung, etc.]
MODELO: [Modelo específico: WH-1000XM5, iPhone 15, etc.]
PRECIO_REAL: [Precio exacto del mercado: $349.99, $197, etc.]
COMISION_REAL: [% real del programa: Amazon 4%, ClickBank 50%, etc.]
GANANCIAS_POR_VENTA: [$XX.XX exactos]
PROGRAMA_AFILIADOS: [Amazon Associates / ClickBank / ShareASale / Directo]

📋 DESCRIPCION_ESPECIFICA:
[Descripción del producto ESPECÍFICO con características técnicas reales]

💰 DATOS_FINANCIEROS_REALES:
- Precio actual en 2024: $[XXX]
- Comisión del programa: [X]% = $[XX] por venta
- Volumen de búsquedas mensuales: [X,XXX]
- Nivel de competencia: [Bajo/Medio/Alto]
- ROI estimado para presupuesto ${presupuestoTexto}: [XXX]%

🧠 PSICOLOGIA_ESPECIFICA:
- Pain point principal de ${publico}: [específico del nicho ${nicho}]
- Trigger emocional: [miedo/deseo/estatus específico]
- Objeción #1: [objeción real del producto específico]
- Momento de compra: [cuándo compra ${publico} en ${nicho}]

📈 ESTRATEGIA_CONVERSION:
- Hook principal para ${canalPrincipal}: "[Hook específico]"
- Ángulo de venta ganador: [específico para este producto]
- CPC estimado en ${canalPrincipal}: $[X.XX]
- CTR esperado: [X]%
- CVR realista: [X]%

🎯 CALL_TO_ACTION:
- Botón primario: "[Texto específico del CTA]"
- Landing page: [Qué debe incluir específicamente]
- Urgencia: [Qué crear urgencia para ESTE producto]

=== FIN OPORTUNIDAD [N] ===

🏆 EJEMPLOS DE ESPECIFICIDAD REQUERIDA:

✅ CORRECTO:
- "Complete Python Bootcamp 2024: From Zero to Hero in Python" - $197 - ClickBank 50%
- "Philips Sonicare 4100 Electric Toothbrush" - $89.99 - Amazon Associates 4%
- "Trading.com Forex Masterclass by John Stevens" - $497 - Directo 40%

❌ INCORRECTO:
- "Curso de programación online"
- "Cepillo eléctrico económico"  
- "Programa de trading"

🎯 PRODUCTOS ESPECÍFICOS PARA ${nicho.toUpperCase()}:

${nicho.toLowerCase().includes('tecnologia') || nicho.toLowerCase().includes('tech') ? `
BUSCAR EN:
- Amazon: AirPods, MacBook, Samsung Galaxy, Sony headphones
- ClickBank: Software courses, apps, tech training
- Best Buy Associates: Laptops, phones, gadgets
- Mercado específico: ${mercadoGeo}
` : ''}

${nicho.toLowerCase().includes('fitness') || nicho.toLowerCase().includes('salud') ? `
BUSCAR EN:
- Amazon: Fitbit, Apple Watch, protein powders marcas específicas
- ClickBank: Fitness programs con nombres reales
- iHerb: Suplementos con marcas específicas
` : ''}

${nicho.toLowerCase().includes('dinero') || nicho.toLowerCase().includes('money') || nicho.toLowerCase().includes('afiliado') ? `
BUSCAR EN:
- ClickBank: Cursos específicos de millonarios reales
- Udemy Associates: Cursos con nombres exactos
- Programas directos: Softwares de trading, crypto, etc.
` : ''}

🚨 VERIFICACIÓN OBLIGATORIA:
Antes de responder, verifica que CADA producto tiene:
✅ Nombre exacto con marca y modelo
✅ Precio real del mercado 2024
✅ Programa de afiliados real existente
✅ Comisión real del programa
✅ Cálculo exacto de ganancias por venta

⚠️ SI NO PUEDES SER ESPECÍFICO CON PRODUCTOS REALES:
Mejor di "No tengo acceso a datos actualizados de productos específicos" 
QUE inventar productos genéricos inútiles.

📊 OBJETIVO: ${publico} debe poder ir INMEDIATAMENTE a buscar estos productos específicos y aplicar como afiliado HOY MISMO.`;
        };
        
        console.log('✅ Prompt súper específico activado - Ahora FORZARÁ productos reales');
    } else {
        console.log('⚠️ PromptGenerator no encontrado, reintentando en 1 segundo...');
        setTimeout(arguments.callee, 1000);
    }
}, 100);

console.log('🎯 Script de especificidad cargado');