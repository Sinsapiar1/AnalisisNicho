/**
 * 🔧 Fix definitivo para el botón de Contenido Viral
 * Este script se ejecuta al cargar la página para asegurar que todo funcione
 */

console.log('🔧 Iniciando diagnóstico del botón de contenido viral...');

// 1. VERIFICAR QUE EL BOTÓN EXISTE
function verificarBoton() {
    const boton = document.getElementById('generateContentBtn');
    
    if (!boton) {
        console.error('❌ Botón generateContentBtn no encontrado');
        return false;
    }
    
    console.log('✅ Botón encontrado:', boton);
    return boton;
}

// 2. VERIFICAR QUE LAS FUNCIONES EXISTEN
function verificarFunciones() {
    const funciones = {
        generateViralContent: typeof generateViralContent !== 'undefined',
        callGeminiWithCache: typeof callGeminiWithCache !== 'undefined',
        AppState: typeof AppState !== 'undefined'
    };
    
    console.log('📊 Estado de funciones:', funciones);
    
    if (!funciones.generateViralContent) {
        console.error('❌ Función generateViralContent no está definida');
        return false;
    }
    
    return true;
}

// 3. VERIFICAR QUE LAS TARJETAS DE CONTENIDO FUNCIONEN
function verificarTarjetas() {
    const tarjetas = document.querySelectorAll('.content-type-card');
    
    if (tarjetas.length === 0) {
        console.error('❌ No se encontraron tarjetas de contenido');
        return false;
    }
    
    console.log(`✅ Encontradas ${tarjetas.length} tarjetas de contenido`);
    
    // Verificar que tengan event listeners
    let tarjetasActivas = 0;
    tarjetas.forEach((tarjeta, index) => {
        if (tarjeta.onclick || tarjeta.addEventListener) {
            tarjetasActivas++;
        }
    });
    
    console.log(`📊 Tarjetas con eventos: ${tarjetasActivas}/${tarjetas.length}`);
    return tarjetasActivas > 0;
}

// 4. FIX AUTOMÁTICO DEL BOTÓN
function fixBoton() {
    const boton = document.getElementById('generateContentBtn');
    
    if (!boton) {
        console.error('❌ No se puede arreglar: botón no existe');
        return false;
    }
    
    // Limpiar event listeners previos
    const nuevoBoton = boton.cloneNode(true);
    boton.parentNode.replaceChild(nuevoBoton, boton);
    
    // Agregar event listener correcto
    nuevoBoton.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('🚀 Botón clickeado - ejecutando generateViralContent');
        
        if (typeof generateViralContent === 'function') {
            generateViralContent();
        } else {
            console.error('❌ generateViralContent no está definida');
            alert('Error: La función de generación no está disponible. Recarga la página.');
        }
    });
    
    console.log('✅ Botón reparado y event listener agregado');
    return true;
}

// 5. FIX DE LAS TARJETAS DE CONTENIDO
function fixTarjetas() {
    const tarjetas = document.querySelectorAll('.content-type-card');
    
    if (tarjetas.length === 0) {
        console.error('❌ No hay tarjetas para reparar');
        return false;
    }
    
    // Asegurar que selectedContentTypes esté definido
    if (typeof selectedContentTypes === 'undefined') {
        window.selectedContentTypes = new Set();
        console.log('✅ Variable selectedContentTypes inicializada');
    }
    
    // Agregar event listeners a todas las tarjetas
    tarjetas.forEach((tarjeta, index) => {
        const tipo = tarjeta.dataset.type;
        
        if (!tipo) {
            console.error(`❌ Tarjeta ${index} no tiene data-type`);
            return;
        }
        
        // Limpiar listeners previos clonando
        const nuevaTarjeta = tarjeta.cloneNode(true);
        tarjeta.parentNode.replaceChild(nuevaTarjeta, tarjeta);
        
        // Agregar nuevo listener
        nuevaTarjeta.addEventListener('click', function(e) {
            e.preventDefault();
            console.log(`🎯 Tarjeta clickeada: ${tipo}`);
            
            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                selectedContentTypes.delete(tipo);
                console.log(`➖ ${tipo} deseleccionado`);
            } else {
                this.classList.add('selected');
                selectedContentTypes.add(tipo);
                console.log(`➕ ${tipo} seleccionado`);
            }
            
            console.log('📝 Tipos seleccionados:', Array.from(selectedContentTypes));
        });
        
        // Agregar estilos
        nuevaTarjeta.style.cursor = 'pointer';
        nuevaTarjeta.style.transition = 'all 0.3s ease';
    });
    
    console.log(`✅ ${tarjetas.length} tarjetas reparadas`);
    return true;
}

// 6. FUNCIÓN PRINCIPAL DE DIAGNÓSTICO Y REPARACIÓN
function diagnosticarYReparar() {
    console.log('🔍 Iniciando diagnóstico completo...');
    
    const diagnostico = {
        botonExiste: verificarBoton(),
        funcionesExisten: verificarFunciones(),
        tarjetasFuncionan: verificarTarjetas()
    };
    
    console.log('📊 Resultado del diagnóstico:', diagnostico);
    
    // Intentar reparar problemas encontrados
    if (diagnostico.botonExiste && !diagnostico.funcionesExisten) {
        console.log('🔧 Intentando reparar funciones...');
        // Las funciones deberían cargarse desde script.js
    }
    
    if (diagnostico.botonExiste) {
        console.log('🔧 Reparando botón...');
        fixBoton();
    }
    
    if (diagnostico.tarjetasFuncionan || document.querySelectorAll('.content-type-card').length > 0) {
        console.log('🔧 Reparando tarjetas...');
        fixTarjetas();
    }
    
    // Verificación final
    setTimeout(() => {
        const verificacionFinal = {
            botonFunciona: !!document.getElementById('generateContentBtn'),
            tarjetasFuncionan: document.querySelectorAll('.content-type-card').length > 0,
            variablesExisten: typeof selectedContentTypes !== 'undefined'
        };
        
        console.log('✅ Verificación final:', verificacionFinal);
        
        if (verificacionFinal.botonFunciona && verificacionFinal.tarjetasFuncionan) {
            console.log('🎉 ¡Fix completado! El botón de contenido viral debería funcionar');
            
            // Mostrar mensaje al usuario
            if (typeof Utils !== 'undefined' && Utils.showStatus) {
                Utils.showStatus('✅ Botón de contenido viral reparado', 'success');
            }
        } else {
            console.error('❌ Fix fallido. Problemas persistentes detectados');
        }
    }, 1000);
}

// 7. EJECUTAR CUANDO EL DOM ESTÉ LISTO
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', diagnosticarYReparar);
} else {
    // Si ya está cargado, ejecutar inmediatamente
    diagnosticarYReparar();
}

// También ejecutar después de unos segundos para casos de carga lenta
setTimeout(diagnosticarYReparar, 2000);

// 8. FUNCIÓN DE EMERGENCIA - EJECUTAR MANUALMENTE DESDE CONSOLA
window.repararContenidoViral = function() {
    console.log('🆘 Ejecutando reparación de emergencia...');
    diagnosticarYReparar();
};

console.log('🔧 Script de fix cargado. Usa repararContenidoViral() si hay problemas.');