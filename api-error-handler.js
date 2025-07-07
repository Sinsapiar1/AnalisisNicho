// ===== MEJORAS DE MANEJO DE ERRORES SIN ROMPER FUNCIONALIDAD =====
// Solo mejora el manejo de errores, NO sobrescribe funciones principales

console.log('🔧 Mejorando manejo de errores de API...');

// Función auxiliar para mostrar errores más útiles
window.showBetterError = function(error, context = '') {
    console.error('API Error:', error);
    
    let userMessage = '';
    let suggestions = [];
    
    if (error.message.includes('API Key')) {
        userMessage = '🔑 Problema con la API Key';
        suggestions = [
            'Verifica que tu API Key esté correcta',
            'Asegúrate de que comience con "AIza"',
            'Revisa que tenga permisos para Google AI Studio'
        ];
    } else if (error.message.includes('429') || error.message.includes('limit')) {
        userMessage = '🚫 Demasiadas peticiones';
        suggestions = [
            'Espera 2-3 minutos antes de intentar de nuevo',
            'Verifica tu cuota en Google AI Studio',
            'Considera usar menos análisis simultáneos'
        ];
    } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
        userMessage = '🔐 Acceso no autorizado';
        suggestions = [
            'Verifica que tu API Key esté activa',
            'Revisa que tengas créditos disponibles',
            'Asegúrate de que la API esté habilitada'
        ];
    } else if (error.message.includes('400')) {
        userMessage = '⚠️ Formato de petición inválido';
        suggestions = [
            'Revisa que hayas llenado los campos obligatorios',
            'Verifica que el nicho y público estén especificados',
            'Intenta con un prompt más corto'
        ];
    } else if (error.message.includes('500')) {
        userMessage = '🔧 Error del servidor de Google';
        suggestions = [
            'Este es un error temporal de Google',
            'Intenta de nuevo en 5-10 minutos',
            'No es un problema de tu configuración'
        ];
    } else {
        userMessage = '❌ Error desconocido';
        suggestions = [
            'Verifica tu conexión a internet',
            'Intenta recargar la página',
            'Revisa la consola del navegador'
        ];
    }
    
    // Mostrar mensaje detallado
    const statusDiv = document.getElementById('statusDiv');
    if (statusDiv) {
        statusDiv.innerHTML = `
            <div class="status error">
                <div style="font-weight: bold; margin-bottom: 10px;">${userMessage}</div>
                <div style="font-size: 0.9em; color: #f56565;">${error.message}</div>
                <div style="margin-top: 10px; font-size: 0.9em;">
                    <strong>💡 Sugerencias:</strong>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        ${suggestions.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }
    
    return userMessage;
};

// Interceptar errores de red y mostrar mensajes útiles
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message) {
        const error = event.reason;
        
        // Solo procesar errores relacionados con la API
        if (error.message.includes('API') || 
            error.message.includes('fetch') || 
            error.message.includes('401') || 
            error.message.includes('429') || 
            error.message.includes('400') || 
            error.message.includes('500')) {
            
            console.log('🔧 Interceptando error de API para mostrar mejor mensaje');
            window.showBetterError(error, 'Network Error');
        }
    }
});

// Función auxiliar para validar configuración antes de hacer peticiones
window.validateConfigBeforeRequest = function() {
    const errors = [];
    
    // Validar API Key
    const apiKey = localStorage.getItem('gemini-api-key');
    if (!apiKey || apiKey.trim() === '') {
        errors.push('🔑 API Key no configurada');
    } else if (!apiKey.startsWith('AIza')) {
        errors.push('🔑 API Key con formato incorrecto');
    }
    
    // Validar campos obligatorios
    const nicho = document.getElementById('nicho')?.value?.trim();
    const publico = document.getElementById('publico')?.value?.trim();
    
    if (!nicho) {
        errors.push('🎯 Nicho de mercado es obligatorio');
    }
    
    if (!publico) {
        errors.push('👥 Público objetivo es obligatorio');
    }
    
    if (errors.length > 0) {
        const statusDiv = document.getElementById('statusDiv');
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="status error">
                    <div style="font-weight: bold; margin-bottom: 10px;">❌ Configuración incompleta</div>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        ${errors.map(e => `<li>${e}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        return false;
    }
    
    return true;
};

// Mejorar el feedback visual durante las peticiones
window.showBetterLoadingState = function() {
    const statusDiv = document.getElementById('statusDiv');
    if (statusDiv) {
        statusDiv.innerHTML = `
            <div class="status info">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 20px; height: 20px; border: 2px solid #3182ce; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <div>
                        <div style="font-weight: bold;">🤖 Analizando con Google AI Studio...</div>
                        <div style="font-size: 0.9em; color: #4a5568;">Esto puede tomar 10-30 segundos</div>
                    </div>
                </div>
            </div>
        `;
    }
};

// CSS para la animación de loading
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    .status {
        padding: 15px;
        border-radius: 8px;
        margin: 10px 0;
    }
    
    .status.error {
        background: rgba(254, 226, 226, 0.1);
        border: 1px solid #f56565;
        color: #f56565;
    }
    
    .status.info {
        background: rgba(190, 227, 248, 0.1);
        border: 1px solid #3182ce;
        color: #3182ce;
    }
    
    .status.success {
        background: rgba(198, 246, 213, 0.1);
        border: 1px solid #48bb78;
        color: #48bb78;
    }
`;
document.head.appendChild(style);

console.log('✅ Mejoras de manejo de errores activadas - Sistema original preservado');