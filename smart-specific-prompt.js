// ===== PROMPT INTELIGENTE Y ESPECÍFICO - VERSIÓN BALANCEADA =====
// Prompt que solicita productos específicos sin confundir a la IA

console.log('🎯 Activando prompt inteligente para productos específicos...');

// Esperar a que el PromptGenerator esté disponible
setTimeout(() => {
    if (typeof PromptGenerator !== 'undefined') {
        // Sobrescribir con versión inteligente
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

            return `Actúa como EXPERTO EN MARKETING DE AFILIADOS con acceso a las principales plataformas de afiliación.

🎯 MISIÓN: Analizar el nicho "${nicho}" para "${publico}" y recomendar productos específicos reales que puedes encontrar en plataformas como Amazon Associates, ClickBank, ShareASale, etc.

📊 PERFIL DEL ANÁLISIS:
- Nicho: ${nicho}
- Audiencia: ${publico}
- Budget: ${presupuestoTexto}
- Canal: ${canalPrincipal}
- Experiencia: ${experiencia}
- ROI objetivo: ${roiObjetivo}x
- Precio target: ${rangoPrecioTexto}
- Mercado: ${mercadoGeo}

🚀 IMPORTANTE: Menciona productos específicos con nombres reales, marcas conocidas, y modelos existentes. Evita términos genéricos como "auriculares inalámbricos" - mejor di "Sony WH-1000XM4" o "Apple AirPods Pro".

FORMATO PARA CADA OPORTUNIDAD:

=== OPORTUNIDAD [N] ===
NOMBRE: [Producto específico con marca y modelo real]
PRECIO: [Precio aproximado del mercado]
COMISION: [Porcentaje típico del programa de afiliados]
PLATAFORMA: [Amazon Associates / ClickBank / ShareASale / Directo]

📋 DESCRIPCIÓN:
[Descripción específica del producto real]

💰 VIABILIDAD FINANCIERA:
- Precio de venta: $[XXX]
- Comisión estimada: [X]% = $[XX] por venta
- CPC estimado en ${canalPrincipal}: $[X.XX]
- Conversión esperada: [X]%
- ROI proyectado: [XXX]%

🧠 ANÁLISIS PSICOLÓGICO:
- Pain point principal: [específico para ${publico}]
- Trigger emocional: [qué emociona a comprar]
- Objeción principal: [qué los detiene]
- Momento ideal de compra: [cuándo compran]

📈 ESTRATEGIA DE MARKETING:
- Hook principal: "[Gancho específico para ${canalPrincipal}]"
- Ángulo de venta: [cómo posicionar el producto]
- Audiencia target: [específica para este producto]
- Call-to-action: "[CTA específico]"

🔗 OPORTUNIDADES ADICIONALES:
- Productos relacionados: [2-3 productos complementarios]
- Upsells potenciales: [productos de mayor valor]
- Ventas recurrentes: [oportunidades de ingresos repetidos]

=== FIN OPORTUNIDAD [N] ===

EJEMPLOS DEL NIVEL DE ESPECIFICIDAD REQUERIDO:

✅ BIEN: "Apple AirPods Pro 2nd Generation"
❌ MAL: "Auriculares inalámbricos premium"

✅ BIEN: "Complete Web Developer Course 2024 by Angela Yu"
❌ MAL: "Curso de programación online"

✅ BIEN: "Fitbit Charge 5 Advanced Fitness Tracker"
❌ MAL: "Monitor de actividad física"

Para el nicho ${nicho}, considera productos específicos de marcas reconocidas que realmente existen y tienen programas de afiliados activos.

🎯 OBJETIVO: Proporcionar recomendaciones actionables donde ${publico} pueda encontrar estos productos específicos y aplicar como afiliado inmediatamente.

Genera 5-7 oportunidades específicas y reales para este perfil.`;
        };
        
        console.log('✅ Prompt inteligente activado - Productos específicos sin confundir la IA');
    } else {
        console.log('⚠️ PromptGenerator no encontrado, reintentando...');
        setTimeout(arguments.callee, 1000);
    }
}, 100);

console.log('🎯 Prompt inteligente cargado');