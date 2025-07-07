// ===== LIMPIAR CACHE PARA PRODUCTOS ESPECÍFICOS =====
// Limpiar cache para evitar respuestas genéricas anteriores

console.log('🧹 Iniciando limpieza de cache para productos específicos...');

// Función para limpiar cache de productos genéricos
function clearGenericProductsCache() {
    try {
        const keys = Object.keys(localStorage);
        let cleared = 0;
        
        keys.forEach(key => {
            if (key.startsWith('market_insight_')) {
                try {
                    const data = localStorage.getItem(key);
                    if (data) {
                        const parsed = JSON.parse(data);
                        // Verificar si contiene productos genéricos
                        if (parsed.data && typeof parsed.data === 'string') {
                            const content = parsed.data;
                            // Buscar patrones de productos genéricos
                            const genericPatterns = [
                                'auriculares inalámbricos',
                                'smartwatch económico',
                                'lector de ebooks',
                                'curso online de',
                                'programa de',
                                'sistema de',
                                'método de',
                                'oportunidad 1',
                                'oportunidad 2',
                                'oportunidad 3'
                            ];
                            
                            const hasGenericContent = genericPatterns.some(pattern => 
                                content.toLowerCase().includes(pattern.toLowerCase())
                            );
                            
                            if (hasGenericContent) {
                                localStorage.removeItem(key);
                                cleared++;
                            }
                        }
                    }
                } catch (error) {
                    // Entrada corrupta, eliminar
                    localStorage.removeItem(key);
                    cleared++;
                }
            }
        });
        
        if (cleared > 0) {
            console.log(`🧹 Cache limpiado: ${cleared} entradas genéricas eliminadas`);
            
            // Mostrar notificación al usuario
            setTimeout(() => {
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: #1a202c;
                    padding: 15px 25px;
                    border-radius: 10px;
                    box-shadow: 0 5px 20px rgba(245, 158, 11, 0.4);
                    z-index: 10000;
                    font-weight: 600;
                    max-width: 350px;
                `;
                notification.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.5rem;">🚀</span>
                        <div>
                            <div style="font-weight: bold;">¡Cache mejorado!</div>
                            <div style="font-size: 0.9em; opacity: 0.8;">Ahora obtendrás productos específicos reales</div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.style.transform = 'translateX(400px)';
                    setTimeout(() => notification.remove(), 300);
                }, 4000);
            }, 2000);
        }
        
    } catch (error) {
        console.error('Error limpiando cache:', error);
    }
}

// Ejecutar al cargar la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', clearGenericProductsCache);
} else {
    clearGenericProductsCache();
}

// También limpiar cuando se haga clic en "Detectar Productos Ganadores"
setTimeout(() => {
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        const originalClick = generateBtn.onclick;
        generateBtn.addEventListener('click', function(e) {
            // Verificar si es la primera vez después de la limpieza
            const lastCleanup = localStorage.getItem('last_specific_cleanup');
            const now = Date.now();
            
            if (!lastCleanup || (now - parseInt(lastCleanup)) > 24 * 60 * 60 * 1000) {
                console.log('🧹 Limpieza preventiva antes del análisis...');
                clearGenericProductsCache();
                localStorage.setItem('last_specific_cleanup', now.toString());
            }
        });
    }
}, 1000);

console.log('✅ Sistema de limpieza de cache para productos específicos activado');