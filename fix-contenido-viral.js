// SCRIPT DE EMERGENCIA PARA CONTENIDO VIRAL
// Garantiza que las funciones críticas estén disponibles globalmente

console.log('🔧 Iniciando script de emergencia para contenido viral...');

// Función de emergencia para reparar el botón de contenido viral
function repararBotonContenidoViral() {
    console.log('🔧 Reparando botón de contenido viral...');
    
    // Encontrar el botón
    const btn = document.getElementById('generateContentBtn');
    if (!btn) {
        console.error('❌ Botón generateContentBtn no encontrado');
        return false;
    }
    
    // Remover listeners antiguos
    btn.removeEventListener('click', generateViralContent);
    btn.onclick = null;
    
    // Configurar nuevo listener
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('🚀 Botón clickeado - ejecutando generateViralContent');
        
        // Verificar que la función existe
        if (typeof window.generateViralContent === 'function') {
            window.generateViralContent();
        } else if (typeof generateViralContent === 'function') {
            generateViralContent();
        } else {
            console.error('❌ generateViralContent no está definida');
            alert('❌ Error: La función generateViralContent no está disponible. Recarga la página.');
        }
    });
    
    console.log('✅ Botón reparado correctamente');
    return true;
}

// Función para asegurar que las funciones críticas estén disponibles
function asegurarFuncionesCriticas() {
    console.log('🔧 Asegurando funciones críticas...');
    
    // Verificar si generateViralContent existe
    if (typeof window.generateViralContent !== 'function') {
        console.log('⚠️ generateViralContent no está en window, intentando definirla...');
        
        // Si existe la función global, asignarla a window
        if (typeof generateViralContent === 'function') {
            window.generateViralContent = generateViralContent;
        } else {
            // Crear función de emergencia
            window.generateViralContent = function() {
                alert('❌ Error: La función generateViralContent no está disponible. Recarga la página.');
            };
        }
    }
    
    // Verificar si generateAvatar existe
    if (typeof window.generateAvatar !== 'function') {
        console.log('⚠️ generateAvatar no está en window, intentando definirla...');
        
        if (typeof generateAvatar === 'function') {
            window.generateAvatar = generateAvatar;
        } else {
            window.generateAvatar = function() {
                alert('❌ Error: La función generateAvatar no está disponible. Recarga la página.');
            };
        }
    }
    
    console.log('✅ Funciones críticas aseguradas');
}

// Función para reparar tarjetas de contenido
function repararTarjetasContenido() {
    console.log('🔧 Reparando tarjetas de contenido...');
    
    // Encontrar todas las tarjetas
    const tarjetas = document.querySelectorAll('.content-card');
    
    tarjetas.forEach(tarjeta => {
        const checkbox = tarjeta.querySelector('.content-checkbox');
        if (checkbox) {
            // Asegurar que el event listener funcione
            checkbox.addEventListener('change', function() {
                const tipo = this.dataset.type;
                
                // Inicializar selectedContentTypes si no existe
                if (typeof selectedContentTypes === 'undefined') {
                    window.selectedContentTypes = new Set();
                }
                
                if (this.checked) {
                    selectedContentTypes.add(tipo);
                } else {
                    selectedContentTypes.delete(tipo);
                }
                
                console.log(`✅ ${tipo} ${this.checked ? 'seleccionado' : 'deseleccionado'}`);
            });
        }
    });
    
    console.log('✅ Tarjetas de contenido reparadas');
}

// Función para inicializar variables globales necesarias
function inicializarVariablesGlobales() {
    console.log('🔧 Inicializando variables globales...');
    
    // Inicializar selectedContentTypes si no existe
    if (typeof window.selectedContentTypes === 'undefined') {
        window.selectedContentTypes = new Set();
        console.log('✅ selectedContentTypes inicializado');
    }
    
    // Asegurar que publicoObjetivo existe
    if (typeof window.publicoObjetivo === 'undefined') {
        window.publicoObjetivo = '';
        console.log('✅ publicoObjetivo inicializado');
    }
    
    // Asegurar que las funciones de utilidad estén disponibles
    if (typeof window.Utils === 'undefined') {
        window.Utils = {
            showStatus: function(message, type = 'info') {
                console.log(`${type.toUpperCase()}: ${message}`);
                // Crear toast simple si no hay sistema de notificaciones
                const toast = document.createElement('div');
                toast.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 8px;
                    color: white;
                    z-index: 10000;
                    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
                `;
                toast.textContent = message;
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.remove();
                }, 3000);
            }
        };
        console.log('✅ Utils inicializado');
    }
    
    console.log('✅ Variables globales inicializadas');
}

// Función para diagnosticar problemas
function diagnosticarProblemas() {
    console.log('🔍 Diagnosticando problemas...');
    
    const problemas = [];
    
    // Verificar botón
    const btn = document.getElementById('generateContentBtn');
    if (!btn) {
        problemas.push('Botón generateContentBtn no encontrado');
    }
    
    // Verificar función
    if (typeof window.generateViralContent !== 'function') {
        problemas.push('Función generateViralContent no disponible');
    }
    
    // Verificar API Key
    if (!window.AppState || !window.AppState.apiKey) {
        problemas.push('API Key no configurada');
    }
    
    // Verificar selectedContentTypes
    if (typeof window.selectedContentTypes === 'undefined') {
        problemas.push('selectedContentTypes no inicializado');
    }
    
    if (problemas.length > 0) {
        console.log('❌ Problemas encontrados:', problemas);
        return problemas;
    } else {
        console.log('✅ No se encontraron problemas');
        return [];
    }
}

// Función principal de reparación
function repararContenidoViral() {
    console.log('🔧 === INICIANDO REPARACIÓN DE CONTENIDO VIRAL ===');
    
    // Diagnosticar primero
    const problemas = diagnosticarProblemas();
    
    // Inicializar variables globales
    inicializarVariablesGlobales();
    
    // Asegurar funciones críticas
    asegurarFuncionesCriticas();
    
    // Reparar botón
    const botonReparado = repararBotonContenidoViral();
    
    // Reparar tarjetas
    repararTarjetasContenido();
    
    // Verificar después de reparación
    const problemasPost = diagnosticarProblemas();
    
    console.log('✅ === REPARACIÓN COMPLETADA ===');
    console.log(`Problemas antes: ${problemas.length}`);
    console.log(`Problemas después: ${problemasPost.length}`);
    
    if (problemasPost.length === 0) {
        console.log('🎉 ¡Contenido viral completamente reparado!');
        if (window.Utils) {
            window.Utils.showStatus('✅ Contenido viral reparado exitosamente', 'success');
        }
    } else {
        console.log('⚠️ Algunos problemas persisten:', problemasPost);
    }
    
    return problemasPost.length === 0;
}

// Auto-ejecutar reparación cuando se carga el script
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 DOM cargado, iniciando reparación automática...');
    setTimeout(repararContenidoViral, 100);
});

// También ejecutar inmediatamente si el DOM ya está cargado
if (document.readyState === 'loading') {
    console.log('🔧 Esperando a que cargue el DOM...');
} else {
    console.log('🔧 DOM ya cargado, ejecutando reparación...');
    setTimeout(repararContenidoViral, 100);
}

// Ejecutar múltiples veces para asegurar que funcione
setTimeout(repararContenidoViral, 500);
setTimeout(repararContenidoViral, 1000);
setTimeout(repararContenidoViral, 2000);

// Exponer función de reparación globalmente
window.repararContenidoViral = repararContenidoViral;
window.diagnosticarProblemas = diagnosticarProblemas;

console.log('🔧 Script de emergencia cargado. Usa repararContenidoViral() si hay problemas.');