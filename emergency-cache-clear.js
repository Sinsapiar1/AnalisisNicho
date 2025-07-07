// ===== LIMPIEZA DE EMERGENCIA - CACHE COMPLETO =====
// Limpiar TODO el cache para evitar respuestas problemáticas

console.log('🚨 LIMPIEZA DE EMERGENCIA: Eliminando todo el cache...');

// Función de limpieza total
function emergencyCleanAll() {
    try {
        // Limpiar todo el localStorage relacionado con MarketInsight
        const keys = Object.keys(localStorage);
        let totalCleaned = 0;
        
        keys.forEach(key => {
            if (key.includes('market_insight') || 
                key.includes('gemini') || 
                key.includes('cache') ||
                key.includes('MarketInsight') ||
                key.startsWith('market_') ||
                key.includes('analisis') ||
                key.includes('productos')) {
                localStorage.removeItem(key);
                totalCleaned++;
            }
        });
        
        // También limpiar sessionStorage
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach(key => {
            if (key.includes('market_insight') || 
                key.includes('gemini') || 
                key.includes('cache') ||
                key.includes('MarketInsight')) {
                sessionStorage.removeItem(key);
                totalCleaned++;
            }
        });
        
        console.log(`🧹 LIMPIEZA TOTAL: ${totalCleaned} entradas eliminadas`);
        
        // Reiniciar el objeto cache si existe
        if (typeof window.cache !== 'undefined') {
            window.cache.stats = {
                hits: 0,
                misses: 0,
                savedApiCalls: 0,
                estimatedSavings: 0
            };
            console.log('🔄 Estadísticas de cache reiniciadas');
        }
        
        // Mostrar notificación de emergencia
        setTimeout(() => {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                color: white;
                padding: 25px 35px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(220, 38, 38, 0.5);
                z-index: 99999;
                font-weight: 600;
                max-width: 400px;
                text-align: center;
                border: 2px solid #ef4444;
            `;
            notification.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                    <div style="font-size: 3rem;">🚨</div>
                    <div>
                        <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 10px;">¡CACHE LIMPIADO!</div>
                        <div style="font-size: 0.95rem; opacity: 0.9; line-height: 1.4;">
                            Se eliminaron todas las respuestas anteriores.<br>
                            <strong>El próximo análisis será completamente nuevo.</strong>
                        </div>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" style="
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border: 1px solid rgba(255,255,255,0.3);
                        padding: 8px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                    ">✅ Entendido</button>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // Auto-remover después de 10 segundos
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 10000);
        }, 500);
        
        return totalCleaned;
        
    } catch (error) {
        console.error('Error en limpieza de emergencia:', error);
        return 0;
    }
}

// Ejecutar limpieza inmediatamente
const cleaned = emergencyCleanAll();

// También forzar un nuevo prompt en la próxima ejecución
localStorage.setItem('force_new_analysis', Date.now().toString());

// Interceptar la próxima llamada para asegurar que no use cache
setTimeout(() => {
    if (typeof window.callGeminiWithCache !== 'undefined') {
        const originalCall = window.callGeminiWithCache;
        
        window.callGeminiWithCache = async function(prompt, config = {}) {
            // Forzar refresh si es la primera llamada después de la limpieza
            const forceTime = localStorage.getItem('force_new_analysis');
            if (forceTime && (Date.now() - parseInt(forceTime)) < 60000) { // 1 minuto
                config.forceRefresh = true;
                console.log('🔄 FORZANDO análisis nuevo (sin cache)');
                localStorage.removeItem('force_new_analysis');
            }
            
            return originalCall.call(this, prompt, config);
        };
        
        console.log('🔄 Interceptor de cache instalado para forzar análisis nuevo');
    }
}, 1000);

console.log('✅ Limpieza de emergencia completada - Sistema listo para análisis nuevo');