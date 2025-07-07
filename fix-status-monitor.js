// ===== MONITOR DE ESTADO DE FIXES =====
// Versión 1.0 - Monitoreo en tiempo real

console.log('🔍 Iniciando Monitor de Estado de Fixes...');

// Configuración del monitor
const MonitorConfig = {
    checkInterval: 3000, // Verificar cada 3 segundos
    maxChecks: 10,       // Máximo 10 verificaciones
    showNotifications: true,
    logLevel: 'info'     // 'debug', 'info', 'warn', 'error'
};

// Estado del monitor
let monitorState = {
    checks: 0,
    lastCheck: null,
    errorsFound: [],
    fixesApplied: [],
    isRunning: false
};

// ===== FUNCIONES DE VERIFICACIÓN =====
function verificarErroresConsola() {
    const errores = [];
    
    // Verificar funciones críticas
    if (typeof window.generateViralContent !== 'function') {
        errores.push('❌ generateViralContent no disponible');
    }
    
    if (typeof window.generateAvatar !== 'function') {
        errores.push('❌ generateAvatar no disponible');
    }
    
    if (typeof window.selectedContentTypes === 'undefined') {
        errores.push('❌ selectedContentTypes no inicializado');
    }
    
    if (typeof window.RateLimiter === 'undefined') {
        errores.push('❌ RateLimiter no disponible');
    }
    
    // Verificar elementos DOM
    const btn = document.getElementById('generateContentBtn');
    if (!btn) {
        errores.push('❌ Botón generateContentBtn no encontrado');
    }
    
    const tarjetas = document.querySelectorAll('.content-type-card');
    if (tarjetas.length === 0) {
        errores.push('❌ Tarjetas de contenido no encontradas');
    }
    
    return errores;
}

function verificarFuncionesReparadas() {
    const reparadas = [];
    
    if (typeof window.generateViralContent === 'function') {
        reparadas.push('✅ generateViralContent funcionando');
    }
    
    if (typeof window.generateAvatar === 'function') {
        reparadas.push('✅ generateAvatar funcionando');
    }
    
    if (typeof window.selectedContentTypes !== 'undefined') {
        reparadas.push('✅ selectedContentTypes inicializado');
    }
    
    if (typeof window.RateLimiter !== 'undefined') {
        reparadas.push('✅ RateLimiter activo');
    }
    
    const btn = document.getElementById('generateContentBtn');
    if (btn && btn.onclick) {
        reparadas.push('✅ Botón generateContentBtn operativo');
    }
    
    return reparadas;
}

// ===== MOSTRAR ESTADO EN TIEMPO REAL =====
function mostrarEstadoEnTiempoReal() {
    const errores = verificarErroresConsola();
    const reparadas = verificarFuncionesReparadas();
    
    // Crear o actualizar panel de estado
    let panel = document.getElementById('fixStatusPanel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'fixStatusPanel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 10px;
            border: 2px solid #10b981;
            z-index: 10000;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-width: 300px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(panel);
    }
    
    const timestamp = new Date().toLocaleTimeString();
    const totalErrores = errores.length;
    const totalReparadas = reparadas.length;
    
    panel.innerHTML = `
        <div style="text-align: center; margin-bottom: 10px;">
            <strong>🔍 Estado de Fixes</strong>
            <br><small>${timestamp}</small>
        </div>
        
        <div style="margin-bottom: 10px;">
            <div style="color: #10b981;">✅ Funcionando: ${totalReparadas}</div>
            <div style="color: #ef4444;">❌ Errores: ${totalErrores}</div>
        </div>
        
        ${errores.length > 0 ? `
            <div style="margin-bottom: 10px;">
                <strong style="color: #ef4444;">Errores:</strong>
                ${errores.map(error => `<div style="font-size: 10px;">${error}</div>`).join('')}
            </div>
        ` : ''}
        
        ${reparadas.length > 0 ? `
            <div style="margin-bottom: 10px;">
                <strong style="color: #10b981;">Reparados:</strong>
                ${reparadas.slice(0, 3).map(fix => `<div style="font-size: 10px;">${fix}</div>`).join('')}
                ${reparadas.length > 3 ? `<div style="font-size: 10px;">... +${reparadas.length - 3} más</div>` : ''}
            </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 10px;">
            <button onclick="FixStatusMonitor.hide()" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                Ocultar
            </button>
        </div>
    `;
    
    // Auto-ocultar si no hay errores
    if (errores.length === 0 && monitorState.checks > 3) {
        setTimeout(() => {
            panel.style.opacity = '0.5';
            setTimeout(() => {
                if (panel.parentNode) {
                    panel.remove();
                }
            }, 3000);
        }, 5000);
    }
}

// ===== EJECUTAR VERIFICACIÓN =====
function ejecutarVerificacion() {
    monitorState.checks++;
    monitorState.lastCheck = Date.now();
    
    console.log(`🔍 Verificación ${monitorState.checks}/${MonitorConfig.maxChecks}`);
    
    const errores = verificarErroresConsola();
    const reparadas = verificarFuncionesReparadas();
    
    // Actualizar estado
    monitorState.errorsFound = errores;
    monitorState.fixesApplied = reparadas;
    
    // Mostrar en pantalla si hay errores o si es la primera verificación
    if (errores.length > 0 || monitorState.checks <= 2) {
        mostrarEstadoEnTiempoReal();
    }
    
    // Log detallado
    if (MonitorConfig.logLevel === 'debug') {
        console.log('Errores encontrados:', errores);
        console.log('Fixes aplicados:', reparadas);
    }
    
    // Continuar verificando si hay errores y no hemos llegado al límite
    if (errores.length > 0 && monitorState.checks < MonitorConfig.maxChecks) {
        setTimeout(ejecutarVerificacion, MonitorConfig.checkInterval);
    } else {
        console.log('✅ Monitor de fixes finalizado');
        monitorState.isRunning = false;
        
        // Notificación final
        if (errores.length === 0) {
            console.log('🎉 Todos los fixes aplicados exitosamente!');
            if (typeof window.Utils !== 'undefined' && window.Utils.showStatus) {
                window.Utils.showStatus('🎉 Todos los fixes aplicados exitosamente!', 'success');
            }
        } else {
            console.log('⚠️ Algunos errores persisten:', errores);
        }
    }
}

// ===== OBJETO GLOBAL DEL MONITOR =====
window.FixStatusMonitor = {
    start: function() {
        if (monitorState.isRunning) {
            console.log('⚠️ Monitor ya está ejecutándose');
            return;
        }
        
        console.log('🚀 Iniciando monitor de fixes...');
        monitorState.isRunning = true;
        monitorState.checks = 0;
        
        ejecutarVerificacion();
    },
    
    stop: function() {
        monitorState.isRunning = false;
        console.log('⏹️ Monitor detenido');
    },
    
    hide: function() {
        const panel = document.getElementById('fixStatusPanel');
        if (panel) {
            panel.remove();
        }
    },
    
    show: function() {
        mostrarEstadoEnTiempoReal();
    },
    
    status: function() {
        return {
            isRunning: monitorState.isRunning,
            checks: monitorState.checks,
            errorsFound: monitorState.errorsFound.length,
            fixesApplied: monitorState.fixesApplied.length,
            lastCheck: monitorState.lastCheck
        };
    }
};

// ===== AUTO-INICIO =====
// Iniciar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (MonitorConfig.showNotifications) {
            window.FixStatusMonitor.start();
        }
    }, 2000);
});

console.log('✅ Monitor de estado de fixes cargado');
console.log('📋 Funciones disponibles:');
console.log('- FixStatusMonitor.start()');
console.log('- FixStatusMonitor.stop()');
console.log('- FixStatusMonitor.show()');
console.log('- FixStatusMonitor.hide()');
console.log('- FixStatusMonitor.status()');