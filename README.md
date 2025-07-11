# 🚀 MarketInsight Pro - AFFILIATE EDITION

<div align="center">
  <img src="https://img.shields.io/badge/version-2.0-blue.svg" />
  <img src="https://img.shields.io/badge/status-active-success.svg" />
  <img src="https://img.shields.io/badge/license-MIT-green.svg" />
</div>

## 📋 Descripción

**MarketInsight Pro** es una herramienta avanzada de análisis de nichos diseñada específicamente para afiliados digitales. Utiliza IA (Google Gemini) para detectar productos ganadores, generar contenido viral y crear avatares de cliente ultra-específicos.

### 🎯 Características Principales

- **🔍 Análisis de Productos**: Detecta productos ganadores con métricas detalladas
- **📊 Dashboard Analítico**: Visualiza tendencias y métricas históricas
- **🚀 Generador de Contenido Viral**: Crea contenido optimizado para cada plataforma
- **🧠 Avatar Ultra-Específico**: Perfiles psicológicos profundos de tu cliente ideal
- **💰 Calculadora de Profit**: Estima rentabilidad y ROI
- **📈 Predictor de Tendencias**: Identifica oportunidades emergentes
- **🏗️ Funnel Architect**: Diseña embudos de conversión optimizados

## 🛠️ Instalación

### Requisitos Previos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- API Key de Google AI Studio ([Obtener aquí](https://makersuite.google.com/app/apikey))
- Servidor web local (opcional para desarrollo)

### Pasos de Instalación

1. **Clona el repositorio**
```bash
git clone https://github.com/tu-usuario/marketinsight-pro.git
cd marketinsight-pro
```

2. **Abre en tu navegador**
```bash
# Opción 1: Directamente
open index.html

# Opción 2: Con servidor local
python -m http.server 8000
# Luego visita http://localhost:8000
```

3. **Configura tu API Key**
   - Abre la aplicación
   - Ingresa tu API Key de Google AI Studio
   - Haz clic en "Guardar" y luego "Probar"

## 📖 Guía de Uso

### 1. Análisis Básico de Nicho

1. Ingresa el **nicho de mercado** (ej: "Fitness y Bienestar")
2. Define tu **público objetivo** (ej: "Mujeres 25-45 años")
3. Selecciona los análisis que deseas realizar
4. Haz clic en "🚀 Detectar Productos Ganadores"

### 2. Generación de Contenido Viral

1. Completa primero un análisis de productos
2. Ve a la sección "Generador de Contenido Viral"
3. Selecciona las plataformas deseadas (TikTok, Instagram, etc.)
4. Configura el ángulo de venta y nivel de controversia
5. Haz clic en "🚀 Generar Contenido Viral"

### 3. Creación de Avatar

1. Ve a la sección "Avatar Ultra-Específico"
2. Configura los parámetros demográficos
3. Define la frustración principal y aspiración
4. Haz clic en "🧠 Crear Avatar Completo"

## 🔧 Configuración Avanzada

Los estilos están en `styles.css`. Principales variables:

```css
:root {
    --primary-color: #48bb78;
    --secondary-color: #4299e1;
    --background: #1a202c;
    --text-primary: #e2e8f0;
}
```

## 🚀 Mejoras Implementadas

### ✅ Completadas
- Sistema de contenido viral mejorado
- Integración con productos detectados
- Múltiples formatos por plataforma
- Sistema de avatares múltiples

### 🔄 En Progreso
- Sistema de caché inteligente
- Dashboard analítico
- Modularización del código

### 📅 Planificadas
- Modo comparación de productos
- Plantillas guardadas
- Integración con Google Sheets
- PWA y modo offline

## 📊 Arquitectura

```
marketinsight-pro/
├── index.html              # Página principal
├── script.js               # Lógica principal (6130 líneas)
├── styles.css              # Estilos (3804 líneas)
├── content-viral-enhanced.js    # Generador de contenido mejorado
├── avatar-sync-system.js        # Sistema de avatares
├── funnel-architect-standalone.html  # Diseñador de funnels
├── trend-predictor.html         # Predictor de tendencias
├── cache-manager.js*            # Sistema de caché (próximamente)
├── dashboard-analytics.js*      # Dashboard analítico (próximamente)
└── docs/                        # Documentación
```

## 🐛 Solución de Problemas

### API Key no funciona
- Verifica que la API Key sea válida en Google AI Studio
- Asegúrate de que empiece con "AIza"
- Comprueba que tengas créditos disponibles

### No se muestran productos
- Revisa la consola del navegador (F12)
- Verifica que el análisis se completó
- Intenta con un nicho más específico

### Error de cuota excedida
- Espera unos minutos antes de intentar de nuevo
- Considera implementar el sistema de caché
- Reduce el número de análisis simultáneos

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios propuestos.

## 📄 Licencia

Este proyecto está bajo licencia MIT.

---

<div align="center">
  Hecho con ❤️ para la comunidad de afiliados digitales
</div>
