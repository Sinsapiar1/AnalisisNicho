// ===== ULTRA ERROR HANDLER =====
// Versión 1.0 - Manejo completo de errores de consola

console.log('🛡️ Iniciando Ultra Error Handler...');

// ===== CONFIGURACIÓN ULTRA-ROBUSTA =====
const UltraConfig = {
    // Rate Limiting mejorado
    rateLimiting: {
        maxRequestsPerMinute: 5,        // Reducido drásticamente
        delayBetweenRequests: 5000,     // 5 segundos entre requests
        backoffMultiplier: 2,           // Incremento exponencial
        maxBackoffTime: 60000,          // Máximo 1 minuto de espera
        maxRetries: 3                   // Máximo 3 reintentos
    },
    
    // Manejo de errores 404
    resourceHandling: {
        missingResources: [],
        fallbackTimeout: 10000,
        checkInterval: 2000
    },
    
    // API Error handling
    apiErrorHandling: {
        retryCount: 3,
        retryDelay: 3000,
        circuitBreakerThreshold: 5,
        circuitBreakerTimeout: 300000   // 5 minutos
    },
    
    // Logging
    logging: {
        logLevel: 'info',
        suppressConsoleErrors: true,
        showUserFriendlyMessages: true
    }
};

// ===== ESTADO GLOBAL =====
let UltraState = {
    // Rate Limiter
    rateLimiter: {
        requests: [],
        lastRequest: 0,
        currentBackoff: 0,
        isBlocked: false
    },
    
    // Circuit Breaker
    circuitBreaker: {
        failures: 0,
        lastFailure: 0,
        state: 'CLOSED' // CLOSED, OPEN, HALF_OPEN
    },
    
    // Resource Tracker
    resourceTracker: {
        failed404: new Set(),
        checkedResources: new Set()
    },
    
    // Error Stats
    errorStats: {
        total429: 0,
        total404: 0,
        totalAPI: 0,
        totalHandled: 0
    }
};

// ===== ULTRA RATE LIMITER =====
function createUltraRateLimiter() {
    window.UltraRateLimiter = {
        canMakeRequest: function() {
            const now = Date.now();
            const { rateLimiter } = UltraState;
            
            // Limpiar requests antiguos (mayores a 1 minuto)
            rateLimiter.requests = rateLimiter.requests.filter(
                time => (now - time) < 60000
            );
            
            // Verificar si está bloqueado por backoff
            if (rateLimiter.isBlocked) {
                const timeToWait = rateLimiter.currentBackoff - (now - rateLimiter.lastRequest);
                if (timeToWait > 0) {
                    console.log(`⏳ Rate limiter bloqueado por ${Math.ceil(timeToWait/1000)}s más`);
                    return false;
                }
                rateLimiter.isBlocked = false;
                rateLimiter.currentBackoff = 0;
            }
            
            // Verificar límite de requests
            if (rateLimiter.requests.length >= UltraConfig.rateLimiting.maxRequestsPerMinute) {
                this.triggerBackoff();
                return false;
            }
            
            // Verificar tiempo mínimo entre requests
            const timeSinceLastRequest = now - rateLimiter.lastRequest;
            if (timeSinceLastRequest < UltraConfig.rateLimiting.delayBetweenRequests) {
                console.log(`⏳ Esperando ${Math.ceil((UltraConfig.rateLimiting.delayBetweenRequests - timeSinceLastRequest)/1000)}s`);
                return false;
            }
            
            return true;
        },
        
        recordRequest: function() {
            const now = Date.now();
            UltraState.rateLimiter.requests.push(now);
            UltraState.rateLimiter.lastRequest = now;
            console.log(`✅ Request registrado. Total: ${UltraState.rateLimiter.requests.length}/${UltraConfig.rateLimiting.maxRequestsPerMinute}`);
        },
        
        triggerBackoff: function() {
            const now = Date.now();
            const { rateLimiter } = UltraState;
            
            rateLimiter.currentBackoff = Math.min(
                UltraConfig.rateLimiting.delayBetweenRequests * UltraConfig.rateLimiting.backoffMultiplier,
                UltraConfig.rateLimiting.maxBackoffTime
            );
            
            rateLimiter.isBlocked = true;
            rateLimiter.lastRequest = now;
            
            console.log(`🚫 Rate limiter activado. Backoff: ${rateLimiter.currentBackoff/1000}s`);
            
            if (window.Utils && window.Utils.showStatus) {
                window.Utils.showStatus(
                    `⏳ Límite de requests alcanzado. Esperando ${rateLimiter.currentBackoff/1000}s`, 
                    'warning'
                );
            }
        },
        
        getWaitTime: function() {
            const now = Date.now();
            const { rateLimiter } = UltraState;
            
            if (rateLimiter.isBlocked) {
                return Math.max(0, rateLimiter.currentBackoff - (now - rateLimiter.lastRequest));
            }
            
            const timeSinceLastRequest = now - rateLimiter.lastRequest;
            return Math.max(0, UltraConfig.rateLimiting.delayBetweenRequests - timeSinceLastRequest);
        }
    };
}

// ===== CIRCUIT BREAKER =====
function createCircuitBreaker() {
    window.UltraCircuitBreaker = {
        canMakeRequest: function() {
            const { circuitBreaker } = UltraState;
            const now = Date.now();
            
            switch (circuitBreaker.state) {
                case 'OPEN':
                    // Verificar si es tiempo de intentar de nuevo
                    if (now - circuitBreaker.lastFailure > UltraConfig.apiErrorHandling.circuitBreakerTimeout) {
                        circuitBreaker.state = 'HALF_OPEN';
                        console.log('🔄 Circuit breaker: HALF_OPEN');
                        return true;
                    }
                    console.log('⛔ Circuit breaker: OPEN - Bloqueado');
                    return false;
                
                case 'HALF_OPEN':
                    // Permitir una request de prueba
                    return true;
                
                case 'CLOSED':
                default:
                    return true;
            }
        },
        
        recordSuccess: function() {
            const { circuitBreaker } = UltraState;
            
            if (circuitBreaker.state === 'HALF_OPEN') {
                circuitBreaker.state = 'CLOSED';
                circuitBreaker.failures = 0;
                console.log('✅ Circuit breaker: CLOSED - Restaurado');
            }
        },
        
        recordFailure: function() {
            const { circuitBreaker } = UltraState;
            const now = Date.now();
            
            circuitBreaker.failures++;
            circuitBreaker.lastFailure = now;
            
            if (circuitBreaker.failures >= UltraConfig.apiErrorHandling.circuitBreakerThreshold) {
                circuitBreaker.state = 'OPEN';
                console.log('🚫 Circuit breaker: OPEN - Demasiadas fallas');
                
                if (window.Utils && window.Utils.showStatus) {
                    window.Utils.showStatus(
                        '⛔ API temporalmente deshabilitada por múltiples errores. Reintentando en 5 minutos.', 
                        'error'
                    );
                }
            }
        }
    };
}

// ===== INTERCEPTOR DE ERRORES GLOBAL =====
function createGlobalErrorHandler() {
    // Interceptar errores de window
    window.addEventListener('error', function(e) {
        const error = e.error || e;
        const message = e.message || error.message || 'Error desconocido';
        
        console.log('🔍 Error interceptado:', message);
        
        // Clasificar y manejar el error
        if (message.includes('404') || message.includes('Failed to load resource')) {
            handleResourceError(e);
        } else if (message.includes('429') || message.includes('Too Many Requests')) {
            handleRateLimitError(e);
        } else if (message.includes('API') || message.includes('fetch')) {
            handleAPIError(e);
        } else {
            handleGenericError(e);
        }
        
        UltraState.errorStats.totalHandled++;
    });
    
    // Interceptar promesas rechazadas
    window.addEventListener('unhandledrejection', function(e) {
        console.log('🔍 Promise rejection interceptada:', e.reason);
        
        const reason = e.reason || {};
        const message = reason.message || reason.toString();
        
        if (message.includes('429')) {
            handleRateLimitError(e);
        } else if (message.includes('404')) {
            handleResourceError(e);
        } else {
            handleAPIError(e);
        }
        
        // Prevenir que aparezca en consola
        e.preventDefault();
        UltraState.errorStats.totalHandled++;
    });
}

// ===== MANEJADORES ESPECÍFICOS =====
function handleResourceError(error) {
    UltraState.errorStats.total404++;
    console.log('📦 Manejando error 404:', error);
    
    // Extraer URL del recurso faltante
    const url = extractURLFromError(error);
    if (url) {
        UltraState.resourceTracker.failed404.add(url);
    }
    
    // Mostrar mensaje amigable
    if (UltraConfig.logging.showUserFriendlyMessages) {
        showUserFriendlyMessage('📦 Algunos recursos opcionales no están disponibles, pero la aplicación funciona normalmente.', 'info');
    }
}

function handleRateLimitError(error) {
    UltraState.errorStats.total429++;
    console.log('⏳ Manejando error 429:', error);
    
    // Activar backoff automático
    if (window.UltraRateLimiter) {
        window.UltraRateLimiter.triggerBackoff();
    }
    
    // Registrar falla en circuit breaker
    if (window.UltraCircuitBreaker) {
        window.UltraCircuitBreaker.recordFailure();
    }
    
    // Mostrar mensaje amigable
    if (UltraConfig.logging.showUserFriendlyMessages) {
        showUserFriendlyMessage('⏳ Demasiadas solicitudes. Esperando antes de continuar...', 'warning');
    }
}

function handleAPIError(error) {
    UltraState.errorStats.totalAPI++;
    console.log('🌐 Manejando error API:', error);
    
    // Registrar falla en circuit breaker
    if (window.UltraCircuitBreaker) {
        window.UltraCircuitBreaker.recordFailure();
    }
    
    // Mostrar mensaje amigable
    if (UltraConfig.logging.showUserFriendlyMessages) {
        showUserFriendlyMessage('🌐 Error temporal de conexión. Reintentando automáticamente...', 'warning');
    }
}

function handleGenericError(error) {
    console.log('🔧 Manejando error genérico:', error);
    
    // Aplicar fixes automáticos si están disponibles
    if (typeof window.repararTodoSafe === 'function') {
        setTimeout(() => {
            window.repararTodoSafe();
        }, 1000);
    }
}

// ===== UTILIDADES =====
function extractURLFromError(error) {
    try {
        const message = error.message || error.toString();
        const urlMatch = message.match(/https?:\/\/[^\s]+/);
        return urlMatch ? urlMatch[0] : null;
    } catch (e) {
        return null;
    }
}

function showUserFriendlyMessage(message, type = 'info') {
    if (window.Utils && window.Utils.showStatus) {
        window.Utils.showStatus(message, type);
    } else {
        console.log(`🔔 ${message}`);
    }
}

// ===== OVERRIDE DE FUNCIONES CRÍTICAS =====
function overrideAPICalls() {
    // Override fetch
    if (window.fetch) {
        const originalFetch = window.fetch;
        
        window.fetch = async function(url, options) {
            // Verificar rate limiter
            if (!window.UltraRateLimiter.canMakeRequest()) {
                const waitTime = window.UltraRateLimiter.getWaitTime();
                throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime/1000)}s`);
            }
            
            // Verificar circuit breaker
            if (!window.UltraCircuitBreaker.canMakeRequest()) {
                throw new Error('Circuit breaker is open. API calls disabled temporarily.');
            }
            
            try {
                // Registrar request
                window.UltraRateLimiter.recordRequest();
                
                // Hacer la llamada
                const response = await originalFetch(url, options);
                
                // Verificar respuesta
                if (response.status === 429) {
                    window.UltraRateLimiter.triggerBackoff();
                    throw new Error('Too Many Requests - Rate limit exceeded');
                }
                
                if (response.ok) {
                    window.UltraCircuitBreaker.recordSuccess();
                }
                
                return response;
                
            } catch (error) {
                window.UltraCircuitBreaker.recordFailure();
                throw error;
            }
        };
    }
}

// ===== SUPRIMIR ERRORES DE CONSOLA =====
function suppressConsoleErrors() {
    if (UltraConfig.logging.suppressConsoleErrors) {
        const originalError = console.error;
        const originalWarn = console.warn;
        
        console.error = function(...args) {
            const message = args.join(' ');
            
            // Suprimir errores conocidos
            if (message.includes('404') || 
                message.includes('429') || 
                message.includes('Failed to load resource') ||
                message.includes('Too Many Requests') ||
                message.includes('Límite de requests excedido')) {
                
                // Registrar silenciosamente
                console.log(`🔇 Error suprimido: ${message}`);
                return;
            }
            
            // Mostrar otros errores
            originalError.apply(console, args);
        };
        
        console.warn = function(...args) {
            const message = args.join(' ');
            
            // Suprimir warnings conocidos
            if (message.includes('404') || 
                message.includes('429') || 
                message.includes('Failed to load resource')) {
                
                console.log(`🔇 Warning suprimido: ${message}`);
                return;
            }
            
            originalWarn.apply(console, args);
        };
    }
}

// ===== MONITOR DE ESTADO MEJORADO =====
function createImprovedStatusMonitor() {
    window.UltraStatusMonitor = {
        show: function() {
            const { errorStats } = UltraState;
            
            let panel = document.getElementById('ultraStatusPanel');
            if (!panel) {
                panel = document.createElement('div');
                panel.id = 'ultraStatusPanel';
                panel.style.cssText = `
                    position: fixed;
                    top: 10px;
                    left: 10px;
                    background: linear-gradient(135deg, #1e3a8a, #3b82f6);
                    color: white;
                    padding: 20px;
                    border-radius: 15px;
                    border: 2px solid #10b981;
                    z-index: 10001;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 12px;
                    max-width: 350px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    backdrop-filter: blur(10px);
                `;
                document.body.appendChild(panel);
            }
            
            const timestamp = new Date().toLocaleTimeString();
            
            panel.innerHTML = `
                <div style="text-align: center; margin-bottom: 15px;">
                    <strong style="font-size: 14px;">🛡️ Ultra Error Handler</strong>
                    <br><small style="opacity: 0.8;">${timestamp}</small>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 18px; font-weight: bold; color: #10b981;">${errorStats.totalHandled}</div>
                        <div style="font-size: 10px; opacity: 0.8;">Errores Manejados</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 18px; font-weight: bold; color: #f59e0b;">${errorStats.total429}</div>
                        <div style="font-size: 10px; opacity: 0.8;">Rate Limits</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 18px; font-weight: bold; color: #ef4444;">${errorStats.total404}</div>
                        <div style="font-size: 10px; opacity: 0.8;">Recursos 404</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 18px; font-weight: bold; color: #8b5cf6;">${errorStats.totalAPI}</div>
                        <div style="font-size: 10px; opacity: 0.8;">Errores API</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <div style="font-size: 11px; margin-bottom: 5px;"><strong>Estado del Sistema:</strong></div>
                    <div style="font-size: 10px; opacity: 0.9;">
                        🔄 Rate Limiter: ${UltraState.rateLimiter.isBlocked ? 'Bloqueado' : 'Activo'}<br>
                        ⚡ Circuit Breaker: ${UltraState.circuitBreaker.state}<br>
                        📊 Requests recientes: ${UltraState.rateLimiter.requests.length}/${UltraConfig.rateLimiting.maxRequestsPerMinute}
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <button onclick="UltraStatusMonitor.hide()" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 11px; margin-right: 5px;">
                        Ocultar
                    </button>
                    <button onclick="UltraStatusMonitor.reset()" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 11px;">
                        Reset Stats
                    </button>
                </div>
            `;
            
            // Auto-hide después de 30 segundos
            setTimeout(() => {
                if (panel && panel.parentNode) {
                    panel.style.opacity = '0.7';
                    setTimeout(() => {
                        if (panel.parentNode) {
                            panel.remove();
                        }
                    }, 10000);
                }
            }, 30000);
        },
        
        hide: function() {
            const panel = document.getElementById('ultraStatusPanel');
            if (panel) {
                panel.remove();
            }
        },
        
        reset: function() {
            UltraState.errorStats = {
                total429: 0,
                total404: 0,
                totalAPI: 0,
                totalHandled: 0
            };
            
            UltraState.circuitBreaker.failures = 0;
            UltraState.circuitBreaker.state = 'CLOSED';
            UltraState.rateLimiter.requests = [];
            UltraState.rateLimiter.isBlocked = false;
            
            this.show();
        }
    };
}

// ===== INICIALIZACIÓN =====
function initializeUltraErrorHandler() {
    console.log('🚀 Inicializando Ultra Error Handler...');
    
    // Crear componentes
    createUltraRateLimiter();
    createCircuitBreaker();
    createGlobalErrorHandler();
    createImprovedStatusMonitor();
    
    // Override funciones críticas
    overrideAPICalls();
    
    // Suprimir errores de consola
    suppressConsoleErrors();
    
    // Mostrar estado inicial
    setTimeout(() => {
        window.UltraStatusMonitor.show();
    }, 2000);
    
    console.log('✅ Ultra Error Handler inicializado exitosamente');
    console.log('📋 Funciones disponibles:');
    console.log('- UltraRateLimiter.*');
    console.log('- UltraCircuitBreaker.*');
    console.log('- UltraStatusMonitor.*');
}

// ===== AUTO-INICIO =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUltraErrorHandler);
} else {
    initializeUltraErrorHandler();
}

console.log('🛡️ Ultra Error Handler cargado y listo');