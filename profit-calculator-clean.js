// 💰 CALCULADORA DE PROFIT CLEAN - 100% FUNCIONAL
// Calculadora simplificada y robusta para afiliados

console.log('💰 Iniciando Calculadora de Profit Clean...');

const ProfitCalculatorClean = {
    currentProduct: null,
    
    // Inicializar calculadora
    init: function() {
        console.log('🔧 Inicializando calculadora clean...');
        this.addCalculatorButton();
        this.addModalHTML();
        this.addCalculatorCSS();
        console.log('✅ Calculadora clean inicializada');
    },
    
    // Agregar botón de calculadora a productos
    addCalculatorButton: function() {
        // Buscar productos ya renderizados y agregar botón
        const productos = document.querySelectorAll('.product-card, .resultado-item');
        
        productos.forEach((producto, index) => {
            // Verificar si ya tiene botón
            if (producto.querySelector('.calc-clean-btn')) return;
            
            // Crear botón
            const calcBtn = document.createElement('button');
            calcBtn.className = 'calc-clean-btn';
            calcBtn.innerHTML = '💰 ROI Calculator';
            calcBtn.style.cssText = `
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                margin: 8px 5px;
                transition: all 0.3s ease;
            `;
            
            // Hover effect
            calcBtn.addEventListener('mouseenter', () => {
                calcBtn.style.transform = 'translateY(-2px)';
                calcBtn.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
            });
            
            calcBtn.addEventListener('mouseleave', () => {
                calcBtn.style.transform = 'translateY(0)';
                calcBtn.style.boxShadow = 'none';
            });
            
            // Obtener datos del producto
            const productoData = this.extractProductData(producto);
            
            // Event listener para abrir calculadora
            calcBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openCalculator(productoData);
            });
            
            // Agregar al producto
            const actionArea = producto.querySelector('.product-actions, .resultado-actions') || producto;
            actionArea.appendChild(calcBtn);
        });
        
        console.log(`✅ Agregados ${productos.length} botones de calculadora`);
    },
    
    // Extraer datos del producto del DOM
    extractProductData: function(productElement) {
        const nombre = productElement.querySelector('h3, h4, .product-name, .resultado-nombre')?.textContent?.trim() || 'Producto';
        const precioElement = productElement.querySelector('.precio, .product-price, .resultado-precio');
        const comisionElement = productElement.querySelector('.comision, .product-commission, .resultado-comision');
        
        let precio = '$97'; // Default
        let comision = '40%'; // Default
        
        if (precioElement) {
            precio = precioElement.textContent.trim();
        }
        
        if (comisionElement) {
            comision = comisionElement.textContent.trim();
        }
        
        return { nombre, precio, comision };
    },
    
    // Abrir calculadora
    openCalculator: function(producto) {
        console.log('🧮 Abriendo calculadora para:', producto.nombre);
        this.currentProduct = producto;
        
        // Actualizar datos del producto en modal
        document.getElementById('calcCleanProductName').textContent = producto.nombre;
        document.getElementById('calcCleanProductPrice').textContent = producto.precio;
        document.getElementById('calcCleanProductCommission').textContent = producto.comision;
        
        // Mostrar modal
        document.getElementById('profitCalculatorCleanModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    },
    
    // Cerrar calculadora
    closeCalculator: function() {
        document.getElementById('profitCalculatorCleanModal').classList.add('hidden');
        document.body.style.overflow = 'auto';
        this.hideResults();
    },
    
    // Calcular ROI y escenarios
    calculate: function() {
        console.log('🧮 Calculando ROI...');
        
        if (!this.currentProduct) {
            alert('⚠️ Error: No hay producto seleccionado');
            return;
        }
        
        // Obtener configuración
        const config = {
            budget: parseFloat(document.getElementById('calcCleanBudget').value) || 50,
            channel: document.getElementById('calcCleanChannel').value,
            days: parseInt(document.getElementById('calcCleanDays').value) || 30,
            market: document.getElementById('calcCleanMarket').value
        };
        
        console.log('⚙️ Configuración:', config);
        
        // Calcular comisión en dólares
        const comisionDolares = this.parseCommission(this.currentProduct.precio, this.currentProduct.comision);
        const totalBudget = config.budget * config.days;
        
        console.log(`💰 Comisión por venta: $${comisionDolares}`);
        
        // Mostrar loading
        this.showLoading(true);
        
        setTimeout(() => {
            // Generar escenarios realistas
            const scenarios = this.generateRealisticScenarios(totalBudget, comisionDolares, config);
            
            // Mostrar resultados
            this.displayResults(scenarios);
            this.showLoading(false);
            
            console.log('✅ Cálculo completado');
        }, 1500); // Simular proceso
    },
    
    // Parsear comisión a dólares
    parseCommission: function(precio, comision) {
        console.log(`🔍 Parseando precio: "${precio}", comisión: "${comision}"`);
        
        // Si comisión ya está en dólares ($X.XX)
        const dollarMatch = comision.match(/\$?([\d,]+\.?\d*)/);
        if (dollarMatch) {
            const amount = parseFloat(dollarMatch[1].replace(/,/g, ''));
            if (amount > 0 && amount < 1000) { // Validar que sea comisión, no precio
                console.log('💰 Comisión en dólares detectada:', amount);
                return amount;
            }
        }
        
        // Si comisión es porcentaje
        const percentMatch = comision.match(/(\d+)%/);
        if (percentMatch) {
            const percent = parseInt(percentMatch[1]);
            const priceMatch = precio.match(/\$?([\d,]+\.?\d*)/);
            if (priceMatch) {
                const productPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
                const commission = (productPrice * percent / 100);
                console.log(`💰 Comisión calculada: ${percent}% de $${productPrice} = $${commission}`);
                return commission;
            }
        }
        
        // Fallback: asumir 40% de precio promedio
        const priceMatch = precio.match(/\$?([\d,]+\.?\d*)/);
        const productPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 97;
        const fallbackCommission = productPrice * 0.40;
        
        console.log(`💰 Comisión fallback: 40% de $${productPrice} = $${fallbackCommission}`);
        return fallbackCommission;
    },
    
    // Generar escenarios realistas
    generateRealisticScenarios: function(totalBudget, commissionPerSale, config) {
        console.log(`📊 Generando escenarios: Budget $${totalBudget}, Comisión $${commissionPerSale}`);
        
        // Obtener CPCs realistas por canal y mercado
        const baseCPC = this.getCPC(config.channel, config.market);
        
        const scenarios = {
            conservative: {
                name: "😰 Conservador",
                color: "#ef4444",
                cpc: (baseCPC * 1.5).toFixed(2),
                ctr: "1.2",
                cr: "0.9"
            },
            realistic: {
                name: "😊 Realista", 
                color: "#3b82f6",
                cpc: baseCPC.toFixed(2),
                ctr: "2.1",
                cr: "1.8"
            },
            optimistic: {
                name: "🚀 Optimista",
                color: "#10b981", 
                cpc: (baseCPC * 0.7).toFixed(2),
                ctr: "3.2",
                cr: "2.8"
            }
        };
        
        // Calcular métricas para cada escenario
        Object.keys(scenarios).forEach(key => {
            const scenario = scenarios[key];
            
            // Cálculos
            const clicks = Math.round(totalBudget / parseFloat(scenario.cpc));
            const conversions = Math.round(clicks * parseFloat(scenario.ctr) * parseFloat(scenario.cr) / 10000);
            const revenue = Math.round(conversions * commissionPerSale);
            const profit = revenue - totalBudget;
            const roi = totalBudget > 0 ? Math.round((profit / totalBudget) * 100) : 0;
            
            // Breakeven days
            let breakeven = 30;
            if (profit > 0) {
                breakeven = Math.max(3, Math.round(15 * (totalBudget / revenue)));
            } else if (profit > -totalBudget * 0.5) {
                breakeven = Math.round(45 * (1 + Math.abs(profit) / totalBudget));
            } else {
                breakeven = 60;
            }
            
            // Asignar resultados
            scenario.clicks = clicks.toLocaleString();
            scenario.conversions = conversions.toString();
            scenario.revenue = `$${revenue.toLocaleString()}`;
            scenario.profit = `${profit >= 0 ? '+' : ''}$${profit.toLocaleString()}`;
            scenario.roi = `${roi >= 0 ? '+' : ''}${roi}%`;
            scenario.breakeven = `${breakeven} días`;
            scenario.rawProfit = profit; // Para scaling
        });
        
        // Generar scaling projection
        const realisticProfit = scenarios.realistic.rawProfit;
        scenarios.scaling = {
            month1: this.formatMoney(realisticProfit),
            month2: this.formatMoney(Math.round(realisticProfit * 1.7)),
            month3: this.formatMoney(Math.round(realisticProfit * 2.4))
        };
        
        console.log('📊 Escenarios generados:', scenarios);
        return scenarios;
    },
    
    // Obtener CPC típico por canal y mercado
    getCPC: function(channel, market) {
        const cpcData = {
            facebook: { tier1: 1.80, tier2: 1.00, tier3: 0.50 },
            google: { tier1: 2.50, tier2: 1.40, tier3: 0.70 },
            tiktok: { tier1: 1.60, tier2: 0.90, tier3: 0.45 },
            native: { tier1: 1.20, tier2: 0.65, tier3: 0.30 }
        };
        
        return cpcData[channel]?.[market] || 1.50;
    },
    
    // Formatear dinero
    formatMoney: function(amount) {
        return `${amount >= 0 ? '+' : ''}$${Math.round(amount).toLocaleString()}`;
    },
    
    // Mostrar resultados
    displayResults: function(scenarios) {
        // Mostrar sección de resultados
        document.getElementById('calcCleanResults').classList.remove('hidden');
        
        // Actualizar escenarios
        ['conservative', 'realistic', 'optimistic'].forEach(type => {
            const scenario = scenarios[type];
            const prefix = type.charAt(0).toUpperCase() + type.slice(1);
            
            document.getElementById(`cpc${prefix}`).textContent = `$${scenario.cpc}`;
            document.getElementById(`ctr${prefix}`).textContent = `${scenario.ctr}%`;
            document.getElementById(`cr${prefix}`).textContent = `${scenario.cr}%`;
            document.getElementById(`profit${prefix}`).textContent = scenario.profit;
            document.getElementById(`roi${prefix}`).textContent = scenario.roi;
            document.getElementById(`breakeven${prefix}`).textContent = scenario.breakeven;
            
            // Color del profit
            const profitElement = document.getElementById(`profit${prefix}`);
            profitElement.style.color = scenario.rawProfit >= 0 ? '#10b981' : '#ef4444';
            profitElement.style.fontWeight = 'bold';
        });
        
        // Actualizar scaling
        document.getElementById('month1Profit').textContent = scenarios.scaling.month1;
        document.getElementById('month2Profit').textContent = scenarios.scaling.month2;
        document.getElementById('month3Profit').textContent = scenarios.scaling.month3;
        
        // Scroll hacia resultados
        document.getElementById('calcCleanResults').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
    },
    
    // Mostrar/ocultar loading
    showLoading: function(show) {
        const btn = document.querySelector('.btn-calculate-clean');
        if (show) {
            btn.innerHTML = '<span style="display: inline-block; animation: spin 1s linear infinite;">🔄</span> Calculando...';
            btn.disabled = true;
        } else {
            btn.innerHTML = '🧮 Calcular ROI';
            btn.disabled = false;
        }
    },
    
    // Ocultar resultados
    hideResults: function() {
        document.getElementById('calcCleanResults').classList.add('hidden');
    },
    
    // Exportar reporte
    exportReport: function() {
        if (!this.currentProduct) return;
        
        const config = {
            budget: document.getElementById('calcCleanBudget').value,
            channel: document.getElementById('calcCleanChannel').value,
            days: document.getElementById('calcCleanDays').value,
            market: document.getElementById('calcCleanMarket').value
        };
        
        const report = `REPORTE DE ROI - ${this.currentProduct.nombre}

CONFIGURACIÓN:
- Presupuesto diario: $${config.budget}
- Canal: ${config.channel}
- Duración: ${config.days} días
- Mercado: ${config.market}
- Producto: ${this.currentProduct.precio}
- Comisión: ${this.currentProduct.comision}

ESCENARIOS CALCULADOS:
- Conservador: ${document.getElementById('profitConservative').textContent} (ROI: ${document.getElementById('roiConservative').textContent})
- Realista: ${document.getElementById('profitRealistic').textContent} (ROI: ${document.getElementById('roiRealistic').textContent})
- Optimista: ${document.getElementById('profitOptimistic').textContent} (ROI: ${document.getElementById('roiOptimistic').textContent})

PROYECCIÓN DE SCALING:
- Mes 1: ${document.getElementById('month1Profit').textContent}
- Mes 2: ${document.getElementById('month2Profit').textContent}  
- Mes 3: ${document.getElementById('month3Profit').textContent}

RECOMENDACIONES:
1. Comenzar con presupuesto conservador
2. Optimizar audiencias según datos reales
3. Escalar gradualmente cuando ROI > 100%
4. Implementar retargeting para mejorar conversiones

Generado: ${new Date().toLocaleString()}
MarketInsight Pro - Profit Calculator`;
        
        // Descargar
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ROI-Report-${this.currentProduct.nombre.replace(/\s+/g, '-')}-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        alert('📊 Reporte exportado exitosamente');
    },
    
    // Agregar HTML del modal
    addModalHTML: function() {
        if (document.getElementById('profitCalculatorCleanModal')) return;
        
        const modalHTML = `
        <div id="profitCalculatorCleanModal" class="modal-overlay hidden">
            <div class="modal-container profit-calc-clean-modal">
                <div class="modal-header">
                    <h2>💰 ROI Calculator Pro</h2>
                    <button class="modal-close" onclick="ProfitCalculatorClean.closeCalculator()">×</button>
                </div>
                
                <div class="modal-body">
                    <!-- Info del producto -->
                    <div class="product-info-calc-clean">
                        <h3 id="calcCleanProductName">Producto</h3>
                        <div class="product-stats-grid">
                            <div class="stat-box">
                                <span class="stat-label">Precio</span>
                                <span class="stat-value" id="calcCleanProductPrice">$0</span>
                            </div>
                            <div class="stat-box">
                                <span class="stat-label">Comisión</span>
                                <span class="stat-value" id="calcCleanProductCommission">0%</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Configuración -->
                    <div class="calculator-config-clean">
                        <h4>⚙️ Configuración de Campaña</h4>
                        <div class="calc-inputs-grid">
                            <div class="calc-input-group">
                                <label>💵 Presupuesto Diario</label>
                                <input type="number" id="calcCleanBudget" value="50" min="10" max="10000">
                                <small>USD por día</small>
                            </div>
                            
                            <div class="calc-input-group">
                                <label>🎯 Canal Principal</label>
                                <select id="calcCleanChannel">
                                    <option value="facebook">Facebook Ads</option>
                                    <option value="google">Google Ads</option>
                                    <option value="tiktok">TikTok Ads</option>
                                    <option value="native">Native Ads</option>
                                </select>
                            </div>
                            
                            <div class="calc-input-group">
                                <label>📅 Días de Campaña</label>
                                <input type="number" id="calcCleanDays" value="30" min="7" max="365">
                                <small>Duración total</small>
                            </div>
                            
                            <div class="calc-input-group">
                                <label>🌍 Mercado</label>
                                <select id="calcCleanMarket">
                                    <option value="tier1">Tier 1 (US/UK/CA)</option>
                                    <option value="tier2">Tier 2 (EU/AU)</option>
                                    <option value="tier3">Tier 3 (LATAM/ASIA)</option>
                                </select>
                            </div>
                        </div>
                        
                        <button class="btn-calculate-clean" onclick="ProfitCalculatorClean.calculate()">
                            🧮 Calcular ROI
                        </button>
                    </div>
                    
                    <!-- Resultados -->
                    <div id="calcCleanResults" class="calculator-results-clean hidden">
                        <h4>📊 Proyección de Resultados</h4>
                        
                        <!-- Escenarios -->
                        <div class="scenarios-grid-clean">
                            <div class="scenario-card-clean conservative">
                                <h5>😰 Conservador</h5>
                                <div class="scenario-metrics-clean">
                                    <div class="metric-row"><span>CPC:</span><span id="cpcConservative">$0</span></div>
                                    <div class="metric-row"><span>CTR:</span><span id="ctrConservative">0%</span></div>
                                    <div class="metric-row"><span>CR:</span><span id="crConservative">0%</span></div>
                                    <div class="metric-row highlight"><span>Profit:</span><span id="profitConservative">$0</span></div>
                                    <div class="metric-row"><span>ROI:</span><span id="roiConservative">0%</span></div>
                                    <div class="metric-row"><span>Breakeven:</span><span id="breakevenConservative">0 días</span></div>
                                </div>
                            </div>
                            
                            <div class="scenario-card-clean realistic">
                                <h5>😊 Realista</h5>
                                <div class="scenario-metrics-clean">
                                    <div class="metric-row"><span>CPC:</span><span id="cpcRealistic">$0</span></div>
                                    <div class="metric-row"><span>CTR:</span><span id="ctrRealistic">0%</span></div>
                                    <div class="metric-row"><span>CR:</span><span id="crRealistic">0%</span></div>
                                    <div class="metric-row highlight"><span>Profit:</span><span id="profitRealistic">$0</span></div>
                                    <div class="metric-row"><span>ROI:</span><span id="roiRealistic">0%</span></div>
                                    <div class="metric-row"><span>Breakeven:</span><span id="breakevenRealistic">0 días</span></div>
                                </div>
                            </div>
                            
                            <div class="scenario-card-clean optimistic">
                                <h5>🚀 Optimista</h5>
                                <div class="scenario-metrics-clean">
                                    <div class="metric-row"><span>CPC:</span><span id="cpcOptimistic">$0</span></div>
                                    <div class="metric-row"><span>CTR:</span><span id="ctrOptimistic">0%</span></div>
                                    <div class="metric-row"><span>CR:</span><span id="crOptimistic">0%</span></div>
                                    <div class="metric-row highlight"><span>Profit:</span><span id="profitOptimistic">$0</span></div>
                                    <div class="metric-row"><span>ROI:</span><span id="roiOptimistic">0%</span></div>
                                    <div class="metric-row"><span>Breakeven:</span><span id="breakevenOptimistic">0 días</span></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Proyección de scaling -->
                        <div class="scaling-projection-clean">
                            <h5>📈 Proyección de Escalamiento</h5>
                            <div class="scaling-summary-clean">
                                <div class="scaling-item"><span>Mes 1:</span><span id="month1Profit">$0</span></div>
                                <div class="scaling-item"><span>Mes 2:</span><span id="month2Profit">$0</span></div>
                                <div class="scaling-item"><span>Mes 3:</span><span id="month3Profit">$0</span></div>
                            </div>
                        </div>
                        
                        <!-- Acciones -->
                        <div class="calculator-actions-clean">
                            <button class="btn-secondary-clean" onclick="ProfitCalculatorClean.exportReport()">
                                📊 Exportar Reporte
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },
    
    // Agregar CSS
    addCalculatorCSS: function() {
        if (document.getElementById('profitCalcCleanCSS')) return;
        
        const css = `
        <style id="profitCalcCleanCSS">
        /* Modal overlay */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        }
        
        .profit-calc-clean-modal {
            background: linear-gradient(145deg, #1a202c 0%, #2d3748 100%);
            border-radius: 20px;
            width: 90%;
            max-width: 900px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .modal-header {
            padding: 25px 30px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-header h2 {
            color: #10b981;
            margin: 0;
            font-size: 1.8rem;
            font-weight: 700;
        }
        
        .modal-close {
            background: none;
            border: none;
            color: #94a3b8;
            font-size: 2rem;
            cursor: pointer;
            transition: color 0.3s ease;
        }
        
        .modal-close:hover {
            color: #ef4444;
        }
        
        .modal-body {
            padding: 30px;
        }
        
        /* Product info */
        .product-info-calc-clean {
            background: rgba(16, 185, 129, 0.1);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 25px;
            border-left: 4px solid #10b981;
        }
        
        .product-info-calc-clean h3 {
            color: #10b981;
            margin: 0 0 15px 0;
            font-size: 1.4rem;
        }
        
        .product-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
        }
        
        .stat-box {
            background: rgba(0, 0, 0, 0.2);
            padding: 12px;
            border-radius: 8px;
            text-align: center;
        }
        
        .stat-label {
            display: block;
            color: #94a3b8;
            font-size: 0.9rem;
            margin-bottom: 5px;
        }
        
        .stat-value {
            display: block;
            color: white;
            font-size: 1.2rem;
            font-weight: 700;
        }
        
        /* Configuration */
        .calculator-config-clean h4 {
            color: #60a5fa;
            margin: 0 0 20px 0;
            font-size: 1.2rem;
        }
        
        .calc-inputs-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 25px;
        }
        
        .calc-input-group label {
            display: block;
            color: #e2e8f0;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .calc-input-group input,
        .calc-input-group select {
            width: 100%;
            padding: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.3);
            color: white;
            font-size: 1rem;
        }
        
        .calc-input-group small {
            display: block;
            color: #94a3b8;
            font-size: 0.8rem;
            margin-top: 5px;
        }
        
        .btn-calculate-clean {
            width: 100%;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        
        .btn-calculate-clean:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
        }
        
        .btn-calculate-clean:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }
        
        /* Results */
        .calculator-results-clean {
            margin-top: 30px;
            padding-top: 25px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .calculator-results-clean h4 {
            color: #60a5fa;
            margin: 0 0 25px 0;
            font-size: 1.3rem;
        }
        
        .scenarios-grid-clean {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .scenario-card-clean {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: transform 0.3s ease;
        }
        
        .scenario-card-clean:hover {
            transform: translateY(-3px);
        }
        
        .scenario-card-clean.conservative {
            border-left: 4px solid #ef4444;
        }
        
        .scenario-card-clean.realistic {
            border-left: 4px solid #3b82f6;
        }
        
        .scenario-card-clean.optimistic {
            border-left: 4px solid #10b981;
        }
        
        .scenario-card-clean h5 {
            margin: 0 0 15px 0;
            color: white;
            font-size: 1.1rem;
        }
        
        .scenario-metrics-clean .metric-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
        }
        
        .scenario-metrics-clean .metric-row span:first-child {
            color: #94a3b8;
        }
        
        .scenario-metrics-clean .metric-row span:last-child {
            color: white;
            font-weight: 600;
        }
        
        .scenario-metrics-clean .metric-row.highlight {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 6px;
            padding: 8px;
            margin: 10px 0;
        }
        
        .scenario-metrics-clean .metric-row.highlight span:last-child {
            font-size: 1.1rem;
            font-weight: 700;
        }
        
        /* Scaling */
        .scaling-projection-clean {
            background: rgba(139, 92, 246, 0.1);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 25px;
            border-left: 4px solid #8b5cf6;
        }
        
        .scaling-projection-clean h5 {
            color: #8b5cf6;
            margin: 0 0 15px 0;
            font-size: 1.1rem;
        }
        
        .scaling-summary-clean {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
        }
        
        .scaling-item {
            background: rgba(0, 0, 0, 0.2);
            padding: 12px;
            border-radius: 8px;
            text-align: center;
        }
        
        .scaling-item span:first-child {
            display: block;
            color: #94a3b8;
            font-size: 0.9rem;
            margin-bottom: 5px;
        }
        
        .scaling-item span:last-child {
            display: block;
            color: white;
            font-size: 1.2rem;
            font-weight: 700;
        }
        
        /* Actions */
        .calculator-actions-clean {
            text-align: center;
        }
        
        .btn-secondary-clean {
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-secondary-clean:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
        }
        
        /* Hidden */
        .hidden {
            display: none !important;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .profit-calc-clean-modal {
                width: 95%;
                margin: 20px;
            }
            
            .modal-body {
                padding: 20px;
            }
            
            .calc-inputs-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .scenarios-grid-clean {
                grid-template-columns: 1fr;
            }
        }
        
        /* Spin animation */
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        </style>`;
        
        document.head.insertAdjacentHTML('beforeend', css);
    },
    
    // Auto-detectar productos existentes
    detectExistingProducts: function() {
        // Buscar productos cada 3 segundos
        setInterval(() => {
            this.addCalculatorButton();
        }, 3000);
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ProfitCalculatorClean.init();
        ProfitCalculatorClean.detectExistingProducts();
    });
} else {
    ProfitCalculatorClean.init();
    ProfitCalculatorClean.detectExistingProducts();
}

// También ejecutar después de un delay
setTimeout(() => {
    ProfitCalculatorClean.addCalculatorButton();
}, 2000);

console.log('✅ Profit Calculator Clean cargado exitosamente');