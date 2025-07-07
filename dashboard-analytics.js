/**
 * 📊 Dashboard Analítico para MarketInsight Pro
 * 
 * BENEFICIOS PARA AFILIADOS:
 * - 📈 Visualiza tu progreso y métricas
 * - 💰 Rastrea productos más rentables
 * - 🎯 Identifica nichos ganadores
 * - 📊 Compara análisis históricos
 * - 🚀 Optimiza tus campañas
 */

class DashboardAnalytics {
    constructor() {
        this.STORAGE_KEY = 'market_insight_analytics';
        this.analyses = this.loadAnalyses();
        this.charts = {};
        
        console.log('📊 Dashboard Analítico iniciado');
    }

    /**
     * Guarda un nuevo análisis con métricas de afiliado
     */
    saveAnalysis(data) {
        const analysis = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            nicho: data.nicho || 'General',
            publico: data.publico || 'No especificado',
            productos: data.productos || [],
            config: {
                rangoPrecios: data.rangoPrecios,
                tipoProducto: data.tipoProducto,
                presupuestoAds: data.presupuestoAds,
                roiObjetivo: data.roiObjetivo,
                canalPrincipal: data.canalPrincipal
            },
            metrics: this.calculateAfiliateMetrics(data.productos),
            cacheStatus: data.fromCache || false
        };

        this.analyses.unshift(analysis);
        
        // Mantener máximo 500 análisis (más que antes para mejor histórico)
        if (this.analyses.length > 500) {
            this.analyses = this.analyses.slice(0, 500);
        }

        this.saveAnalyses();
        this.updateDashboardIfVisible();
        
        console.log(`✅ Análisis guardado: ${analysis.nicho} - ${analysis.metrics.totalProductos} productos`);
        
        return analysis;
    }

    /**
     * Calcula métricas específicas para afiliados
     */
    calculateAfiliateMetrics(productos) {
        if (!productos || productos.length === 0) {
            return {
                totalProductos: 0,
                scorePromedio: 0,
                comisionPromedio: 0,
                precioPromedio: 0,
                potencialMensual: 0,
                mejorProducto: null,
                peorProducto: null,
                rangoComisiones: { min: 0, max: 0 },
                productosHighTicket: 0,
                productosRecurrentes: 0
            };
        }

        const metrics = {
            totalProductos: productos.length,
            scorePromedio: 0,
            comisionPromedio: 0,
            precioPromedio: 0,
            potencialMensual: 0,
            mejorProducto: null,
            peorProducto: null,
            rangoComisiones: { min: 999999, max: 0 },
            productosHighTicket: 0,
            productosRecurrentes: 0
        };

        let totalScore = 0;
        let totalComisionPorcentaje = 0;
        let totalComisionDolares = 0;
        let totalPrecio = 0;
        let mejorScore = 0;
        let peorScore = 100;

        productos.forEach(producto => {
            // Score
            const score = producto.score || 0;
            totalScore += score;
            
            if (score > mejorScore) {
                mejorScore = score;
                metrics.mejorProducto = {
                    nombre: producto.nombre,
                    score: score,
                    comision: producto.comision
                };
            }
            
            if (score < peorScore && score > 0) {
                peorScore = score;
                metrics.peorProducto = {
                    nombre: producto.nombre,
                    score: score,
                    comision: producto.comision
                };
            }

            // Comisiones
            const comisionMatch = (producto.comision || '').match(/(\d+)%/);
            if (comisionMatch) {
                const porcentaje = parseInt(comisionMatch[1]);
                totalComisionPorcentaje += porcentaje;
            }

            // Extraer comisión en dólares
            const comisionDolarMatch = (producto.comision || '').match(/\$(\d+(?:\.\d+)?)/);
            if (comisionDolarMatch) {
                const dolares = parseFloat(comisionDolarMatch[1]);
                totalComisionDolares += dolares;
                
                if (dolares < metrics.rangoComisiones.min) {
                    metrics.rangoComisiones.min = dolares;
                }
                if (dolares > metrics.rangoComisiones.max) {
                    metrics.rangoComisiones.max = dolares;
                }
            }

            // Precio
            const precioMatch = (producto.precio || '').match(/\$(\d+(?:\.\d+)?)/);
            if (precioMatch) {
                const precio = parseFloat(precioMatch[1]);
                totalPrecio += precio;
                
                // High ticket (>$200)
                if (precio > 200) {
                    metrics.productosHighTicket++;
                }
            }

            // Detectar si es recurrente
            if (producto.nombre && (producto.nombre.toLowerCase().includes('suscr') || 
                producto.nombre.toLowerCase().includes('member') ||
                producto.descripcion && producto.descripcion.toLowerCase().includes('mensual'))) {
                metrics.productosRecurrentes++;
            }
        });

        // Calcular promedios
        metrics.scorePromedio = Math.round(totalScore / productos.length);
        metrics.comisionPromedio = Math.round(totalComisionPorcentaje / productos.length);
        metrics.precioPromedio = Math.round(totalPrecio / productos.length);
        
        // Calcular potencial mensual (asumiendo 10 ventas por producto)
        const ventasEstimadas = 10; // Conservador
        metrics.potencialMensual = Math.round(totalComisionDolares * ventasEstimadas);

        // Si no hay rango, usar promedio
        if (metrics.rangoComisiones.min === 999999) {
            metrics.rangoComisiones.min = 0;
        }

        return metrics;
    }

    /**
     * Carga análisis del localStorage
     */
    loadAnalyses() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error cargando análisis:', error);
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
            // Si hay error de espacio, limpiar los más antiguos
            if (error.name === 'QuotaExceededError') {
                this.analyses = this.analyses.slice(0, 250);
                try {
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.analyses));
                } catch (retryError) {
                    console.error('No se pudo guardar incluso después de limpiar:', retryError);
                }
            }
        }
    }

    /**
     * Obtiene estadísticas optimizadas para afiliados
     */
    getAfiliateStats() {
        const stats = {
            totalAnalisis: this.analyses.length,
            nichoMasRentable: '',
            promedioProductos: 0,
            mejorComisionPromedio: 0,
            potencialMensualTotal: 0,
            tendencia7Dias: { analisis: 0, productos: 0 },
            tendencia30Dias: { analisis: 0, productos: 0 },
            topNichos: [],
            distribucionPrecios: { bajo: 0, medio: 0, alto: 0, muyAlto: 0 },
            canalesUsados: {},
            tasaExito: 0
        };

        if (this.analyses.length === 0) return stats;

        // Análisis por nicho
        const nichoStats = {};
        let totalProductos = 0;
        let totalPotencialMensual = 0;
        let analisisConProductos = 0;

        const now = new Date();
        const hace7Dias = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const hace30Dias = new Date(now - 30 * 24 * 60 * 60 * 1000);

        this.analyses.forEach(analysis => {
            const nicho = analysis.nicho || 'Sin especificar';
            
            // Inicializar stats del nicho
            if (!nichoStats[nicho]) {
                nichoStats[nicho] = {
                    count: 0,
                    totalProductos: 0,
                    totalComision: 0,
                    totalPotencial: 0,
                    scores: []
                };
            }

            nichoStats[nicho].count++;
            nichoStats[nicho].totalProductos += analysis.metrics.totalProductos;
            nichoStats[nicho].totalComision += analysis.metrics.comisionPromedio;
            nichoStats[nicho].totalPotencial += analysis.metrics.potencialMensual;
            nichoStats[nicho].scores.push(analysis.metrics.scorePromedio);

            totalProductos += analysis.metrics.totalProductos;
            totalPotencialMensual += analysis.metrics.potencialMensual;

            if (analysis.metrics.totalProductos > 0) {
                analisisConProductos++;
            }

            // Tendencias temporales
            const analysisDate = new Date(analysis.timestamp);
            if (analysisDate > hace7Dias) {
                stats.tendencia7Dias.analisis++;
                stats.tendencia7Dias.productos += analysis.metrics.totalProductos;
            }
            if (analysisDate > hace30Dias) {
                stats.tendencia30Dias.analisis++;
                stats.tendencia30Dias.productos += analysis.metrics.totalProductos;
            }

            // Distribución de precios
            const rangoPrecio = analysis.config.rangoPrecios;
            if (rangoPrecio) {
                stats.distribucionPrecios[rangoPrecio] = (stats.distribucionPrecios[rangoPrecio] || 0) + 1;
            }

            // Canales usados
            const canal = analysis.config.canalPrincipal;
            if (canal) {
                stats.canalesUsados[canal] = (stats.canalesUsados[canal] || 0) + 1;
            }
        });

        // Encontrar nicho más rentable
        let maxPotencial = 0;
        let mejorComision = 0;
        
        Object.entries(nichoStats).forEach(([nicho, data]) => {
            const potencialPromedio = data.totalPotencial / data.count;
            const comisionPromedio = data.totalComision / data.count;
            
            if (potencialPromedio > maxPotencial) {
                maxPotencial = potencialPromedio;
                stats.nichoMasRentable = nicho;
            }
            
            if (comisionPromedio > mejorComision) {
                mejorComision = comisionPromedio;
            }
        });

        // Top 5 nichos por potencial
        stats.topNichos = Object.entries(nichoStats)
            .map(([nicho, data]) => ({
                nicho,
                analisis: data.count,
                productos: data.totalProductos,
                potencialPromedio: Math.round(data.totalPotencial / data.count),
                scorePromedio: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
            }))
            .sort((a, b) => b.potencialPromedio - a.potencialPromedio)
            .slice(0, 5);

        stats.promedioProductos = Math.round(totalProductos / this.analyses.length);
        stats.mejorComisionPromedio = Math.round(mejorComision);
        stats.potencialMensualTotal = totalPotencialMensual;
        stats.tasaExito = Math.round((analisisConProductos / this.analyses.length) * 100);

        return stats;
    }

    /**
     * Genera el HTML del dashboard optimizado para afiliados
     */
    generateDashboardHTML() {
        const stats = this.getAfiliateStats();

        return `
        <div class="dashboard-container">
            <div class="dashboard-header">
                <h2>📊 Dashboard de Afiliado Pro</h2>
                <div class="dashboard-actions">
                    <button class="btn btn-secondary" onclick="dashboard.exportData()">
                        📥 Exportar Datos
                    </button>
                    <button class="btn btn-secondary" onclick="dashboard.clearOldData()">
                        🧹 Limpiar Antiguos
                    </button>
                </div>
            </div>

            <!-- KPIs principales para afiliados -->
            <div class="kpi-section">
                <div class="kpi-card highlight">
                    <div class="kpi-icon">💰</div>
                    <div class="kpi-value">$${stats.potencialMensualTotal.toLocaleString()}</div>
                    <div class="kpi-label">Potencial Mensual Total</div>
                    <div class="kpi-trend">Basado en 10 ventas/producto</div>
                </div>
                
                <div class="kpi-card">
                    <div class="kpi-icon">🏆</div>
                    <div class="kpi-value">${stats.nichoMasRentable}</div>
                    <div class="kpi-label">Nicho Más Rentable</div>
                    <div class="kpi-trend">${stats.mejorComisionPromedio}% comisión promedio</div>
                </div>
                
                <div class="kpi-card">
                    <div class="kpi-icon">📈</div>
                    <div class="kpi-value">${stats.tasaExito}%</div>
                    <div class="kpi-label">Tasa de Éxito</div>
                    <div class="kpi-trend">Análisis con productos encontrados</div>
                </div>
                
                <div class="kpi-card">
                    <div class="kpi-icon">📊</div>
                    <div class="kpi-value">${stats.totalAnalisis}</div>
                    <div class="kpi-label">Total Análisis</div>
                    <div class="kpi-trend">${stats.promedioProductos} productos/análisis</div>
                </div>
            </div>

            <!-- Tendencias -->
            <div class="trends-section">
                <h3>📈 Tendencias de Actividad</h3>
                <div class="trends-grid">
                    <div class="trend-card">
                        <h4>Últimos 7 días</h4>
                        <div class="trend-metrics">
                            <div class="trend-item">
                                <span class="trend-label">Análisis:</span>
                                <span class="trend-value">${stats.tendencia7Dias.analisis}</span>
                            </div>
                            <div class="trend-item">
                                <span class="trend-label">Productos:</span>
                                <span class="trend-value">${stats.tendencia7Dias.productos}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="trend-card">
                        <h4>Últimos 30 días</h4>
                        <div class="trend-metrics">
                            <div class="trend-item">
                                <span class="trend-label">Análisis:</span>
                                <span class="trend-value">${stats.tendencia30Dias.analisis}</span>
                            </div>
                            <div class="trend-item">
                                <span class="trend-label">Productos:</span>
                                <span class="trend-value">${stats.tendencia30Dias.productos}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Top Nichos -->
            <div class="top-nichos-section">
                <h3>🎯 Top 5 Nichos Más Rentables</h3>
                <div class="nichos-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Nicho</th>
                                <th>Análisis</th>
                                <th>Productos</th>
                                <th>Potencial/Mes</th>
                                <th>Score Avg</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stats.topNichos.map(nicho => `
                                <tr>
                                    <td><strong>${nicho.nicho}</strong></td>
                                    <td>${nicho.analisis}</td>
                                    <td>${nicho.productos}</td>
                                    <td class="highlight">$${nicho.potencialPromedio.toLocaleString()}</td>
                                    <td>
                                        <span class="score-badge score-${nicho.scorePromedio >= 70 ? 'high' : nicho.scorePromedio >= 50 ? 'medium' : 'low'}">
                                            ${nicho.scorePromedio}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Análisis recientes con más detalles -->
            <div class="recent-analyses-section">
                <h3>📋 Análisis Recientes</h3>
                <div class="analyses-grid">
                    ${this.getRecentAnalysesCards(5)}
                </div>
                
                <button class="btn btn-secondary" onclick="dashboard.showAllAnalyses()">
                    Ver Todos los Análisis
                </button>
            </div>

            <!-- Distribuciones -->
            <div class="distributions-section">
                <div class="distribution-card">
                    <h4>💵 Distribución por Rango de Precio</h4>
                    <div class="distribution-chart">
                        ${this.generatePriceDistributionChart(stats.distribucionPrecios)}
                    </div>
                </div>
                
                <div class="distribution-card">
                    <h4>📱 Canales Más Usados</h4>
                    <div class="distribution-chart">
                        ${this.generateChannelDistributionChart(stats.canalesUsados)}
                    </div>
                </div>
            </div>

            <!-- Recomendaciones -->
            <div class="recommendations-section">
                <h3>💡 Recomendaciones Basadas en tus Datos</h3>
                <div class="recommendations-grid">
                    ${this.generateRecommendations(stats)}
                </div>
            </div>
        </div>
        `;
    }

    /**
     * Genera tarjetas de análisis recientes
     */
    getRecentAnalysesCards(limit = 5) {
        const recentAnalyses = this.analyses.slice(0, limit);
        
        return recentAnalyses.map(analysis => {
            const date = new Date(analysis.timestamp);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            return `
            <div class="analysis-card ${analysis.cacheStatus ? 'from-cache' : ''}">
                <div class="analysis-header">
                    <h4>${analysis.nicho}</h4>
                    <span class="analysis-date">${dateStr}</span>
                    ${analysis.cacheStatus ? '<span class="cache-badge">💾 Cache</span>' : ''}
                </div>
                
                <div class="analysis-metrics">
                    <div class="metric">
                        <span class="metric-label">Productos:</span>
                        <span class="metric-value">${analysis.metrics.totalProductos}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Score Avg:</span>
                        <span class="metric-value">${analysis.metrics.scorePromedio}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Comisión Avg:</span>
                        <span class="metric-value">${analysis.metrics.comisionPromedio}%</span>
                    </div>
                    <div class="metric highlight">
                        <span class="metric-label">Potencial:</span>
                        <span class="metric-value">$${analysis.metrics.potencialMensual.toLocaleString()}</span>
                    </div>
                </div>
                
                ${analysis.metrics.mejorProducto ? `
                <div class="best-product">
                    <span class="best-product-label">⭐ Mejor:</span>
                    <span class="best-product-name">${analysis.metrics.mejorProducto.nombre}</span>
                </div>
                ` : ''}
                
                <div class="analysis-actions">
                    <button class="btn-small" onclick="dashboard.viewDetails('${analysis.id}')">
                        👁️ Detalles
                    </button>
                    <button class="btn-small" onclick="dashboard.compareWith('${analysis.id}')">
                        🔍 Comparar
                    </button>
                    <button class="btn-small" onclick="dashboard.deleteAnalysis('${analysis.id}')">
                        🗑️
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }

    /**
     * Genera gráfico de distribución de precios
     */
    generatePriceDistributionChart(distribution) {
        const labels = {
            'bajo': '💵 $10-50',
            'medio': '💰 $50-200',
            'alto': '💎 $200-500',
            'muyAlto': '🏆 $500+'
        };
        
        const total = Object.values(distribution).reduce((a, b) => a + b, 0);
        
        return Object.entries(distribution).map(([key, value]) => {
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `
            <div class="chart-bar">
                <div class="bar-label">${labels[key] || key}</div>
                <div class="bar-container">
                    <div class="bar-fill" style="width: ${percentage}%"></div>
                    <span class="bar-value">${value} (${percentage}%)</span>
                </div>
            </div>
            `;
        }).join('');
    }

    /**
     * Genera gráfico de distribución de canales
     */
    generateChannelDistributionChart(channels) {
        const icons = {
            'blog': '✍️',
            'youtube': '🎥',
            'instagram': '📸',
            'tiktok': '📱',
            'email': '📧',
            'paid': '💳'
        };
        
        const sortedChannels = Object.entries(channels).sort((a, b) => b[1] - a[1]);
        const total = Object.values(channels).reduce((a, b) => a + b, 0);
        
        return sortedChannels.map(([channel, count]) => {
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            return `
            <div class="chart-bar">
                <div class="bar-label">${icons[channel] || '📊'} ${channel}</div>
                <div class="bar-container">
                    <div class="bar-fill" style="width: ${percentage}%"></div>
                    <span class="bar-value">${count} (${percentage}%)</span>
                </div>
            </div>
            `;
        }).join('');
    }

    /**
     * Genera recomendaciones personalizadas
     */
    generateRecommendations(stats) {
        const recommendations = [];
        
        // Recomendación sobre nichos
        if (stats.nichoMasRentable) {
            recommendations.push({
                icon: '🎯',
                title: 'Enfócate en tu Nicho Estrella',
                text: `"${stats.nichoMasRentable}" está generando los mejores resultados. Considera dedicar más tiempo a este nicho.`
            });
        }
        
        // Recomendación sobre productos
        if (stats.promedioProductos < 5) {
            recommendations.push({
                icon: '🔍',
                title: 'Amplía tu Búsqueda',
                text: 'Estás encontrando pocos productos por análisis. Prueba keywords más amplias o nichos relacionados.'
            });
        }
        
        // Recomendación sobre actividad
        if (stats.tendencia7Dias.analisis < 3) {
            recommendations.push({
                icon: '📈',
                title: 'Aumenta tu Actividad',
                text: 'Has hecho pocos análisis esta semana. La consistencia es clave para encontrar productos ganadores.'
            });
        }
        
        // Recomendación sobre canales
        const canalesUsados = Object.keys(stats.canalesUsados).length;
        if (canalesUsados < 3) {
            recommendations.push({
                icon: '📱',
                title: 'Diversifica tus Canales',
                text: 'Estás usando pocos canales de promoción. Prueba diferentes plataformas para maximizar tu alcance.'
            });
        }
        
        // Recomendación sobre caché
        const cacheEfficiency = window.cache ? window.cache.getDetailedStats().cacheEfficiency : '0%';
        if (parseInt(cacheEfficiency) > 50) {
            recommendations.push({
                icon: '💰',
                title: 'Excelente Uso del Caché',
                text: `Estás ahorrando dinero con ${cacheEfficiency} de eficiencia en caché. ¡Sigue así!`
            });
        }
        
        return recommendations.map(rec => `
            <div class="recommendation-card">
                <div class="recommendation-icon">${rec.icon}</div>
                <div class="recommendation-content">
                    <h4>${rec.title}</h4>
                    <p>${rec.text}</p>
                </div>
            </div>
        `).join('');
    }

    /**
     * Muestra el dashboard en un modal
     */
    show() {
        // Verificar si ya existe un modal
        const existingModal = document.querySelector('.dashboard-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
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
        
        // Animar entrada
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    /**
     * Actualiza el dashboard si está visible
     */
    updateDashboardIfVisible() {
        const modalContent = document.querySelector('.dashboard-modal-content');
        if (modalContent) {
            // Actualizar solo el contenido, no todo el modal
            const dashboardHTML = this.generateDashboardHTML();
            modalContent.innerHTML = `
                <span class="close-modal" onclick="dashboard.close()">&times;</span>
                ${dashboardHTML}
            `;
        }
    }

    /**
     * Ver detalles de un análisis
     */
    viewDetails(analysisId) {
        const analysis = this.analyses.find(a => a.id === analysisId);
        if (!analysis) return;

        const detailsHTML = `
        <div class="analysis-details">
            <h3>📋 Detalles del Análisis</h3>
            
            <div class="details-section">
                <h4>Información General</h4>
                <div class="details-grid">
                    <div><strong>Nicho:</strong> ${analysis.nicho}</div>
                    <div><strong>Público:</strong> ${analysis.publico}</div>
                    <div><strong>Fecha:</strong> ${new Date(analysis.timestamp).toLocaleString()}</div>
                    <div><strong>Desde Caché:</strong> ${analysis.cacheStatus ? 'Sí 💾' : 'No 🌐'}</div>
                </div>
            </div>
            
            <div class="details-section">
                <h4>Configuración</h4>
                <div class="details-grid">
                    <div><strong>Rango Precios:</strong> ${analysis.config.rangoPrecios}</div>
                    <div><strong>Tipo Producto:</strong> ${analysis.config.tipoProducto}</div>
                    <div><strong>Presupuesto Ads:</strong> $${analysis.config.presupuestoAds}</div>
                    <div><strong>ROI Objetivo:</strong> ${analysis.config.roiObjetivo}x</div>
                    <div><strong>Canal Principal:</strong> ${analysis.config.canalPrincipal}</div>
                </div>
            </div>
            
            <div class="details-section">
                <h4>Métricas</h4>
                <div class="metrics-summary">
                    <div class="metric-card">
                        <span class="label">Total Productos</span>
                        <span class="value">${analysis.metrics.totalProductos}</span>
                    </div>
                    <div class="metric-card">
                        <span class="label">Score Promedio</span>
                        <span class="value">${analysis.metrics.scorePromedio}</span>
                    </div>
                    <div class="metric-card">
                        <span class="label">Comisión Promedio</span>
                        <span class="value">${analysis.metrics.comisionPromedio}%</span>
                    </div>
                    <div class="metric-card highlight">
                        <span class="label">Potencial Mensual</span>
                        <span class="value">$${analysis.metrics.potencialMensual.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            ${analysis.metrics.mejorProducto ? `
            <div class="details-section">
                <h4>Mejor Producto</h4>
                <div class="best-product-details">
                    <strong>${analysis.metrics.mejorProducto.nombre}</strong><br>
                    Score: ${analysis.metrics.mejorProducto.score} | 
                    Comisión: ${analysis.metrics.mejorProducto.comision}
                </div>
            </div>
            ` : ''}
            
            <div class="details-actions">
                <button class="btn btn-secondary" onclick="dashboard.exportAnalysis('${analysisId}')">
                    📥 Exportar
                </button>
                <button class="btn btn-secondary" onclick="dashboard.repeatAnalysis('${analysisId}')">
                    🔄 Repetir Análisis
                </button>
                <button class="btn btn-primary" onclick="dashboard.closeDetails()">
                    ✅ Cerrar
                </button>
            </div>
        </div>
        `;

        // Mostrar en modal secundario
        const detailsModal = document.createElement('div');
        detailsModal.className = 'details-modal';
        detailsModal.innerHTML = detailsHTML;
        document.querySelector('.dashboard-modal').appendChild(detailsModal);
    }

    /**
     * Cierra los detalles
     */
    closeDetails() {
        const detailsModal = document.querySelector('.details-modal');
        if (detailsModal) {
            detailsModal.remove();
        }
    }

    /**
     * Comparar con otro análisis
     */
    compareWith(analysisId) {
        // TODO: Implementar comparación lado a lado
        alert('Función de comparación próximamente disponible');
    }

    /**
     * Eliminar un análisis
     */
    deleteAnalysis(analysisId) {
        if (confirm('¿Estás seguro de eliminar este análisis?')) {
            this.analyses = this.analyses.filter(a => a.id !== analysisId);
            this.saveAnalyses();
            this.updateDashboardIfVisible();
            
            Utils.showStatus('✅ Análisis eliminado', 'success');
        }
    }

    /**
     * Mostrar todos los análisis
     */
    showAllAnalyses() {
        // TODO: Implementar vista completa con paginación
        alert('Vista completa próximamente disponible');
    }

    /**
     * Limpiar datos antiguos
     */
    clearOldData() {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - 3); // Más de 3 meses
        
        const before = this.analyses.length;
        this.analyses = this.analyses.filter(a => new Date(a.timestamp) > cutoffDate);
        const after = this.analyses.length;
        
        const deleted = before - after;
        
        if (deleted > 0) {
            this.saveAnalyses();
            this.updateDashboardIfVisible();
            Utils.showStatus(`✅ ${deleted} análisis antiguos eliminados`, 'success');
        } else {
            Utils.showStatus('No hay análisis antiguos para eliminar', 'info');
        }
    }

    /**
     * Exportar análisis específico
     */
    exportAnalysis(analysisId) {
        const analysis = this.analyses.find(a => a.id === analysisId);
        if (!analysis) return;

        const exportData = {
            ...analysis,
            exportDate: new Date().toISOString(),
            version: 'MarketInsight Pro v2.0'
        };

        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `analisis-${analysis.nicho.replace(/\s+/g, '-')}-${analysis.id}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        Utils.showStatus('✅ Análisis exportado', 'success');
    }

    /**
     * Repetir un análisis
     */
    repeatAnalysis(analysisId) {
        const analysis = this.analyses.find(a => a.id === analysisId);
        if (!analysis) return;

        // Llenar los campos del formulario
        document.getElementById('nicho').value = analysis.nicho;
        document.getElementById('publico').value = analysis.publico;
        
        Object.entries(analysis.config).forEach(([key, value]) => {
            const field = document.getElementById(key);
            if (field) {
                field.value = value;
            }
        });

        // Cerrar dashboard
        this.close();
        
        // Scroll al formulario
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
        
        Utils.showStatus('✅ Configuración cargada. Haz clic en "Detectar Productos Ganadores"', 'success');
    }

    /**
     * Exporta todos los datos a CSV
     */
    exportData() {
        const headers = [
            'Fecha',
            'Nicho',
            'Público',
            'Productos',
            'Score Promedio',
            'Comisión Promedio',
            'Potencial Mensual',
            'Mejor Producto',
            'Canal Principal',
            'Presupuesto Ads',
            'ROI Objetivo',
            'Desde Caché'
        ];
        
        const rows = this.analyses.map(analysis => {
            return [
                new Date(analysis.timestamp).toLocaleString(),
                analysis.nicho,
                analysis.publico,
                analysis.metrics.totalProductos,
                analysis.metrics.scorePromedio,
                analysis.metrics.comisionPromedio + '%',
                '$' + analysis.metrics.potencialMensual,
                analysis.metrics.mejorProducto ? analysis.metrics.mejorProducto.nombre : 'N/A',
                analysis.config.canalPrincipal || 'N/A',
                '$' + (analysis.config.presupuestoAds || 0),
                (analysis.config.roiObjetivo || 0) + 'x',
                analysis.cacheStatus ? 'Sí' : 'No'
            ].map(cell => `"${cell}"`).join(',');
        });

        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `marketinsight-analytics-${Date.now()}.csv`;
        a.click();
        
        URL.revokeObjectURL(url);
        Utils.showStatus('✅ Datos exportados exitosamente', 'success');
    }

    /**
     * Cierra el dashboard
     */
    close() {
        const modal = document.querySelector('.dashboard-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
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
    background: rgba(0, 0, 0, 0.9);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.dashboard-modal.show {
    opacity: 1;
}

.dashboard-modal-content {
    background: #1a202c;
    width: 95%;
    max-width: 1400px;
    height: 90%;
    border-radius: 20px;
    padding: 30px;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.close-modal {
    position: absolute;
    top: 20px;
    right: 30px;
    font-size: 30px;
    color: #718096;
    cursor: pointer;
    transition: color 0.3s;
    z-index: 10;
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

.dashboard-actions {
    display: flex;
    gap: 10px;
}

/* KPIs */
.kpi-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
}

.kpi-card {
    background: rgba(45, 55, 72, 0.6);
    border-radius: 15px;
    padding: 25px;
    text-align: center;
    border: 2px solid #2d3748;
    transition: all 0.3s ease;
}

.kpi-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.kpi-card.highlight {
    background: linear-gradient(135deg, rgba(72, 187, 120, 0.2) 0%, rgba(56, 161, 105, 0.2) 100%);
    border-color: #48bb78;
}

.kpi-icon {
    font-size: 2.5rem;
    margin-bottom: 10px;
}

.kpi-value {
    font-size: 2rem;
    font-weight: 700;
    color: #48bb78;
    margin-bottom: 5px;
}

.kpi-label {
    color: #a0aec0;
    font-size: 0.9rem;
    margin-bottom: 5px;
}

.kpi-trend {
    color: #718096;
    font-size: 0.8rem;
}

/* Tendencias */
.trends-section {
    background: rgba(45, 55, 72, 0.4);
    border-radius: 15px;
    padding: 25px;
    margin-bottom: 30px;
}

.trends-section h3 {
    color: #e2e8f0;
    margin-bottom: 20px;
}

.trends-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.trend-card {
    background: rgba(26, 32, 44, 0.6);
    padding: 20px;
    border-radius: 10px;
    border: 1px solid #4a5568;
}

.trend-card h4 {
    color: #90cdf4;
    margin-bottom: 15px;
}

.trend-metrics {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.trend-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.trend-label {
    color: #a0aec0;
}

.trend-value {
    color: #48bb78;
    font-weight: 600;
    font-size: 1.1rem;
}

/* Top Nichos */
.top-nichos-section {
    background: rgba(45, 55, 72, 0.4);
    border-radius: 15px;
    padding: 25px;
    margin-bottom: 30px;
}

.nichos-table {
    overflow-x: auto;
}

.nichos-table table {
    width: 100%;
    border-collapse: collapse;
}

.nichos-table th {
    background: #2d3748;
    color: #e2e8f0;
    padding: 12px;
    text-align: left;
    font-weight: 600;
}

.nichos-table td {
    padding: 12px;
    border-bottom: 1px solid #2d3748;
    color: #cbd5e0;
}

.nichos-table tr:hover {
    background: rgba(45, 55, 72, 0.3);
}

.nichos-table .highlight {
    color: #48bb78;
    font-weight: 600;
}

.score-badge {
    padding: 4px 8px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.9rem;
}

.score-high {
    background: rgba(72, 187, 120, 0.2);
    color: #48bb78;
}

.score-medium {
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
}

.score-low {
    background: rgba(245, 101, 101, 0.2);
    color: #fc8181;
}

/* Análisis recientes */
.recent-analyses-section {
    margin-bottom: 30px;
}

.recent-analyses-section h3 {
    color: #e2e8f0;
    margin-bottom: 20px;
}

.analyses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
}

.analysis-card {
    background: rgba(45, 55, 72, 0.6);
    border-radius: 12px;
    padding: 20px;
    border: 2px solid #2d3748;
    transition: all 0.3s ease;
}

.analysis-card:hover {
    border-color: #4299e1;
    transform: translateY(-3px);
}

.analysis-card.from-cache {
    border-color: #f59e0b;
}

.analysis-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.analysis-header h4 {
    color: #e2e8f0;
    margin: 0;
}

.analysis-date {
    color: #718096;
    font-size: 0.85rem;
}

.cache-badge {
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
}

.analysis-metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 15px;
}

.metric {
    display: flex;
    justify-content: space-between;
}

.metric-label {
    color: #a0aec0;
    font-size: 0.9rem;
}

.metric-value {
    color: #e2e8f0;
    font-weight: 600;
}

.metric.highlight .metric-value {
    color: #48bb78;
}

.best-product {
    background: rgba(72, 187, 120, 0.1);
    padding: 8px 12px;
    border-radius: 8px;
    margin-bottom: 15px;
    font-size: 0.9rem;
}

.best-product-label {
    color: #48bb78;
}

.best-product-name {
    color: #e2e8f0;
}

.analysis-actions {
    display: flex;
    gap: 5px;
}

.btn-small {
    padding: 5px 10px;
    background: #4299e1;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.3s ease;
}

.btn-small:hover {
    background: #3182ce;
    transform: translateY(-1px);
}

/* Distribuciones */
.distributions-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 30px;
}

.distribution-card {
    background: rgba(45, 55, 72, 0.4);
    border-radius: 15px;
    padding: 20px;
}

.distribution-card h4 {
    color: #e2e8f0;
    margin-bottom: 20px;
}

.chart-bar {
    margin-bottom: 15px;
}

.bar-label {
    color: #a0aec0;
    font-size: 0.9rem;
    margin-bottom: 5px;
}

.bar-container {
    background: rgba(26, 32, 44, 0.6);
    border-radius: 6px;
    height: 30px;
    position: relative;
    overflow: hidden;
}

.bar-fill {
    background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
    height: 100%;
    transition: width 0.5s ease;
}

.bar-value {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #e2e8f0;
    font-size: 0.85rem;
    font-weight: 600;
}

/* Recomendaciones */
.recommendations-section {
    background: rgba(139, 92, 246, 0.1);
    border-radius: 15px;
    padding: 25px;
    border: 2px solid #8b5cf6;
}

.recommendations-section h3 {
    color: #a78bfa;
    margin-bottom: 20px;
}

.recommendations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.recommendation-card {
    display: flex;
    gap: 15px;
    padding: 15px;
    background: rgba(139, 92, 246, 0.05);
    border-radius: 10px;
    border: 1px solid rgba(139, 92, 246, 0.2);
}

.recommendation-icon {
    font-size: 2rem;
}

.recommendation-content h4 {
    color: #e2e8f0;
    margin-bottom: 5px;
}

.recommendation-content p {
    color: #cbd5e0;
    font-size: 0.9rem;
    line-height: 1.4;
}

/* Modal de detalles */
.details-modal {
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

.analysis-details {
    background: #1a202c;
    border-radius: 15px;
    padding: 30px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
}

.analysis-details h3 {
    color: #48bb78;
    margin-bottom: 20px;
}

.details-section {
    margin-bottom: 25px;
}

.details-section h4 {
    color: #90cdf4;
    margin-bottom: 15px;
}

.details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.details-grid div {
    color: #cbd5e0;
}

.metrics-summary {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
}

.metric-card {
    background: rgba(45, 55, 72, 0.6);
    padding: 15px;
    border-radius: 8px;
    text-align: center;
}

.metric-card .label {
    display: block;
    color: #a0aec0;
    font-size: 0.9rem;
    margin-bottom: 5px;
}

.metric-card .value {
    display: block;
    color: #e2e8f0;
    font-size: 1.3rem;
    font-weight: 600;
}

.metric-card.highlight {
    background: linear-gradient(135deg, rgba(72, 187, 120, 0.2) 0%, rgba(56, 161, 105, 0.2) 100%);
}

.metric-card.highlight .value {
    color: #48bb78;
}

.best-product-details {
    background: rgba(72, 187, 120, 0.1);
    padding: 15px;
    border-radius: 8px;
    color: #e2e8f0;
}

.details-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 20px;
}

/* Responsive */
@media (max-width: 768px) {
    .dashboard-modal-content {
        width: 95%;
        padding: 20px;
    }
    
    .kpi-section {
        grid-template-columns: 1fr;
    }
    
    .trends-grid {
        grid-template-columns: 1fr;
    }
    
    .distributions-section {
        grid-template-columns: 1fr;
    }
    
    .analyses-grid {
        grid-template-columns: 1fr;
    }
    
    .dashboard-header {
        flex-direction: column;
        gap: 15px;
    }
    
    .dashboard-actions {
        width: 100%;
        justify-content: center;
    }
}

/* Animaciones */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.kpi-card,
.analysis-card,
.recommendation-card {
    animation: fadeIn 0.5s ease;
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
    button.className = 'btn btn-secondary dashboard-btn';
    button.innerHTML = '📊 Ver Dashboard';
    button.onclick = () => dashboard.show();
    
    // Buscar dónde insertar el botón
    const apiSection = document.querySelector('.api-section');
    if (apiSection) {
        // Buscar si ya existe el botón de caché
        const cacheBtn = apiSection.querySelector('.cache-stats-btn');
        if (cacheBtn) {
            // Insertar después del botón de caché
            cacheBtn.insertAdjacentElement('afterend', button);
        } else {
            // Si no, agregar al final de la sección
            const buttonGroup = document.createElement('div');
            buttonGroup.style.marginTop = '10px';
            buttonGroup.style.display = 'flex';
            buttonGroup.style.gap = '10px';
            buttonGroup.appendChild(button);
            apiSection.appendChild(buttonGroup);
        }
    }
}

// Función para integrarse con el sistema existente
function integrateDashboardWithApp() {
    // Sobrescribir o extender la función displayResults
    const originalDisplayResults = window.UIManager ? window.UIManager.displayResults : null;
    
    if (window.UIManager) {
        window.UIManager.displayResults = function(analysisData) {
            // Llamar a la función original
            if (originalDisplayResults) {
                originalDisplayResults.call(this, analysisData);
            }
            
            // Guardar en dashboard
            const config = window.App ? window.App.gatherAnalysisConfig() : {};
            dashboard.saveAnalysis({
                nicho: config.nicho || document.getElementById('nicho')?.value,
                publico: config.publico || document.getElementById('publico')?.value,
                productos: analysisData.productos,
                rangoPrecios: config.rangoPrecios,
                tipoProducto: config.tipoProducto,
                presupuestoAds: config.presupuestoAds,
                roiObjetivo: config.roiObjetivo,
                canalPrincipal: config.canalPrincipal,
                fromCache: analysisData.fromCache || false
            });
        };
    }
    
    console.log('✅ Dashboard integrado con la aplicación');
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        addDashboardButton();
        integrateDashboardWithApp();
    });
} else {
    addDashboardButton();
    integrateDashboardWithApp();
}

// Exportar para uso global
window.DashboardAnalytics = DashboardAnalytics;
window.dashboard = dashboard;