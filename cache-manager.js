/**
 * 💾 Cache Manager para MarketInsight Pro
 * 
 * BENEFICIOS PARA AFILIADOS:
 * - 💰 Ahorra hasta 80% en costos de API
 * - ⚡ Respuestas instantáneas en análisis repetidos
 * - 📊 Histórico de análisis para comparar
 * - 🔄 Funciona offline con datos guardados
 */

class CacheManager {
    constructor() {
        this.CACHE_PREFIX = 'market_insight_';
        this.DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 horas
        this.MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
        this.stats = {
            hits: 0,
            misses: 0,
            savedApiCalls: 0,
            estimatedSavings: 0
        };
        
        this.initializeCache();
    }

    /**
     * Inicializa el cache y limpia entradas antiguas
     */
    initializeCache() {
        this.cleanupOldEntries();
        this.loadStats();
        console.log('🚀 Cache Manager iniciado - Ahorrando dinero en cada análisis');
    }

    /**
     * Genera una clave única basada en los parámetros del análisis
     */
    generateKey(params) {
        // Crear una clave única basada en los parámetros importantes
        const keyParams = {
            nicho: params.nicho,
            publico: params.publico,
            rangoPrecios: params.rangoPrecios,
            tipoProducto: params.tipoProducto,
            fecha: new Date().toDateString() // Cache por día
        };
        
        const keyString = JSON.stringify(keyParams);
        return this.CACHE_PREFIX + this.hashString(keyString);
    }

    /**
     * Hash simple para generar claves más cortas
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Guarda el análisis en cache con métricas
     */
    async set(key, value, ttl = this.DEFAULT_TTL) {
        try {
            const compressedData = this.compress(JSON.stringify(value));
            const cacheEntry = {
                data: compressedData,
                timestamp: Date.now(),
                ttl: ttl,
                hits: 0,
                size: compressedData.length,
                nicho: value.nicho || 'General',
                productCount: value.productos ? value.productos.length : 0
            };

            // Verificar espacio disponible
            if (this.needsCleanup()) {
                await this.smartCleanup();
            }

            localStorage.setItem(key, JSON.stringify(cacheEntry));
            
            // Actualizar estadísticas
            this.updateStats('save');
            
            return true;
        } catch (error) {
            console.error('Error guardando en cache:', error);
            if (error.name === 'QuotaExceededError') {
                await this.emergencyCleanup();
                // Intentar una vez más
                try {
                    localStorage.setItem(key, JSON.stringify(cacheEntry));
                    return true;
                } catch (retryError) {
                    console.error('No se pudo guardar después de limpieza:', retryError);
                    return false;
                }
            }
            return false;
        }
    }

    /**
     * Obtiene análisis del cache con tracking
     */
    get(key) {
        try {
            const item = localStorage.getItem(key);
            if (!item) {
                this.stats.misses++;
                return null;
            }

            const cacheEntry = JSON.parse(item);
            
            // Verificar expiración
            if (Date.now() > cacheEntry.timestamp + cacheEntry.ttl) {
                this.delete(key);
                this.stats.misses++;
                return null;
            }

            // Actualizar hits
            cacheEntry.hits++;
            localStorage.setItem(key, JSON.stringify(cacheEntry));
            
            // Actualizar estadísticas
            this.stats.hits++;
            this.stats.savedApiCalls++;
            this.stats.estimatedSavings += 0.002; // ~$0.002 por llamada API
            this.saveStats();
            
            // Descomprimir y retornar
            const data = JSON.parse(this.decompress(cacheEntry.data));
            
            console.log(`💰 Análisis obtenido del cache - Ahorrado: $${this.stats.estimatedSavings.toFixed(3)}`);
            
            return data;
        } catch (error) {
            console.error('Error leyendo cache:', error);
            this.delete(key);
            return null;
        }
    }

    /**
     * Verifica si existe una entrada válida
     */
    has(key) {
        const item = localStorage.getItem(key);
        if (!item) return false;
        
        try {
            const cacheEntry = JSON.parse(item);
            if (Date.now() > cacheEntry.timestamp + cacheEntry.ttl) {
                this.delete(key);
                return false;
            }
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Compresión optimizada para datos de análisis
     */
    compress(data) {
        // Usar LZ-string si está disponible, sino compresión básica
        if (typeof LZString !== 'undefined') {
            return LZString.compressToUTF16(data);
        }
        // Compresión básica como fallback
        return btoa(encodeURIComponent(data));
    }

    /**
     * Descompresión
     */
    decompress(data) {
        if (typeof LZString !== 'undefined') {
            return LZString.decompressFromUTF16(data);
        }
        return decodeURIComponent(atob(data));
    }

    /**
     * Limpieza inteligente basada en valor
     */
    async smartCleanup() {
        const entries = this.getAllCacheEntries();
        
        // Calcular valor de cada entrada
        entries.forEach(entry => {
            entry.value = this.calculateEntryValue(entry);
        });
        
        // Ordenar por valor (menor valor primero)
        entries.sort((a, b) => a.value - b.value);
        
        // Eliminar el 30% menos valioso
        const toRemove = Math.floor(entries.length * 0.3);
        for (let i = 0; i < toRemove; i++) {
            localStorage.removeItem(entries[i].key);
        }
        
        console.log(`🧹 Limpieza inteligente: ${toRemove} entradas antiguas eliminadas`);
    }

    /**
     * Calcula el valor de una entrada de cache
     */
    calculateEntryValue(entry) {
        const age = Date.now() - entry.data.timestamp;
        const ageScore = 1 - (age / entry.data.ttl); // Más nuevo = más valor
        const hitScore = Math.min(entry.data.hits / 10, 1); // Más hits = más valor
        const sizeScore = 1 - (entry.data.size / 100000); // Más pequeño = más valor
        
        return (ageScore * 0.4) + (hitScore * 0.4) + (sizeScore * 0.2);
    }

    /**
     * Obtiene todas las entradas del cache
     */
    getAllCacheEntries() {
        const entries = [];
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.CACHE_PREFIX)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    entries.push({ key, data });
                } catch {
                    // Entrada corrupta, eliminar
                    localStorage.removeItem(key);
                }
            }
        });
        
        return entries;
    }

    /**
     * Obtiene estadísticas detalladas del cache
     */
    getDetailedStats() {
        const entries = this.getAllCacheEntries();
        const stats = {
            ...this.stats,
            totalEntries: entries.length,
            totalSize: 0,
            nichos: {},
            oldestEntry: null,
            newestEntry: null,
            mostHitEntry: null,
            cacheEfficiency: 0
        };
        
        let maxHits = 0;
        
        entries.forEach(({ data }) => {
            stats.totalSize += data.size;
            
            // Contar por nicho
            const nicho = data.nicho || 'General';
            stats.nichos[nicho] = (stats.nichos[nicho] || 0) + 1;
            
            // Encontrar más antigua y más nueva
            if (!stats.oldestEntry || data.timestamp < stats.oldestEntry) {
                stats.oldestEntry = data.timestamp;
            }
            if (!stats.newestEntry || data.timestamp > stats.newestEntry) {
                stats.newestEntry = data.timestamp;
            }
            
            // Encontrar más consultada
            if (data.hits > maxHits) {
                maxHits = data.hits;
                stats.mostHitEntry = {
                    nicho: data.nicho,
                    hits: data.hits,
                    productos: data.productCount
                };
            }
        });
        
        // Calcular eficiencia
        const totalRequests = stats.hits + stats.misses;
        stats.cacheEfficiency = totalRequests > 0 ? 
            ((stats.hits / totalRequests) * 100).toFixed(1) + '%' : '0%';
        
        // Formatear tamaños
        stats.totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2) + ' MB';
        stats.estimatedSavingsFormatted = '$' + stats.estimatedSavings.toFixed(2);
        
        return stats;
    }

    /**
     * Genera reporte de ahorro para el usuario
     */
    generateSavingsReport() {
        const stats = this.getDetailedStats();
        
        return {
            titulo: '💰 Reporte de Ahorros - Cache Manager',
            periodo: 'Últimas 24 horas',
            metricas: {
                'Llamadas API Ahorradas': stats.savedApiCalls,
                'Dinero Ahorrado': stats.estimatedSavingsFormatted,
                'Eficiencia del Cache': stats.cacheEfficiency,
                'Análisis Guardados': stats.totalEntries,
                'Espacio Usado': stats.totalSizeMB
            },
            recomendaciones: this.generateRecommendations(stats)
        };
    }

    /**
     * Genera recomendaciones basadas en el uso
     */
    generateRecommendations(stats) {
        const recommendations = [];
        
        if (stats.cacheEfficiency < 50) {
            recommendations.push('💡 Tu eficiencia de cache es baja. Intenta repetir análisis similares para ahorrar más.');
        }
        
        if (stats.totalSize > this.MAX_CACHE_SIZE * 0.8) {
            recommendations.push('⚠️ El cache está casi lleno. Considera limpiar análisis antiguos.');
        }
        
        if (stats.savedApiCalls > 100) {
            recommendations.push('🎉 ¡Excelente! Has ahorrado más de 100 llamadas API.');
        }
        
        if (Object.keys(stats.nichos).length === 1) {
            recommendations.push('💡 Estás analizando solo un nicho. Explora otros mercados para diversificar.');
        }
        
        return recommendations;
    }

    /**
     * Limpia entradas expiradas
     */
    cleanupOldEntries() {
        const entries = this.getAllCacheEntries();
        let cleaned = 0;
        
        entries.forEach(({ key, data }) => {
            if (Date.now() > data.timestamp + data.ttl) {
                localStorage.removeItem(key);
                cleaned++;
            }
        });
        
        if (cleaned > 0) {
            console.log(`🧹 Cache: ${cleaned} análisis expirados eliminados`);
        }
    }

    /**
     * Verifica si necesita limpieza
     */
    needsCleanup() {
        const currentSize = this.getCurrentCacheSize();
        return currentSize > this.MAX_CACHE_SIZE * 0.9;
    }

    /**
     * Obtiene el tamaño actual del cache
     */
    getCurrentCacheSize() {
        let size = 0;
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.CACHE_PREFIX)) {
                size += localStorage.getItem(key).length;
            }
        });
        
        return size;
    }

    /**
     * Limpieza de emergencia
     */
    async emergencyCleanup() {
        // Eliminar el 50% más antiguo
        const entries = this.getAllCacheEntries();
        entries.sort((a, b) => a.data.timestamp - b.data.timestamp);
        
        const toRemove = Math.floor(entries.length * 0.5);
        for (let i = 0; i < toRemove; i++) {
            localStorage.removeItem(entries[i].key);
        }
        
        console.log(`🚨 Limpieza de emergencia: ${toRemove} entradas eliminadas`);
    }

    /**
     * Guarda estadísticas
     */
    saveStats() {
        localStorage.setItem(this.CACHE_PREFIX + 'stats', JSON.stringify(this.stats));
    }

    /**
     * Carga estadísticas
     */
    loadStats() {
        try {
            const savedStats = localStorage.getItem(this.CACHE_PREFIX + 'stats');
            if (savedStats) {
                this.stats = JSON.parse(savedStats);
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    /**
     * Actualiza estadísticas
     */
    updateStats(action) {
        if (action === 'save') {
            this.saveStats();
        }
    }

    /**
     * Limpia todo el cache
     */
    clearAll() {
        const entries = this.getAllCacheEntries();
        entries.forEach(({ key }) => {
            localStorage.removeItem(key);
        });
        
        // Reset stats
        this.stats = {
            hits: 0,
            misses: 0,
            savedApiCalls: 0,
            estimatedSavings: 0
        };
        this.saveStats();
        
        console.log('🗑️ Cache completamente limpiado');
    }

    /**
     * Elimina una entrada específica
     */
    delete(key) {
        localStorage.removeItem(key);
    }
}

// Crear instancia global
const cache = new CacheManager();

// Wrapper mejorado para afiliados
async function callGeminiWithCache(prompt, config = {}) {
    // Generar clave basada en la configuración del análisis
    const cacheKey = cache.generateKey({
        nicho: config.nicho || document.getElementById('nicho')?.value || '',
        publico: config.publico || document.getElementById('publico')?.value || '',
        rangoPrecios: config.rangoPrecios || document.getElementById('rangoPrecios')?.value || '',
        tipoProducto: config.tipoProducto || document.getElementById('tipoProducto')?.value || '',
        ...config
    });
    
    // Verificar cache primero
    if (!config.forceRefresh && cache.has(cacheKey)) {
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            // Mostrar notificación de ahorro
            showCacheSavingsNotification();
            return cachedData;
        }
    }
    
    // Si no está en cache, hacer la llamada
    console.log('🌐 Realizando análisis nuevo...');
    try {
        const response = await APIManager.callGemini(prompt);
        
        // Guardar en cache con contexto completo
        cache.set(cacheKey, response, config.cacheTTL || cache.DEFAULT_TTL);
        
        return response;
    } catch (error) {
        // Si hay error, intentar obtener del cache aunque esté expirado
        console.log('⚠️ Error en API, buscando en cache antiguo...');
        const staleCache = localStorage.getItem(cacheKey);
        if (staleCache) {
            try {
                const data = JSON.parse(staleCache);
                return data.data ? cache.decompress(data.data) : null;
            } catch {
                throw error;
            }
        }
        throw error;
    }
}

// Mostrar notificación de ahorro
function showCacheSavingsNotification() {
    const notification = document.createElement('div');
    notification.className = 'cache-savings-notification';
    notification.innerHTML = `
        <div class="savings-content">
            <span class="savings-icon">💰</span>
            <span class="savings-text">¡Análisis del cache! Ahorrado: $${(cache.stats.estimatedSavings * 0.002).toFixed(3)}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Agregar botón de estadísticas de cache
function addCacheStatsButton() {
    const button = document.createElement('button');
    button.className = 'btn btn-secondary cache-stats-btn';
    button.innerHTML = '💰 Ver Ahorros';
    button.onclick = showCacheStats;
    
    // Buscar dónde insertar el botón
    const apiSection = document.querySelector('.api-section');
    if (apiSection) {
        const buttonGroup = document.createElement('div');
        buttonGroup.style.marginTop = '10px';
        buttonGroup.appendChild(button);
        apiSection.appendChild(buttonGroup);
    }
}

// Mostrar estadísticas detalladas
function showCacheStats() {
    const stats = cache.getDetailedStats();
    const report = cache.generateSavingsReport();
    
    const modal = document.createElement('div');
    modal.className = 'cache-stats-modal';
    modal.innerHTML = `
        <div class="cache-stats-content">
            <div class="cache-stats-header">
                <h2>${report.titulo}</h2>
                <span class="close-modal" onclick="this.closest('.cache-stats-modal').remove()">&times;</span>
            </div>
            
            <div class="savings-highlight">
                <div class="savings-big-number">
                    ${stats.estimatedSavingsFormatted}
                </div>
                <div class="savings-label">Ahorrado en API</div>
            </div>
            
            <div class="cache-metrics">
                ${Object.entries(report.metricas).map(([key, value]) => `
                    <div class="metric-item">
                        <div class="metric-label">${key}</div>
                        <div class="metric-value">${value}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="cache-recommendations">
                <h3>💡 Recomendaciones</h3>
                ${report.recomendaciones.map(rec => `<p>${rec}</p>`).join('')}
            </div>
            
            <div class="cache-actions">
                <button class="btn btn-secondary" onclick="cache.clearAll(); this.closest('.cache-stats-modal').remove()">
                    🗑️ Limpiar Cache
                </button>
                <button class="btn btn-primary" onclick="this.closest('.cache-stats-modal').remove()">
                    ✅ Cerrar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Estilos CSS para el cache manager
const cacheStyles = `
<style>
.cache-savings-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    box-shadow: 0 5px 20px rgba(72, 187, 120, 0.4);
    transform: translateX(400px);
    transition: transform 0.3s ease;
    z-index: 10000;
}

.cache-savings-notification.show {
    transform: translateX(0);
}

.savings-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

.savings-icon {
    font-size: 1.5rem;
}

.savings-text {
    font-weight: 600;
}

.cache-stats-btn {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
    color: #1a202c !important;
    font-weight: 600;
}

.cache-stats-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
}

.cache-stats-content {
    background: #1a202c;
    border-radius: 20px;
    padding: 30px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
}

.cache-stats-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
}

.cache-stats-header h2 {
    color: #48bb78;
    margin: 0;
}

.close-modal {
    font-size: 30px;
    color: #718096;
    cursor: pointer;
}

.close-modal:hover {
    color: #e53e3e;
}

.savings-highlight {
    text-align: center;
    margin-bottom: 30px;
    padding: 20px;
    background: rgba(72, 187, 120, 0.1);
    border-radius: 15px;
    border: 2px solid #48bb78;
}

.savings-big-number {
    font-size: 3rem;
    font-weight: 700;
    color: #48bb78;
}

.savings-label {
    color: #a0aec0;
    margin-top: 5px;
}

.cache-metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-bottom: 30px;
}

.metric-item {
    background: rgba(45, 55, 72, 0.6);
    padding: 15px;
    border-radius: 10px;
    text-align: center;
}

.metric-label {
    color: #a0aec0;
    font-size: 0.9rem;
    margin-bottom: 5px;
}

.metric-value {
    color: #e2e8f0;
    font-size: 1.2rem;
    font-weight: 600;
}

.cache-recommendations {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid #f59e0b;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 20px;
}

.cache-recommendations h3 {
    color: #fbbf24;
    margin-bottom: 15px;
}

.cache-recommendations p {
    color: #e2e8f0;
    margin-bottom: 10px;
    line-height: 1.6;
}

.cache-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

@media (max-width: 768px) {
    .cache-metrics {
        grid-template-columns: 1fr;
    }
    
    .cache-stats-content {
        padding: 20px;
    }
    
    .savings-big-number {
        font-size: 2rem;
    }
}
</style>
`;

// Inyectar estilos
document.head.insertAdjacentHTML('beforeend', cacheStyles);

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addCacheStatsButton);
} else {
    addCacheStatsButton();
}

// Exportar para uso global
window.CacheManager = CacheManager;
window.cache = cache;
window.callGeminiWithCache = callGeminiWithCache;