/**
 * Cache Manager para MarketInsight Pro
 * Reduce llamadas a API y mejora el rendimiento
 */

class CacheManager {
    constructor() {
        this.CACHE_PREFIX = 'market_insight_';
        this.DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 horas
        this.MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
        this.cleanupOldEntries();
    }

    /**
     * Genera una clave única para el cache basada en los parámetros
     */
    generateKey(params) {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((result, key) => {
                result[key] = params[key];
                return result;
            }, {});
        
        return this.CACHE_PREFIX + btoa(JSON.stringify(sortedParams));
    }

    /**
     * Guarda datos en cache con compresión opcional
     */
    set(key, value, ttl = this.DEFAULT_TTL, compress = true) {
        try {
            const data = {
                value: compress ? this.compress(JSON.stringify(value)) : value,
                compressed: compress,
                timestamp: Date.now(),
                ttl,
                hits: 0
            };

            // Verificar espacio disponible
            if (this.getCacheSize() > this.MAX_CACHE_SIZE * 0.9) {
                this.cleanupByLRU();
            }

            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error guardando en cache:', error);
            if (error.name === 'QuotaExceededError') {
                this.cleanupByLRU();
                // Intentar de nuevo
                try {
                    localStorage.setItem(key, JSON.stringify(data));
                    return true;
                } catch (retryError) {
                    return false;
                }
            }
            return false;
        }
    }

    /**
     * Obtiene datos del cache
     */
    get(key) {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;

            const data = JSON.parse(item);
            
            // Verificar si expiró
            if (Date.now() > data.timestamp + data.ttl) {
                this.delete(key);
                return null;
            }

            // Actualizar contador de hits
            data.hits++;
            localStorage.setItem(key, JSON.stringify(data));

            // Descomprimir si es necesario
            const value = data.compressed 
                ? JSON.parse(this.decompress(data.value))
                : data.value;

            return value;
        } catch (error) {
            console.error('Error leyendo cache:', error);
            this.delete(key);
            return null;
        }
    }

    /**
     * Verifica si existe una entrada válida en cache
     */
    has(key) {
        const item = localStorage.getItem(key);
        if (!item) return false;

        try {
            const data = JSON.parse(item);
            if (Date.now() > data.timestamp + data.ttl) {
                this.delete(key);
                return false;
            }
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Elimina una entrada del cache
     */
    delete(key) {
        localStorage.removeItem(key);
    }

    /**
     * Limpia todas las entradas del cache
     */
    clear() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * Limpia entradas expiradas
     */
    cleanupOldEntries() {
        const keys = Object.keys(localStorage);
        let cleaned = 0;
        
        keys.forEach(key => {
            if (key.startsWith(this.CACHE_PREFIX)) {
                try {
                    const item = localStorage.getItem(key);
                    const data = JSON.parse(item);
                    
                    if (Date.now() > data.timestamp + data.ttl) {
                        localStorage.removeItem(key);
                        cleaned++;
                    }
                } catch {
                    localStorage.removeItem(key);
                    cleaned++;
                }
            }
        });

        if (cleaned > 0) {
            console.log(`Cache: Limpiadas ${cleaned} entradas expiradas`);
        }
    }

    /**
     * Limpia por LRU (Least Recently Used)
     */
    cleanupByLRU() {
        const cacheEntries = [];
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.CACHE_PREFIX)) {
                try {
                    const item = localStorage.getItem(key);
                    const data = JSON.parse(item);
                    cacheEntries.push({
                        key,
                        lastAccess: data.timestamp + (data.hits * 3600000), // Bonus por hits
                        size: item.length
                    });
                } catch {
                    localStorage.removeItem(key);
                }
            }
        });

        // Ordenar por último acceso
        cacheEntries.sort((a, b) => a.lastAccess - b.lastAccess);

        // Eliminar el 30% más antiguo
        const toRemove = Math.floor(cacheEntries.length * 0.3);
        for (let i = 0; i < toRemove; i++) {
            localStorage.removeItem(cacheEntries[i].key);
        }

        console.log(`Cache: Limpiadas ${toRemove} entradas por LRU`);
    }

    /**
     * Obtiene el tamaño actual del cache
     */
    getCacheSize() {
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
     * Obtiene estadísticas del cache
     */
    getStats() {
        const stats = {
            entries: 0,
            size: 0,
            hits: 0,
            oldestEntry: null,
            newestEntry: null
        };

        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.CACHE_PREFIX)) {
                stats.entries++;
                const item = localStorage.getItem(key);
                stats.size += item.length;
                
                try {
                    const data = JSON.parse(item);
                    stats.hits += data.hits;
                    
                    if (!stats.oldestEntry || data.timestamp < stats.oldestEntry) {
                        stats.oldestEntry = data.timestamp;
                    }
                    if (!stats.newestEntry || data.timestamp > stats.newestEntry) {
                        stats.newestEntry = data.timestamp;
                    }
                } catch {}
            }
        });

        stats.sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        stats.averageHits = stats.entries > 0 ? (stats.hits / stats.entries).toFixed(1) : 0;

        return stats;
    }

    /**
     * Comprime datos usando LZ-string
     */
    compress(data) {
        // Simulación de compresión - en producción usar LZ-string
        return btoa(encodeURIComponent(data));
    }

    /**
     * Descomprime datos
     */
    decompress(data) {
        // Simulación de descompresión - en producción usar LZ-string
        return decodeURIComponent(atob(data));
    }
}

// Integración con la aplicación existente
const cache = new CacheManager();

// Wrapper para las llamadas a la API con cache
async function callGeminiWithCache(prompt, config = {}) {
    // Generar clave de cache basada en el prompt y config
    const cacheKey = cache.generateKey({
        prompt: prompt.substring(0, 100), // Primeros 100 chars para la clave
        ...config
    });

    // Verificar cache primero
    if (!config.forceRefresh && cache.has(cacheKey)) {
        console.log('📦 Respuesta obtenida del cache');
        const cachedResponse = cache.get(cacheKey);
        return cachedResponse;
    }

    // Si no está en cache, hacer la llamada
    console.log('🌐 Haciendo llamada a la API...');
    try {
        const response = await APIManager.callGemini(prompt);
        
        // Guardar en cache
        const ttl = config.cacheTTL || cache.DEFAULT_TTL;
        cache.set(cacheKey, response, ttl);
        
        return response;
    } catch (error) {
        // Si hay error, intentar obtener del cache aunque esté expirado
        const staleCache = localStorage.getItem(cacheKey);
        if (staleCache) {
            console.log('⚠️ Error en API, usando cache antiguo');
            const data = JSON.parse(staleCache);
            return data.compressed 
                ? JSON.parse(cache.decompress(data.value))
                : data.value;
        }
        throw error;
    }
}

// Agregar botón de estadísticas de cache en la UI
function addCacheStatsButton() {
    const button = document.createElement('button');
    button.className = 'btn btn-secondary';
    button.innerHTML = '📊 Cache Stats';
    button.onclick = () => {
        const stats = cache.getStats();
        alert(`
Cache Statistics:
- Entradas: ${stats.entries}
- Tamaño: ${stats.sizeInMB} MB
- Hits totales: ${stats.hits}
- Promedio hits/entrada: ${stats.averageHits}
        `);
    };
    
    // Agregar al header o donde prefieras
    document.querySelector('.header').appendChild(button);
}

// Exportar para uso global
window.CacheManager = CacheManager;
window.cache = cache;
window.callGeminiWithCache = callGeminiWithCache;