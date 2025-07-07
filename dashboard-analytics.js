/**
 * Dashboard Analítico para MarketInsight Pro
 * Visualización de métricas y análisis históricos
 */

class DashboardAnalytics {
    constructor() {
        this.STORAGE_KEY = 'market_insight_analytics';
        this.analyses = this.loadAnalyses();
        this.charts = {};
    }

    /**
     * Guarda un nuevo análisis en el histórico
     */
    saveAnalysis(data) {
        const analysis = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            nicho: data.nicho,
            productos: data.productos || [],
            config: {
                publico: data.publico,
                rangoPrecios: data.rangoPrecios,
                tipoProducto: data.tipoProducto,
                presupuestoAds: data.presupuestoAds,
                roiObjetivo: data.roiObjetivo
            },
            metrics: this.calculateMetrics(data.productos)
        };

        this.analyses.unshift(analysis);
        
        // Mantener máximo 100 análisis
        if (this.analyses.length > 100) {
            this.analyses = this.analyses.slice(0, 100);
        }

        this.saveAnalyses();
        return analysis;
    }

    /**
     * Calcula métricas agregadas de los productos
     */
    calculateMetrics(productos) {
        if (!productos || productos.length === 0) {
            return {
                totalProductos: 0,
                scorePromedio: 0,
                comisionPromedio: 0,
                roiEstimado: 0,
                mejorProducto: null
            };
        }

        const metrics = {
            totalProductos: productos.length,
            scorePromedio: 0,
            comisionPromedio: 0,
            roiEstimado: 0,
            mejorProducto: null
        };

        let totalScore = 0;
        let totalComision = 0;
        let mejorScore = 0;

        productos.forEach(producto => {
            const score = producto.score || 0;
            totalScore += score;

            // Extraer comisión numérica
            const comisionMatch = (producto.comision || '').match(/(\d+)%/);
            if (comisionMatch) {
                totalComision += parseInt(comisionMatch[1]);
            }

            if (score > mejorScore) {
                mejorScore = score;
                metrics.mejorProducto = producto.nombre;
            }
        });

        metrics.scorePromedio = Math.round(totalScore / productos.length);
        metrics.comisionPromedio = Math.round(totalComision / productos.length);
        metrics.roiEstimado = metrics.comisionPromedio * 3; // Estimación simple

        return metrics;
    }

    /**
     * Carga análisis del localStorage
     */
    loadAnalyses() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    /**
     * Guarda análisis en localStorage
     */
    saveAnalyses() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.analyses));
        } catch (error) {
            console.error('Error guardando análisis:', error);
        }
    }

    /**
     * Obtiene estadísticas generales
     */
    getOverallStats() {
        const stats = {
            totalAnalisis: this.analyses.length,
            nichoMasAnalizado: '',
            promedioProductos: 0,
            mejorROI: 0,
            tendencia7Dias: 0,
            tendencia30Dias: 0
        };

        if (this.analyses.length === 0) return stats;

        // Contar nichos
        const nichos = {};
        let totalProductos = 0;
        let maxROI = 0;

        this.analyses.forEach(analysis => {
            // Contar nichos
            const nicho = analysis.nicho || 'Sin especificar';
            nichos[nicho] = (nichos[nicho] || 0) + 1;

            // Sumar productos
            totalProductos += analysis.metrics.totalProductos;

            // Buscar mejor ROI
            if (analysis.metrics.roiEstimado > maxROI) {
                maxROI = analysis.metrics.roiEstimado;
            }
        });

        // Nicho más analizado
        let maxCount = 0;
        Object.entries(nichos).forEach(([nicho, count]) => {
            if (count > maxCount) {
                maxCount = count;
                stats.nichoMasAnalizado = nicho;
            }
        });

        stats.promedioProductos = Math.round(totalProductos / this.analyses.length);
        stats.mejorROI = maxROI;

        // Calcular tendencias
        const now = new Date();
        const hace7Dias = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const hace30Dias = new Date(now - 30 * 24 * 60 * 60 * 1000);

        const analisis7Dias = this.analyses.filter(a => 
            new Date(a.timestamp) > hace7Dias
        ).length;
        
        const analisis30Dias = this.analyses.filter(a => 
            new Date(a.timestamp) > hace30Dias
        ).length;

        stats.tendencia7Dias = analisis7Dias;
        stats.tendencia30Dias = analisis30Dias;

        return stats;
    }

    /**
     * Genera el HTML del dashboard
     */
    generateDashboardHTML() {
        const stats = this.getOverallStats();

        return `
        <div class="dashboard-container">
            <div class="dashboard-header">
                <h2>📊 Dashboard Analítico</h2>
                <button class="btn btn-secondary" onclick="dashboard.exportData()">
                    📥 Exportar Datos
                </button>
            </div>

            <!-- Métricas principales -->
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-icon">📈</div>
                    <div class="metric-value">${stats.totalAnalisis}</div>
                    <div class="metric-label">Análisis Totales</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon">🎯</div>
                    <div class="metric-value">${stats.nichoMasAnalizado}</div>
                    <div class="metric-label">Nicho Top</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon">📦</div>
                    <div class="metric-value">${stats.promedioProductos}</div>
                    <div class="metric-label">Productos/Análisis</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon">💰</div>
                    <div class="metric-value">${stats.mejorROI}%</div>
                    <div class="metric-label">Mejor ROI</div>
                </div>
            </div>

            <!-- Gráficos -->
            <div class="charts-container">
                <div class="chart-box">
                    <h3>📊 Análisis por Tiempo</h3>
                    <canvas id="timeChart"></canvas>
                </div>
                
                <div class="chart-box">
                    <h3>🎯 Distribución por Nichos</h3>
                    <canvas id="nichoChart"></canvas>
                </div>
            </div>

            <!-- Tabla de análisis recientes -->
            <div class="recent-analyses">
                <h3>📋 Análisis Recientes</h3>
                <div class="table-container">
                    <table class="analyses-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Nicho</th>
                                <th>Productos</th>
                                <th>Score Promedio</th>
                                <th>Mejor Producto</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.generateTableRows()}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Comparador -->
            <div class="comparator-section">
                <h3>🔍 Comparador de Productos</h3>
                <div id="comparatorContainer">
                    <p>Selecciona productos de los análisis para comparar</p>
                </div>
            </div>
        </div>
        `;
    }

    /**
     * Genera las filas de la tabla
     */
    generateTableRows() {
        const recentAnalyses = this.analyses.slice(0, 10);
        
        return recentAnalyses.map(analysis => {
            const date = new Date(analysis.timestamp);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            return `
            <tr>
                <td>${dateStr}</td>
                <td>${analysis.nicho}</td>
                <td>${analysis.metrics.totalProductos}</td>
                <td>${analysis.metrics.scorePromedio}</td>
                <td>${analysis.metrics.mejorProducto || 'N/A'}</td>
                <td>
                    <button class="btn-small" onclick="dashboard.viewDetails('${analysis.id}')">
                        👁️ Ver
                    </button>
                    <button class="btn-small" onclick="dashboard.compareProducts('${analysis.id}')">
                        🔍 Comparar
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    }

    /**
     * Muestra el dashboard en un modal
     */
    show() {
        // Crear modal
        const modal = document.createElement('div');
        modal.className = 'dashboard-modal';
        modal.innerHTML = `
            <div class="dashboard-modal-content">
                <span class="close-modal" onclick="dashboard.close()">&times;</span>
                ${this.generateDashboardHTML()}
            </div>
        `;

        document.body.appendChild(modal);

        // Inicializar gráficos después de un pequeño delay
        setTimeout(() => {
            this.initCharts();
        }, 100);
    }

    /**
     * Inicializa los gráficos con Chart.js (simulado)
     */
    initCharts() {
        // Gráfico de tiempo
        this.drawTimeChart();
        
        // Gráfico de nichos
        this.drawNichoChart();
    }

    /**
     * Dibuja el gráfico de análisis por tiempo
     */
    drawTimeChart() {
        const canvas = document.getElementById('timeChart');
        if (!canvas) return;

        // Aquí se integraría Chart.js
        // Por ahora, un placeholder visual
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#4299e1';
        ctx.fillRect(10, 50, 30, 100);
        ctx.fillRect(50, 30, 30, 120);
        ctx.fillRect(90, 40, 30, 110);
        ctx.fillRect(130, 20, 30, 130);
    }

    /**
     * Dibuja el gráfico de distribución por nichos
     */
    drawNichoChart() {
        const canvas = document.getElementById('nichoChart');
        if (!canvas) return;

        // Placeholder para gráfico de torta
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 60;

        // Simular sectores
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 0.6);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = '#48bb78';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI * 0.6, Math.PI * 1.2);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = '#4299e1';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI * 1.2, Math.PI * 2);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
    }

    /**
     * Cierra el dashboard
     */
    close() {
        const modal = document.querySelector('.dashboard-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Ver detalles de un análisis
     */
    viewDetails(analysisId) {
        const analysis = this.analyses.find(a => a.id === analysisId);
        if (!analysis) return;

        alert(`
Detalles del Análisis:
- Nicho: ${analysis.nicho}
- Fecha: ${new Date(analysis.timestamp).toLocaleString()}
- Productos encontrados: ${analysis.metrics.totalProductos}
- Score promedio: ${analysis.metrics.scorePromedio}
- Comisión promedio: ${analysis.metrics.comisionPromedio}%
- ROI estimado: ${analysis.metrics.roiEstimado}%
- Mejor producto: ${analysis.metrics.mejorProducto || 'N/A'}
        `);
    }

    /**
     * Exporta los datos a CSV
     */
    exportData() {
        const csv = this.generateCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `market-insight-analytics-${Date.now()}.csv`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Genera CSV de los análisis
     */
    generateCSV() {
        const headers = ['Fecha', 'Nicho', 'Productos', 'Score Promedio', 'Comisión Promedio', 'ROI Estimado', 'Mejor Producto'];
        const rows = this.analyses.map(analysis => {
            return [
                new Date(analysis.timestamp).toLocaleString(),
                analysis.nicho,
                analysis.metrics.totalProductos,
                analysis.metrics.scorePromedio,
                analysis.metrics.comisionPromedio + '%',
                analysis.metrics.roiEstimado + '%',
                analysis.metrics.mejorProducto || 'N/A'
            ].join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    }
}

// Estilos CSS para el dashboard
const dashboardStyles = `
<style>
.dashboard-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease;
}

.dashboard-modal-content {
    background: #1a202c;
    width: 90%;
    max-width: 1200px;
    height: 90%;
    border-radius: 20px;
    padding: 30px;
    overflow-y: auto;
    position: relative;
}

.close-modal {
    position: absolute;
    top: 20px;
    right: 30px;
    font-size: 30px;
    color: #718096;
    cursor: pointer;
    transition: color 0.3s;
}

.close-modal:hover {
    color: #e53e3e;
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
}

.dashboard-header h2 {
    color: #48bb78;
    font-size: 2rem;
    margin: 0;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
}

.metric-card {
    background: rgba(45, 55, 72, 0.6);
    border-radius: 15px;
    padding: 25px;
    text-align: center;
    border: 2px solid #2d3748;
    transition: all 0.3s ease;
}

.metric-card:hover {
    transform: translateY(-5px);
    border-color: #48bb78;
    box-shadow: 0 10px 25px rgba(72, 187, 120, 0.2);
}

.metric-icon {
    font-size: 2.5rem;
    margin-bottom: 10px;
}

.metric-value {
    font-size: 2rem;
    font-weight: 700;
    color: #48bb78;
    margin-bottom: 5px;
}

.metric-label {
    color: #a0aec0;
    font-size: 0.9rem;
}

.charts-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 40px;
}

.chart-box {
    background: rgba(45, 55, 72, 0.4);
    border-radius: 15px;
    padding: 20px;
    border: 1px solid #2d3748;
}

.chart-box h3 {
    color: #e2e8f0;
    margin-bottom: 20px;
}

.chart-box canvas {
    width: 100%;
    height: 200px;
}

.recent-analyses {
    background: rgba(45, 55, 72, 0.4);
    border-radius: 15px;
    padding: 25px;
    margin-bottom: 30px;
}

.recent-analyses h3 {
    color: #e2e8f0;
    margin-bottom: 20px;
}

.table-container {
    overflow-x: auto;
}

.analyses-table {
    width: 100%;
    border-collapse: collapse;
}

.analyses-table th {
    background: #2d3748;
    color: #e2e8f0;
    padding: 12px;
    text-align: left;
    font-weight: 600;
}

.analyses-table td {
    padding: 12px;
    border-bottom: 1px solid #2d3748;
    color: #cbd5e0;
}

.analyses-table tr:hover {
    background: rgba(45, 55, 72, 0.3);
}

.btn-small {
    padding: 5px 10px;
    margin: 0 2px;
    background: #4299e1;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.8rem;
}

.btn-small:hover {
    background: #3182ce;
}

.comparator-section {
    background: rgba(45, 55, 72, 0.4);
    border-radius: 15px;
    padding: 25px;
}

.comparator-section h3 {
    color: #e2e8f0;
    margin-bottom: 20px;
}

@media (max-width: 768px) {
    .dashboard-modal-content {
        width: 95%;
        padding: 20px;
    }
    
    .charts-container {
        grid-template-columns: 1fr;
    }
    
    .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
</style>
`;

// Inicializar dashboard
const dashboard = new DashboardAnalytics();

// Agregar estilos al documento
document.head.insertAdjacentHTML('beforeend', dashboardStyles);

// Función para agregar botón del dashboard
function addDashboardButton() {
    const button = document.createElement('button');
    button.className = 'btn btn-secondary';
    button.innerHTML = '📊 Ver Dashboard';
    button.onclick = () => dashboard.show();
    
    // Buscar un lugar apropiado para el botón
    const apiSection = document.querySelector('.api-section');
    if (apiSection) {
        apiSection.appendChild(button);
    }
}

// Auto-guardar análisis cuando se completa uno
window.addEventListener('analysisComplete', (event) => {
    if (event.detail && event.detail.data) {
        dashboard.saveAnalysis(event.detail.data);
    }
});

// Exportar para uso global
window.DashboardAnalytics = DashboardAnalytics;
window.dashboard = dashboard;
window.addDashboardButton = addDashboardButton;