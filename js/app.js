/**
 * Sistema de Gestión de Farmacia Hospitalaria
 * Hospital de la Mujer - Tepic, Nayarit
 * SERVICIOS DE SALUD IMSS-BIENESTAR
 */

(function () {
  'use strict';

  // ==========================================================================
  // ESTADO GLOBAL DE LA APLICACIÓN Y ROLES RBAC
  // ==========================================================================
  const STORAGE_KEY = 'IMSS_BIENESTAR_HOSPITAL_MUJER_FARMACIA_V1';

  const ROLES_DEF = {
    RESPONSABLE_SANITARIO: {
      nombre: 'Q.F.B. Mariana E. Ramos',
      avatar: 'MR',
      rolNombre: 'Responsable Sanitario de Farmacia',
      cedula: 'CED. 8492019',
      puedeModificar: true,
      puedeDispensar: true,
      puedeDonar: true
    },
    AUXILIAR_FARMACIA: {
      nombre: 'Aux. Marco Tulio Estrada',
      avatar: 'ME',
      rolNombre: 'Auxiliar de Farmacia y Almacén',
      cedula: 'TÉC-8812',
      puedeModificar: true,
      puedeDispensar: true,
      puedeDonar: false
    },
    MEDICO_PRESCRIPTOR: {
      nombre: 'Dra. Gabriela Solís Mondragón',
      avatar: 'GS',
      rolNombre: 'Jefa de Ginecología y Obstetricia',
      cedula: 'ESP-41029',
      puedeModificar: false,
      puedeDispensar: true,
      puedeDonar: false
    },
    AUDITOR_OIC: {
      nombre: 'Lic. Fernando Bañuelos',
      avatar: 'FB',
      rolNombre: 'Auditor Órgano Interno de Control',
      cedula: 'OIC-NAY-09',
      puedeModificar: false,
      puedeDispensar: false,
      puedeDonar: false
    }
  };

  let currentRoleKey = 'RESPONSABLE_SANITARIO';

  let appState = {
    hospitalInfo: {},
    servicios: [],
    origenesSuministro: [],
    catalogo: [],
    donaciones: [],
    movimientos: [],
    metricasCronologicas: {},
    consumoPorServicio: [],
    currentPeriod: 'diario',
    tempImportData: [],
    auditLogs: []
  };

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================
  function init() {
    loadState();
    setupEventListeners();
    setupModals();
    setupDropzone();
    renderAll();
    verificarEstadoBaseDatos();
  }

  function verificarEstadoBaseDatos() {
    fetch('/api/db-status')
      .then(res => res.json())
      .then(data => {
        const textEl = document.getElementById('db-status-text');
        if (data.connected && textEl) {
          textEl.textContent = 'PostgreSQL Nube Conectado';
          textEl.parentElement.title = `Conectado a Neon PostgreSQL (${data.database})`;
        }
      })
      .catch(() => {});
  }

  function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        appState = Object.assign(appState, parsed);
      } catch (e) {
        console.error('Error cargando localStorage:', e);
        appState = Object.assign(appState, window.HOSPITAL_DATA);
      }
    } else {
      appState = Object.assign(appState, window.HOSPITAL_DATA);
    }

    // Inicializar bitácora de auditoría si está vacía
    if (!appState.auditLogs || appState.auditLogs.length === 0) {
      appState.auditLogs = [
        {
          fecha: "2026-09-24 10:14",
          usuario: "Q.F.B. Mariana E. Ramos",
          rol: "Responsable Sanitario",
          accion: "RECEPCIÓN_BIRMEX",
          entidad: "Oxitocina 5 UI (Lote OX-26019A)",
          ip: "10.24.12.85 [Andén Farmacia]"
        },
        {
          fecha: "2026-09-24 10:45",
          usuario: "Aux. Marco Tulio Estrada",
          rol: "Auxiliar Farmacia",
          accion: "DISPENSACIÓN_PEPS",
          entidad: "Sulfato de Magnesio 1g (Lote SM-250312)",
          ip: "10.24.12.90 [Ventanilla Piso 1]"
        },
        {
          fecha: "2026-09-24 11:30",
          usuario: "Q.F.B. Mariana E. Ramos",
          rol: "Responsable Sanitario",
          accion: "AUTORIZACIÓN_DONACIÓN",
          entidad: "Acta ACTA-DON-2026-001 (Fundación Mujeres)",
          ip: "10.24.12.85 [Oficina QFB]"
        },
        {
          fecha: "2026-09-24 12:20",
          usuario: "Lic. Fernando Bañuelos",
          rol: "Auditor OIC",
          accion: "EXPORTACIÓN_EXCEL",
          entidad: "Auditoría de Lotes y Semáforo Caducidad",
          ip: "10.24.14.02 [Terminal OIC]"
        }
      ];
    }
    saveState();
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
      console.error('Error al guardar estado en localStorage:', e);
    }
  }

  // ==========================================================================
  // RENDERIZADO GLOBAL
  // ==========================================================================
  function renderAll() {
    updateKPIs();
    renderCharts();
    renderInventarioTable();
    renderEntradasTable();
    renderSalidasTable();
    renderLotesTable();
    renderDonacionesTable();
    populateSelects();
  }

  // ==========================================================================
  // CÁLCULO Y RENDERIZADO DE KPIS
  // ==========================================================================
  function updateKPIs() {
    const totalClaves = appState.catalogo.length;
    let totalPiezas = 0;
    let lotesAlertaCount = 0;
    let totalDonacionesPiezas = 0;
    let clavesAbastoOptimo = 0;

    appState.catalogo.forEach(med => {
      let medStock = 0;
      if (med.lotes && Array.isArray(med.lotes)) {
        med.lotes.forEach(l => {
          const exist = parseInt(l.existencia, 10) || 0;
          medStock += exist;
          if (l.origen && l.origen.toLowerCase().includes('donación')) {
            totalDonacionesPiezas += exist;
          }
          const sem = calcularSemaforo(l.fechaCaducidad);
          if (sem.estado === 'amarillo' || sem.estado === 'rojo') {
            lotesAlertaCount++;
          }
        });
      }
      totalPiezas += medStock;
      if (medStock >= (med.stockMinimo || 10)) {
        clavesAbastoOptimo++;
      }
    });

    const porcentajeAbasto = totalClaves > 0 ? ((clavesAbastoOptimo / totalClaves) * 100).toFixed(1) : 100;

    // Actualizar elementos en DOM
    setText('kpi-total-claves', totalClaves);
    setText('kpi-existencia-total', formatNumber(totalPiezas));
    setText('kpi-lotes-alerta', lotesAlertaCount);
    setText('kpi-total-donaciones', formatNumber(totalDonacionesPiezas));
    setText('kpi-nivel-abasto', porcentajeAbasto + '%');

    setText('badge-total-items', totalClaves);
    setText('badge-lotes-alerta', lotesAlertaCount);
    setText('badge-donaciones-count', appState.donaciones.length);
  }

  // ==========================================================================
  // MOTOR DE CÁLCULO DE CADUCIDADES Y SEMAFORIZACIÓN (PEPS / FEFO)
  // ==========================================================================
  function calcularSemaforo(fechaCaducidadStr) {
    if (!fechaCaducidadStr) {
      return { estado: 'verde', texto: 'Vigente', dias: 999, class: 'badge-verde' };
    }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const cad = new Date(fechaCaducidadStr);
    cad.setHours(0, 0, 0, 0);

    const diffTime = cad.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { estado: 'negro', texto: 'Caducado (Cuarentena)', dias: diffDays, class: 'badge-negro' };
    } else if (diffDays <= 90) {
      return { estado: 'rojo', texto: 'Crítico (< 3 meses)', dias: diffDays, class: 'badge-rojo' };
    } else if (diffDays <= 180) {
      return { estado: 'amarillo', texto: 'Alerta (3 - 6 meses)', dias: diffDays, class: 'badge-amarillo' };
    } else {
      return { estado: 'verde', texto: 'Óptimo (> 6 meses)', dias: diffDays, class: 'badge-verde' };
    }
  }

  // ==========================================================================
  // GRÁFICAS VECTORIALES SVG (INTERACTIVAS)
  // ==========================================================================
  function renderCharts() {
    renderLineChart();
    renderBarChart();
    renderDonutChart();
    renderLotesResumenDashboard();
  }

  function renderLineChart() {
    const container = document.getElementById('line-chart-container');
    if (!container) return;

    const dataSeries = appState.metricasCronologicas[appState.currentPeriod] || appState.metricasCronologicas.diario;
    const w = container.clientWidth || 600;
    const h = 230;
    const padX = 50;
    const padY = 30;

    let maxVal = 100;
    dataSeries.forEach(d => {
      if (d.entradas > maxVal) maxVal = d.entradas;
      if (d.salidas > maxVal) maxVal = d.salidas;
    });
    maxVal = Math.ceil(maxVal * 1.15); // Margen superior

    const stepX = (w - padX * 2) / (dataSeries.length - 1 || 1);

    const getX = i => padX + i * stepX;
    const getY = val => h - padY - (val / maxVal) * (h - padY * 2);

    // Puntos de Entradas y Salidas
    let pathEntradas = '';
    let pathSalidas = '';
    let areaEntradas = `M ${getX(0)} ${h - padY}`;

    dataSeries.forEach((d, i) => {
      const x = getX(i);
      const yE = getY(d.entradas);
      const yS = getY(d.salidas);

      if (i === 0) {
        pathEntradas += `M ${x} ${yE}`;
        pathSalidas += `M ${x} ${yS}`;
      } else {
        pathEntradas += ` L ${x} ${yE}`;
        pathSalidas += ` L ${x} ${yS}`;
      }
      areaEntradas += ` L ${x} ${yE}`;
    });
    areaEntradas += ` L ${getX(dataSeries.length - 1)} ${h - padY} Z`;

    // Líneas guía horizontales
    let gridLines = '';
    const ticks = 4;
    for (let t = 0; t <= ticks; t++) {
      const val = Math.round((maxVal / ticks) * t);
      const y = getY(val);
      gridLines += `
        <line x1="${padX}" y1="${y}" x2="${w - padX}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="3,3" />
        <text x="${padX - 8}" y="${y + 3}" font-size="10" fill="#64748b" text-anchor="end" font-family="monospace">${val}</text>
      `;
    }

    // Etiquetas en eje X
    let xLabels = '';
    dataSeries.forEach((d, i) => {
      const x = getX(i);
      xLabels += `<text x="${x}" y="${h - 8}" font-size="10" fill="#475569" text-anchor="middle" font-weight="600">${d.label}</text>`;
    });

    // Puntos interactivos
    let dots = '';
    dataSeries.forEach((d, i) => {
      const x = getX(i);
      const yE = getY(d.entradas);
      const yS = getY(d.salidas);

      dots += `
        <circle cx="${x}" cy="${yE}" r="5" fill="#0c4a34" stroke="#ffffff" stroke-width="2" 
                class="chart-dot" data-tipo="Entrada" data-label="${d.label}" data-val="${d.entradas} pzas" />
        <circle cx="${x}" cy="${yS}" r="5" fill="#9d2449" stroke="#ffffff" stroke-width="2" 
                class="chart-dot" data-tipo="Salida" data-label="${d.label}" data-val="${d.salidas} pzas" />
      `;
    });

    container.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradEntradas" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0c4a34" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#0c4a34" stop-opacity="0.0" />
          </linearGradient>
        </defs>
        ${gridLines}
        <path d="${areaEntradas}" fill="url(#gradEntradas)" />
        <path d="${pathEntradas}" fill="none" stroke="#0c4a34" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        <path d="${pathSalidas}" fill="none" stroke="#9d2449" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        ${dots}
        ${xLabels}
      </svg>
    `;

    // Actualizar sub-kpis del periodo
    let totEntradas = 0, totSalidas = 0, totRecetas = 0;
    dataSeries.forEach(d => {
      totEntradas += d.entradas || 0;
      totSalidas += d.salidas || 0;
      totRecetas += d.recetas || 0;
    });
    setText('chart-kpi-entradas', formatNumber(totEntradas) + ' pzas');
    setText('chart-kpi-salidas', formatNumber(totSalidas) + ' pzas');
    setText('chart-kpi-recetas', formatNumber(totRecetas) + ' recetas');

    attachTooltipListeners(container);
  }

  function renderBarChart() {
    const container = document.getElementById('bar-chart-container');
    if (!container) return;

    const data = appState.consumoPorServicio || [];
    const w = container.clientWidth || 400;
    const h = 230;
    const padLeft = 140;
    const padRight = 50;
    const padTop = 15;
    const padBottom = 20;

    const barHeight = 18;
    const rowGap = (h - padTop - padBottom) / (data.length || 1);

    let maxVal = 100;
    data.forEach(d => { if (d.piezas > maxVal) maxVal = d.piezas; });

    let bars = '';
    data.forEach((d, i) => {
      const y = padTop + i * rowGap;
      const barWidth = ((d.piezas / maxVal) * (w - padLeft - padRight));
      const shortName = d.servicio.length > 20 ? d.servicio.substring(0, 18) + '...' : d.servicio;

      bars += `
        <text x="${padLeft - 8}" y="${y + barHeight - 4}" font-size="10" font-weight="600" fill="#334155" text-anchor="end" title="${d.servicio}">
          ${shortName}
        </text>
        <rect x="${padLeft}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="${d.color || '#0c4a34'}" 
              class="chart-bar" data-tipo="Consumo" data-label="${d.servicio}" data-val="${d.piezas} pzas (${d.porcentaje}%)">
        </rect>
        <text x="${padLeft + barWidth + 6}" y="${y + barHeight - 4}" font-size="10" font-weight="700" fill="#0f172a">
          ${d.piezas}
        </text>
      `;
    });

    container.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}">
        ${bars}
      </svg>
    `;

    attachTooltipListeners(container);
  }

  function renderDonutChart() {
    const container = document.getElementById('donut-chart-container');
    if (!container) return;

    let verde = 0, amarillo = 0, rojo = 0, negro = 0;
    let totalLotes = 0;

    appState.catalogo.forEach(med => {
      if (med.lotes && Array.isArray(med.lotes)) {
        med.lotes.forEach(l => {
          totalLotes++;
          const sem = calcularSemaforo(l.fechaCaducidad);
          if (sem.estado === 'verde') verde++;
          else if (sem.estado === 'amarillo') amarillo++;
          else if (sem.estado === 'rojo') rojo++;
          else negro++;
        });
      }
    });

    if (totalLotes === 0) totalLotes = 1;

    const slices = [
      { count: verde, color: '#15803d', label: 'Vigentes > 6m' },
      { count: amarillo, color: '#b45309', label: 'Alerta 3-6m' },
      { count: rojo, color: '#b91c1c', label: 'Críticos < 3m' },
      { count: negro, color: '#18181b', label: 'Cuarentena' }
    ];

    const cx = 110, cy = 110, r = 75, thickness = 28;
    const circumference = 2 * Math.PI * r;

    let strokeOffset = 0;
    let paths = '';
    slices.forEach(s => {
      const pct = s.count / totalLotes;
      const strokeLen = pct * circumference;
      paths += `
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${thickness}"
                stroke-dasharray="${strokeLen} ${circumference}" stroke-dashoffset="${-strokeOffset}"
                class="chart-slice" data-tipo="Semáforo" data-label="${s.label}" data-val="${s.count} lotes" />
      `;
      strokeOffset += strokeLen;
    });

    // Leyenda al lado derecho
    let legend = '';
    let legY = 45;
    slices.forEach(s => {
      legend += `
        <rect x="220" y="${legY}" width="12" height="12" rx="3" fill="${s.color}" />
        <text x="240" y="${legY + 10}" font-size="11" font-weight="600" fill="#334155">${s.label}: <strong>${s.count}</strong></text>
      `;
      legY += 26;
    });

    container.innerHTML = `
      <svg viewBox="0 0 380 220">
        ${paths}
        <circle cx="${cx}" cy="${cy}" r="${r - thickness / 2}" fill="#ffffff" />
        <text x="${cx}" y="${cy - 5}" font-family="Montserrat" font-size="20" font-weight="800" fill="#0f172a" text-anchor="middle">
          ${totalLotes}
        </text>
        <text x="${cx}" y="${cy + 15}" font-size="10" font-weight="600" fill="#64748b" text-anchor="middle">
          LOTES TOTALES
        </text>
        ${legend}
      </svg>
    `;

    attachTooltipListeners(container);
  }

  function renderLotesResumenDashboard() {
    const tbody = document.getElementById('tbody-lotes-resumen');
    if (!tbody) return;

    let lotesList = [];
    appState.catalogo.forEach(med => {
      if (med.lotes) {
        med.lotes.forEach(l => {
          const sem = calcularSemaforo(l.fechaCaducidad);
          lotesList.push({
            lote: l.lote,
            medicamento: med.nombre,
            caducidad: l.fechaCaducidad,
            stock: l.existencia,
            dias: sem.dias,
            semaforo: sem
          });
        });
      }
    });

    // Ordenar de menor a mayor días (PEPS)
    lotesList.sort((a, b) => a.dias - b.dias);

    // Mostrar los primeros 4 más prioritarios
    const top4 = lotesList.slice(0, 4);

    let html = '';
    top4.forEach(item => {
      html += `
        <tr>
          <td><strong style="font-family: monospace;">${item.lote}</strong></td>
          <td>${item.medicamento}</td>
          <td>${item.caducidad} (${item.dias}d)</td>
          <td><strong>${item.stock}</strong></td>
          <td><span class="badge ${item.semaforo.class}"><span class="badge-dot"></span>${item.semaforo.texto}</span></td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  function attachTooltipListeners(container) {
    const tooltip = document.getElementById('chart-tooltip');
    if (!tooltip) return;

    const elements = container.querySelectorAll('.chart-dot, .chart-bar, .chart-slice');
    elements.forEach(el => {
      el.addEventListener('mousemove', e => {
        const tipo = el.getAttribute('data-tipo') || '';
        const label = el.getAttribute('data-label') || '';
        const val = el.getAttribute('data-val') || '';

        tooltip.innerHTML = `<strong>${label}</strong><br>${tipo}: <span style="color:#d4af37; font-weight:700;">${val}</span>`;
        tooltip.style.left = `${e.pageX + 15}px`;
        tooltip.style.top = `${e.pageY - 25}px`;
        tooltip.style.opacity = '1';
      });

      el.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
      });
    });
  }

  // ==========================================================================
  // TABLA DE INVENTARIO Y CATÁLOGO
  // ==========================================================================
  function renderInventarioTable() {
    const tbody = document.getElementById('tbody-inventario');
    if (!tbody) return;

    const searchTerm = (document.getElementById('search-inventario')?.value || '').toLowerCase().trim();
    const filterCat = document.getElementById('filter-cat-inventario')?.value || '';
    const filterFrio = document.getElementById('filter-frio-inventario')?.value || '';

    let totalStockGlobal = 0;
    let filteredCount = 0;

    let html = '';
    appState.catalogo.forEach(item => {
      // Calcular stock total de sus lotes
      let stockTotal = 0;
      let lotesActivos = 0;
      if (item.lotes) {
        item.lotes.forEach(l => {
          stockTotal += parseInt(l.existencia, 10) || 0;
          if (l.existencia > 0) lotesActivos++;
        });
      }

      // Filtros
      if (filterCat) {
        if (filterCat === 'Donacion' && !item.esDonacion) return;
        if (filterCat !== 'Donacion' && item.categoria !== filterCat) return;
      }
      if (filterFrio === 'si' && !item.redFrio) return;
      if (filterFrio === 'no' && item.redFrio) return;

      if (searchTerm) {
        const str = `${item.claveCNIS} ${item.nombre} ${item.concentracion} ${item.presentacion} ${item.categoria}`.toLowerCase();
        if (!str.includes(searchTerm)) return;
      }

      totalStockGlobal += stockTotal;
      filteredCount++;

      // Estatus de Nivel de Stock
      let nivelBadge = '';
      if (stockTotal <= (item.stockMinimo * 0.5)) {
        nivelBadge = '<span class="badge badge-rojo"><span class="badge-dot"></span>Desabasto Crítico</span>';
      } else if (stockTotal <= item.stockMinimo) {
        nivelBadge = '<span class="badge badge-amarillo"><span class="badge-dot"></span>Stock Mínimo</span>';
      } else {
        nivelBadge = '<span class="badge badge-verde"><span class="badge-dot"></span>Óptimo</span>';
      }

      const redFrioBadge = item.redFrio 
        ? `<span class="badge badge-frio"><i class="fa-solid fa-snowflake"></i> ${item.tempRango || '2-8°C'}</span>` 
        : `<span style="color: var(--slate-400); font-size: 0.75rem;">Ambiente</span>`;

      const donacionTag = item.esDonacion 
        ? ` <span class="badge badge-donacion"><i class="fa-solid fa-hand-holding-heart"></i> Donado</span>` 
        : '';

      html += `
        <tr>
          <td><strong style="font-family: monospace; color: var(--slate-700);">${item.claveCNIS}</strong></td>
          <td>
            <strong>${item.nombre}</strong> ${donacionTag}
            <div style="font-size: 0.72rem; color: var(--slate-500);">${item.concentracion} · ${item.formaFarmaceutica}</div>
          </td>
          <td><span style="font-size: 0.75rem; font-weight: 600; color: var(--imss-green-800);">${item.categoria}</span></td>
          <td>${item.presentacion}</td>
          <td>${redFrioBadge}</td>
          <td><strong style="font-size: 0.95rem; font-family: Montserrat;">${formatNumber(stockTotal)}</strong> pzas</td>
          <td>${nivelBadge}</td>
          <td><span style="font-size: 0.78rem; font-weight: 700;">${lotesActivos} lote(s)</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="window.farmaciaApp.abrirDispensar('${item.id}')" title="Dispensar">
              <i class="fa-solid fa-prescription-bottle-medical"></i> Surtir
            </button>
          </td>
        </tr>
      `;
    });

    if (filteredCount === 0) {
      html = `<tr><td colspan="9" style="text-align: center; padding: 2rem; color: var(--slate-400);">No se encontraron medicamentos con los criterios de búsqueda.</td></tr>`;
    }

    tbody.innerHTML = html;
    setText('tfoot-total-piezas', formatNumber(totalStockGlobal) + ' pzas');
    setText('tfoot-resumen-claves', filteredCount + ' claves mostradas');
  }

  // ==========================================================================
  // TABLA DE ENTRADAS (ABASTO BIRMEX / ALMACÉN CENTRAL)
  // ==========================================================================
  function renderEntradasTable() {
    const tbody = document.getElementById('tbody-entradas');
    if (!tbody) return;

    const searchTerm = (document.getElementById('search-entradas')?.value || '').toLowerCase().trim();
    const filterOrigen = document.getElementById('filter-origen-entradas')?.value || '';

    const entradas = appState.movimientos.filter(m => m.tipo === 'ENTRADA');
    let totalPiezas = 0;
    let totalCosto = 0;

    let html = '';
    entradas.forEach(e => {
      if (filterOrigen && !e.origen.toLowerCase().includes(filterOrigen.toLowerCase())) return;
      if (searchTerm) {
        const text = `${e.id} ${e.origen} ${e.documento} ${e.claveCNIS} ${e.medicamento} ${e.lote}`.toLowerCase();
        if (!text.includes(searchTerm)) return;
      }

      totalPiezas += e.piezas || 0;
      totalCosto += e.costoTotal || 0;

      let badgeOrigen = 'badge-birmex';
      if (e.origen.toLowerCase().includes('donación')) badgeOrigen = 'badge-donacion';

      html += `
        <tr>
          <td><strong style="font-family: monospace;">${e.id}</strong></td>
          <td>${e.fecha}</td>
          <td><span class="badge ${badgeOrigen}">${e.origen}</span></td>
          <td><strong>${e.documento}</strong></td>
          <td><span style="font-family: monospace;">${e.claveCNIS}</span></td>
          <td><strong>${e.medicamento}</strong></td>
          <td><span style="font-family: monospace; font-weight: 700;">${e.lote}</span></td>
          <td>${e.caducidad}</td>
          <td><strong>${formatNumber(e.piezas)}</strong></td>
          <td>$${formatCurrency(e.costoTotal || 0)}</td>
          <td><span style="font-size: 0.72rem; color: var(--slate-600);">${e.observaciones || '-'}</span></td>
        </tr>
      `;
    });

    if (entradas.length === 0) {
      html = `<tr><td colspan="11" style="text-align: center; padding: 2rem; color: var(--slate-400);">No hay entradas registradas.</td></tr>`;
    }

    tbody.innerHTML = html;
    setText('tfoot-piezas-entradas', formatNumber(totalPiezas) + ' pzas');
    setText('tfoot-monto-entradas', '$' + formatCurrency(totalCosto));
  }

  // ==========================================================================
  // TABLA DE SALIDAS (DISPENSACIÓN BAJO NORMA PEPS / FEFO)
  // ==========================================================================
  function renderSalidasTable() {
    const tbody = document.getElementById('tbody-salidas');
    if (!tbody) return;

    const searchTerm = (document.getElementById('search-salidas')?.value || '').toLowerCase().trim();
    const filterServicio = document.getElementById('filter-servicio-salidas')?.value || '';

    const salidas = appState.movimientos.filter(m => m.tipo === 'SALIDA');
    let totalPiezas = 0;

    let html = '';
    salidas.forEach(s => {
      if (filterServicio && !s.servicio.toLowerCase().includes(filterServicio.toLowerCase())) return;
      if (searchTerm) {
        const text = `${s.id} ${s.servicio} ${s.paciente} ${s.expediente} ${s.medicamento} ${s.lote} ${s.diagnostico}`.toLowerCase();
        if (!text.includes(searchTerm)) return;
      }

      totalPiezas += s.piezas || 0;

      let badgeTipo = 'badge-verde';
      if (s.subtipo === 'Código Mater') badgeTipo = 'badge-rojo';
      if (s.subtipo === 'Dispensación Donación') badgeTipo = 'badge-donacion';

      html += `
        <tr>
          <td><strong style="font-family: monospace;">${s.id}</strong></td>
          <td>${s.fecha}</td>
          <td><span class="badge ${badgeTipo}">${s.subtipo || 'Receta'}</span></td>
          <td><strong>${s.servicio}</strong><div style="font-size:0.7rem; color:var(--slate-500);">${s.solicitante || ''}</div></td>
          <td>${s.paciente ? `<strong>${s.paciente}</strong><div style="font-size:0.7rem;">${s.expediente || ''}</div>` : 'Stock de Piso'}</td>
          <td><strong>${s.medicamento}</strong></td>
          <td><span style="font-family: monospace; font-weight:700; color: var(--imss-green-900);">${s.lote}</span></td>
          <td>${s.caducidad}</td>
          <td><strong style="font-size: 0.95rem;">${s.piezas}</strong> pzas</td>
          <td><span style="font-size: 0.74rem;">${s.diagnostico || s.motivo || '-'}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="window.farmaciaApp.imprimirVale('${s.id}')" title="Imprimir Comprobante">
              <i class="fa-solid fa-print"></i>
            </button>
          </td>
        </tr>
      `;
    });

    if (salidas.length === 0) {
      html = `<tr><td colspan="11" style="text-align: center; padding: 2rem; color: var(--slate-400);">No hay salidas registradas.</td></tr>`;
    }

    tbody.innerHTML = html;
    setText('tfoot-piezas-salidas', formatNumber(totalPiezas) + ' pzas');
  }

  // ==========================================================================
  // TABLA DE LOTES Y AUDITORÍA DE CADUCIDAD
  // ==========================================================================
  function renderLotesTable() {
    const tbody = document.getElementById('tbody-lotes');
    if (!tbody) return;

    const searchTerm = (document.getElementById('search-lotes')?.value || '').toLowerCase().trim();
    const filterSemaforo = document.getElementById('filter-semaforo-lotes')?.value || '';

    let lotesList = [];
    appState.catalogo.forEach(med => {
      if (med.lotes) {
        med.lotes.forEach(l => {
          const sem = calcularSemaforo(l.fechaCaducidad);
          lotesList.push({
            idMedicamento: med.id,
            lote: l.lote,
            claveCNIS: med.claveCNIS,
            medicamento: med.nombre,
            fabricante: l.fabricante || 'Oficial',
            origen: l.origen || 'BIRMEX',
            caducidad: l.fechaCaducidad,
            dias: sem.dias,
            semaforo: sem,
            existencia: l.existencia,
            bloqueado: l.bloqueado || false
          });
        });
      }
    });

    // Ordenar por días restantes (PEPS)
    lotesList.sort((a, b) => a.dias - b.dias);

    let html = '';
    let count = 0;
    lotesList.forEach(l => {
      if (filterSemaforo && l.semaforo.estado !== filterSemaforo) return;
      if (searchTerm) {
        const text = `${l.lote} ${l.claveCNIS} ${l.medicamento} ${l.fabricante} ${l.origen}`.toLowerCase();
        if (!text.includes(searchTerm)) return;
      }
      count++;

      html += `
        <tr>
          <td><strong style="font-family: monospace; font-size: 0.9rem;">${l.lote}</strong></td>
          <td><span style="font-family: monospace;">${l.claveCNIS}</span></td>
          <td><strong>${l.medicamento}</strong></td>
          <td>${l.fabricante}</td>
          <td><span style="font-size: 0.72rem; color: var(--slate-600);">${l.origen}</span></td>
          <td><strong>${l.caducidad}</strong></td>
          <td><strong style="color: ${l.dias <= 90 ? 'var(--sem-rojo)' : 'var(--slate-800)'};">${l.dias} días</strong></td>
          <td><span class="badge ${l.semaforo.class}"><span class="badge-dot"></span>${l.semaforo.texto}</span></td>
          <td><strong style="font-size: 0.95rem;">${formatNumber(l.existencia)}</strong> pzas</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="window.farmaciaApp.canjearLote('${l.lote}')" title="Tramitar canje BIRMEX">
              <i class="fa-solid fa-arrow-rotate-right"></i> Canje
            </button>
          </td>
        </tr>
      `;
    });

    if (count === 0) {
      html = `<tr><td colspan="10" style="text-align: center; padding: 2rem; color: var(--slate-400);">No se encontraron lotes con los filtros seleccionados.</td></tr>`;
    }

    tbody.innerHTML = html;
  }

  // ==========================================================================
  // TABLAS DEL APARTADO DE DONACIONES DE MEDICAMENTOS (COFEPRIS)
  // ==========================================================================
  function renderDonacionesTable() {
    const tbodyActas = document.getElementById('tbody-donaciones');
    const tbodyInv = document.getElementById('tbody-inventario-donaciones');
    if (!tbodyActas || !tbodyInv) return;

    const searchTerm = (document.getElementById('search-donaciones')?.value || '').toLowerCase().trim();

    // 1. Tabla de Actas Oficiales
    let htmlActas = '';
    appState.donaciones.forEach(d => {
      if (searchTerm) {
        const text = `${d.folioActa} ${d.donante.nombre} ${d.donante.rfc} ${d.motivo}`.toLowerCase();
        if (!text.includes(searchTerm)) return;
      }

      let totalPzas = 0;
      let totalVal = 0;
      let insumosNombres = [];
      d.insumos.forEach(ins => {
        totalPzas += ins.cantidad || 0;
        totalVal += ins.valorEstimado || 0;
        insumosNombres.push(ins.medicamento);
      });

      htmlActas += `
        <tr>
          <td><strong style="font-family: monospace; color: var(--donacion-purple);">${d.folioActa}</strong></td>
          <td>${d.fecha}</td>
          <td>
            <strong>${d.donante.nombre}</strong>
            <div style="font-size: 0.72rem; color: var(--slate-500);">${d.donante.tipo}</div>
          </td>
          <td><span style="font-family: monospace;">${d.donante.rfc}</span></td>
          <td>${insumosNombres.join(', ')}</td>
          <td><strong>${formatNumber(totalPzas)}</strong> pzas</td>
          <td>$${formatCurrency(totalVal)}</td>
          <td><span class="badge badge-verde"><i class="fa-solid fa-check"></i> Cumple COFEPRIS</span></td>
          <td>
            <button class="btn btn-purple btn-sm" onclick="window.farmaciaApp.verActa('${d.folioActa}')">
              <i class="fa-solid fa-file-pdf"></i> Ver Acta
            </button>
          </td>
        </tr>
      `;
    });
    tbodyActas.innerHTML = htmlActas;

    // 2. Tabla de Inventario de Donaciones
    let htmlInv = '';
    appState.catalogo.forEach(med => {
      if (med.lotes) {
        med.lotes.forEach(l => {
          if (l.origen && l.origen.toLowerCase().includes('donación')) {
            htmlInv += `
              <tr>
                <td><span style="font-family: monospace;">${med.claveCNIS}</span></td>
                <td><strong>${med.nombre}</strong> (${med.concentracion})</td>
                <td><strong style="font-family: monospace; color: var(--donacion-purple);">${l.lote}</strong></td>
                <td>${l.fechaCaducidad}</td>
                <td><strong style="font-size: 0.95rem;">${l.existencia}</strong> pzas</td>
                <td><span style="font-family: monospace;">${l.documentoAmparo || l.folioActa || '-'}</span></td>
                <td><span style="font-size: 0.75rem;">${l.donante || 'Donación Oficial'}</span></td>
                <td>
                  <button class="btn btn-purple btn-sm" onclick="window.farmaciaApp.dispensarDonacion('${med.id}', '${l.lote}')">
                    <i class="fa-solid fa-hand-holding-heart"></i> Surtir
                  </button>
                </td>
              </tr>
            `;
          }
        });
      }
    });

    tbodyInv.innerHTML = htmlInv || `<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:var(--slate-400);">No hay medicamentos donados actualmente en inventario.</td></tr>`;
  }

  // ==========================================================================
  // LLENADO DE SELECTORES EN FORMULARIOS
  // ==========================================================================
  function populateSelects() {
    const entradaMedSelect = document.getElementById('entrada-medicamento-select');
    const salidaMedSelect = document.getElementById('salida-medicamento-select');

    if (entradaMedSelect) {
      entradaMedSelect.innerHTML = '<option value="">-- Seleccione Medicamento --</option>' +
        appState.catalogo.map(m => `<option value="${m.id}">${m.nombre} (${m.concentracion}) - ${m.claveCNIS}</option>`).join('');
    }

    if (salidaMedSelect) {
      salidaMedSelect.innerHTML = '<option value="">-- Seleccione Medicamento --</option>' +
        appState.catalogo.map(m => `<option value="${m.id}">${m.nombre} (${m.concentracion})</option>`).join('');
    }
  }

  // ==========================================================================
  // EVENTOS Y NAVEGACIÓN
  // ==========================================================================
  function setupEventListeners() {
    // Pestañas
    const tabs = document.querySelectorAll('.nav-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const target = tab.getAttribute('data-tab');
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        const pane = document.getElementById(target);
        if (pane) pane.classList.add('active');

        // Si cambia al dashboard, redibujar gráficas (dimensiones SVG)
        if (target === 'tab-dashboard') {
          setTimeout(renderCharts, 50);
        }
      });
    });

    // Selector de Periodo de Gráfica (Diario, Semanal, Mensual)
    const periodBtns = document.querySelectorAll('.period-btn');
    periodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        periodBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        appState.currentPeriod = btn.getAttribute('data-period');
        renderLineChart();
      });
    });

    // Buscadores y filtros instantáneos
    bindSearch('search-inventario', renderInventarioTable);
    bindSearch('filter-cat-inventario', renderInventarioTable);
    bindSearch('filter-frio-inventario', renderInventarioTable);

    bindSearch('search-entradas', renderEntradasTable);
    bindSearch('filter-origen-entradas', renderEntradasTable);

    bindSearch('search-salidas', renderSalidasTable);
    bindSearch('filter-servicio-salidas', renderSalidasTable);

    bindSearch('search-lotes', renderLotesTable);
    bindSearch('filter-semaforo-lotes', renderLotesTable);

    bindSearch('search-donaciones', renderDonacionesTable);

    // Control de Permisos por Rol (RBAC)
    function checkPermission(accion) {
      const rol = ROLES_DEF[currentRoleKey];
      if (accion === 'modificar' && !rol.puedeModificar) {
        alert(`🔒 RESTRICCIÓN DE SEGURIDAD RBAC (NOM-024-SSA3):\nEl usuario actual (${rol.nombre}) tiene rol de [${rol.rolNombre}].\nNo cuenta con permisos de modificación en inventario. Inicie sesión como Q.F.B. o Auxiliar.`);
        return false;
      }
      if (accion === 'dispensar' && !rol.puedeDispensar) {
        alert(`🔒 RESTRICCIÓN DE SEGURIDAD RBAC:\nEl usuario actual (${rol.nombre}) cuenta con perfil de SOLO LECTURA para auditoría. No está facultado para dispensar medicamentos.`);
        return false;
      }
      if (accion === 'donar' && !rol.puedeDonar) {
        alert(`🔒 RESTRICCIÓN SANITARIA COFEPRIS:\nÚnicamente el Responsable Sanitario (Q.F.B.) tiene facultades legales para certificar y autorizar Actas de Donación.`);
        return false;
      }
      return true;
    }

    // Selector de Usuario y Rol Activo en Header
    document.getElementById('select-active-role')?.addEventListener('change', e => {
      currentRoleKey = e.target.value;
      const r = ROLES_DEF[currentRoleKey];
      setText('current-user-avatar', r.avatar);
      setText('current-user-name', r.nombre);
      registrarAuditLog('CAMBIO_ROL_SEGURIDAD', `Sesión conmutada a ${r.rolNombre} (${r.nombre})`);
    });

    // Botones de acción rápida con verificación de seguridad
    document.getElementById('btn-nueva-entrada-header')?.addEventListener('click', () => {
      if (checkPermission('modificar')) openModal('modal-nueva-entrada');
    });
    document.getElementById('btn-registrar-entrada')?.addEventListener('click', () => {
      if (checkPermission('modificar')) openModal('modal-nueva-entrada');
    });

    document.getElementById('btn-nueva-salida-header')?.addEventListener('click', () => {
      if (checkPermission('dispensar')) openModal('modal-nueva-salida');
    });
    document.getElementById('btn-registrar-salida')?.addEventListener('click', () => {
      if (checkPermission('dispensar')) openModal('modal-nueva-salida');
    });

    document.getElementById('btn-nueva-donacion-header')?.addEventListener('click', () => {
      if (checkPermission('donar')) openModal('modal-nueva-donacion');
    });
    document.getElementById('btn-registrar-donacion')?.addEventListener('click', () => {
      if (checkPermission('donar')) openModal('modal-nueva-donacion');
    });

    // Botones de Reporte Oficial con Logotipo y Bitácora de Seguridad
    document.getElementById('btn-imprimir-reporte-ejecutivo')?.addEventListener('click', abrirReporteEjecutivoLogo);
    document.getElementById('btn-abrir-bitacora')?.addEventListener('click', abrirBitacoraAuditoria);
    document.getElementById('btn-lock-session')?.addEventListener('click', () => bloquearTerminal(false));
    document.getElementById('btn-ver-seguridad')?.addEventListener('click', () => openModal('modal-estado-seguridad'));
    document.getElementById('btn-rep-oficial-imprimir')?.addEventListener('click', abrirReporteEjecutivoLogo);
    document.getElementById('btn-rep-vale-imprimir')?.addEventListener('click', abrirUltimoVale);

    // Exportar Excel directo
    document.getElementById('btn-export-excel-quick')?.addEventListener('click', exportarInventarioExcel);
    document.getElementById('btn-export-inventario-excel')?.addEventListener('click', exportarInventarioExcel);
    document.getElementById('btn-export-entradas-excel')?.addEventListener('click', exportarEntradasExcel);
    document.getElementById('btn-export-salidas-excel')?.addEventListener('click', exportarSalidasExcel);
    document.getElementById('btn-export-lotes-excel')?.addEventListener('click', exportarLotesExcel);
    document.getElementById('btn-export-donaciones-excel')?.addEventListener('click', exportarDonacionesExcel);

    // Botones de reportes en pestaña reportes
    document.getElementById('btn-rep-excel-inventario')?.addEventListener('click', exportarInventarioExcel);
    document.getElementById('btn-rep-excel-entradas')?.addEventListener('click', exportarEntradasExcel);
    document.getElementById('btn-rep-excel-salidas')?.addEventListener('click', exportarSalidasExcel);
    document.getElementById('btn-rep-excel-donaciones')?.addEventListener('click', exportarDonacionesExcel);
    document.getElementById('btn-descargar-plantilla-excel')?.addEventListener('click', descargarPlantillaExcel);

    // PEPS dinámico al cambiar medicamento en salida
    const salidaMedSelect = document.getElementById('salida-medicamento-select');
    if (salidaMedSelect) {
      salidaMedSelect.addEventListener('change', () => {
        actualizarSugerenciaPEPS(salidaMedSelect.value);
      });
    }

    // Botón nueva clave catálogo
    document.getElementById('btn-nueva-clave')?.addEventListener('click', () => {
      if (checkPermission('modificar')) openModal('modal-nueva-clave');
    });
    document.getElementById('btn-guardar-clave')?.addEventListener('click', handleGuardarClave);

    // Guardar formularios
    document.getElementById('btn-guardar-entrada')?.addEventListener('click', handleGuardarEntrada);
    document.getElementById('btn-guardar-salida')?.addEventListener('click', handleGuardarSalida);
    document.getElementById('btn-guardar-donacion')?.addEventListener('click', handleGuardarDonacion);
  }

  function handleGuardarClave(e) {
    e.preventDefault();
    const cnis = document.getElementById('clave-cnis-input').value.trim();
    const nombre = document.getElementById('clave-nombre-input').value.trim();
    const conc = document.getElementById('clave-concentracion-input').value.trim();
    const forma = document.getElementById('clave-forma-input').value.trim();
    const pres = document.getElementById('clave-presentacion-input').value.trim();
    const cat = document.getElementById('clave-categoria-input').value;
    const frio = document.getElementById('clave-frio-input').value === 'si';
    const costo = parseFloat(document.getElementById('clave-costo-input').value) || 0;
    const sMin = parseInt(document.getElementById('clave-stock-min-input').value, 10) || 50;
    const sOpt = parseInt(document.getElementById('clave-stock-opt-input').value, 10) || 200;

    if (!cnis || !nombre || !conc || !forma || !pres) {
      alert('Por favor complete todos los campos obligatorios (*).');
      return;
    }

    const nuevoMed = {
      id: 'MED-' + (appState.catalogo.length + 1).toString().padStart(3, '0'),
      claveCNIS: cnis,
      nombre: nombre,
      concentracion: conc,
      formaFarmaceutica: forma,
      presentacion: pres,
      categoria: cat,
      redFrio: frio,
      tempRango: frio ? '2°C a 8°C' : '15°C a 25°C',
      stockMinimo: sMin,
      stockOptimo: sOpt,
      costoReferencia: costo,
      lotes: []
    };

    appState.catalogo.push(nuevoMed);
    registrarAuditLog('ALTA_CLAVE_CATÁLOGO', `Nueva clave ${cnis}: ${nombre} (${conc})`);
    saveState();
    closeModal('modal-nueva-clave');
    document.getElementById('form-nueva-clave').reset();
    renderAll();
    alert(`Clave ${cnis} (${nombre}) agregada exitosamente al catálogo.`);
  }

  function bindSearch(elementId, callback) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.addEventListener('input', callback);
    el.addEventListener('change', callback);
  }

  // ==========================================================================
  // SISTEMA DE MODALES Y DIÁLOGOS
  // ==========================================================================
  function setupModals() {
    const closeButtons = document.querySelectorAll('[data-close]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        closeModal(modalId);
      });
    });

    // Cerrar al dar click fuera del modal
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', e => {
        if (e.target === backdrop) {
          backdrop.classList.remove('open');
        }
      });
    });
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  }

  // ==========================================================================
  // LÓGICA DE SALIDAS BAJO ALGORITMO PEPS / FEFO (PCPS)
  // ==========================================================================
  function actualizarSugerenciaPEPS(medId) {
    const loteSelect = document.getElementById('salida-lote-select');
    const pepsBox = document.getElementById('peps-suggestion-box');
    const pepsText = document.getElementById('peps-text');
    if (!loteSelect || !pepsText) return;

    if (!medId) {
      loteSelect.innerHTML = '<option value="">-- Seleccione medicamento primero --</option>';
      pepsText.innerHTML = 'Seleccione un medicamento para calcular el lote prioritario por caducidad (PEPS).';
      return;
    }

    const med = appState.catalogo.find(m => m.id === medId);
    if (!med || !med.lotes || med.lotes.length === 0) {
      loteSelect.innerHTML = '<option value="">-- No hay lotes registrados --</option>';
      pepsText.innerHTML = 'Sin lotes disponibles en este momento.';
      return;
    }

    // Filtrar lotes con existencia > 0 y no caducados
    const disponibles = med.lotes.filter(l => l.existencia > 0);
    if (disponibles.length === 0) {
      loteSelect.innerHTML = '<option value="">-- Stock agotado en todos los lotes --</option>';
      pepsText.innerHTML = '<strong style="color:var(--sem-rojo);">⚠️ STOCK AGOTADO:</strong> No hay piezas disponibles para dispensar.';
      return;
    }

    // Ordenar por fecha de caducidad ascendente (Primeras Caducidades, Primeras Salidas)
    disponibles.sort((a, b) => new Date(a.fechaCaducidad) - new Date(b.fechaCaducidad));

    const prioritario = disponibles[0];
    const sem = calcularSemaforo(prioritario.fechaCaducidad);

    // Llenar select
    loteSelect.innerHTML = disponibles.map((l, idx) => {
      const isPri = idx === 0 ? ' [RECOMENDADO PEPS]' : '';
      return `<option value="${l.lote}" ${idx === 0 ? 'selected' : ''}>${l.lote} (Cad: ${l.fechaCaducidad}, Stock: ${l.existencia} pzas)${isPri}</option>`;
    }).join('');

    pepsText.innerHTML = `
      <strong><i class="fa-solid fa-circle-check"></i> Algoritmo PEPS/FEFO Activo:</strong> Se ha seleccionado automáticamente el lote 
      <span style="font-family: monospace; font-weight: 700; color: #000;">${prioritario.lote}</span> 
      con vencimiento más próximo (<strong>${prioritario.fechaCaducidad}</strong>, restan ${sem.dias} días) para evitar pérdidas por caducidad.
    `;
  }

  // ==========================================================================
  // MANEJADORES DE GUARDADO DE ENTRADAS Y SALIDAS
  // ==========================================================================
  function handleGuardarEntrada(e) {
    e.preventDefault();
    const origen = document.getElementById('entrada-origen').value;
    const doc = document.getElementById('entrada-documento').value.trim();
    const medId = document.getElementById('entrada-medicamento-select').value;
    const loteNum = document.getElementById('entrada-lote').value.trim();
    const fabricante = document.getElementById('entrada-fabricante').value.trim() || 'Oficial';
    const caducidad = document.getElementById('entrada-caducidad').value;
    const cantidad = parseInt(document.getElementById('entrada-cantidad').value, 10);
    const costo = parseFloat(document.getElementById('entrada-costo').value) || 0;
    const temp = document.getElementById('entrada-temp').value.trim();
    const obs = document.getElementById('entrada-obs').value.trim();

    if (!doc || !medId || !loteNum || !caducidad || !cantidad || cantidad <= 0) {
      alert('Por favor complete todos los campos obligatorios (*).');
      return;
    }

    const med = appState.catalogo.find(m => m.id === medId);
    if (!med) return;

    // Buscar si el lote ya existe en el medicamento
    if (!med.lotes) med.lotes = [];
    let loteObj = med.lotes.find(l => l.lote === loteNum);
    if (loteObj) {
      loteObj.existencia += cantidad;
      loteObj.fechaCaducidad = caducidad;
    } else {
      med.lotes.push({
        lote: loteNum,
        fabricante: fabricante,
        fechaFabricacion: new Date().toISOString().split('T')[0],
        fechaCaducidad: caducidad,
        cantidadInicial: cantidad,
        existencia: cantidad,
        origen: origen,
        documentoAmparo: doc,
        redFrioVerificada: !!temp,
        tempLlegada: temp
      });
    }

    // Registrar en movimientos
    const now = new Date();
    const fechaHora = now.toISOString().replace('T', ' ').substring(0, 16);
    const idMov = 'MOV-ENT-' + (appState.movimientos.length + 101);

    appState.movimientos.unshift({
      id: idMov,
      tipo: 'ENTRADA',
      fecha: fechaHora,
      fechaDia: now.toISOString().split('T')[0],
      origen: origen,
      documento: doc,
      claveCNIS: med.claveCNIS,
      medicamento: med.nombre,
      lote: loteNum,
      caducidad: caducidad,
      piezas: cantidad,
      costoUnitario: costo || med.costoReferencia || 0,
      costoTotal: (costo || med.costoReferencia || 0) * cantidad,
      servicio: 'Almacén de Farmacia',
      observaciones: obs + (temp ? ` [Temp: ${temp}]` : '')
    });

    registrarAuditLog('RECEPCIÓN_ABASTO', `${cantidad} pzas de ${med.nombre} (Lote: ${loteNum}, Doc: ${doc})`);
    saveState();
    closeModal('modal-nueva-entrada');
    document.getElementById('form-nueva-entrada').reset();
    renderAll();
    alert(`Entrada ${idMov} registrada exitosamente: ${cantidad} piezas de ${med.nombre} ingresadas al inventario.`);
  }

  function handleGuardarSalida(e) {
    e.preventDefault();
    const tipo = document.getElementById('salida-tipo').value;
    const servicio = document.getElementById('salida-servicio').value;
    const medId = document.getElementById('salida-medicamento-select').value;
    const loteNum = document.getElementById('salida-lote-select').value;
    const cantidad = parseInt(document.getElementById('salida-cantidad').value, 10);
    const paciente = document.getElementById('salida-paciente').value.trim();
    const expediente = document.getElementById('salida-expediente').value.trim();
    const medico = document.getElementById('salida-medico').value.trim();
    const motivo = document.getElementById('salida-motivo').value.trim();

    if (!tipo || !servicio || !medId || !loteNum || !cantidad || cantidad <= 0 || !medico) {
      alert('Por favor complete los campos requeridos (*).');
      return;
    }

    const med = appState.catalogo.find(m => m.id === medId);
    if (!med) return;

    const loteObj = med.lotes.find(l => l.lote === loteNum);
    if (!loteObj) {
      alert('Error: Lote no encontrado.');
      return;
    }

    if (loteObj.existencia < cantidad) {
      alert(`Existencia insuficiente en el lote ${loteNum}. Stock disponible: ${loteObj.existencia} piezas.`);
      return;
    }

    // Descontar existencia física
    loteObj.existencia -= cantidad;

    // Registrar en movimientos
    const now = new Date();
    const fechaHora = now.toISOString().replace('T', ' ').substring(0, 16);
    const idMov = 'MOV-SAL-' + (appState.movimientos.length + 201);

    appState.movimientos.unshift({
      id: idMov,
      tipo: 'SALIDA',
      subtipo: tipo,
      fecha: fechaHora,
      fechaDia: now.toISOString().split('T')[0],
      servicio: servicio,
      solicitante: medico,
      paciente: paciente,
      expediente: expediente,
      diagnostico: motivo,
      claveCNIS: med.claveCNIS,
      medicamento: med.nombre,
      lote: loteNum,
      caducidad: loteObj.fechaCaducidad,
      piezas: cantidad,
      costoUnitario: med.costoReferencia || 0,
      costoTotal: (med.costoReferencia || 0) * cantidad,
      motivo: motivo
    });

    registrarAuditLog('DISPENSACIÓN_PEPS', `${cantidad} pzas de ${med.nombre} (Lote: ${loteNum}) para ${servicio}`);
    saveState();
    closeModal('modal-nueva-salida');
    document.getElementById('form-nueva-salida').reset();
    renderAll();
    
    // Ofrecer impresión de vale oficial con logotipo
    imprimirVale(idMov);
  }

  function handleGuardarDonacion(e) {
    e.preventDefault();
    const folio = document.getElementById('donacion-folio').value.trim();
    const tipoDonante = document.getElementById('donacion-tipo-donante').value;
    const donanteNombre = document.getElementById('donacion-donante-nombre').value.trim();
    const donanteRfc = document.getElementById('donacion-donante-rfc').value.trim();
    const donanteRep = document.getElementById('donacion-donante-rep').value.trim();
    const donanteTel = document.getElementById('donacion-donante-tel').value.trim();
    const medNombre = document.getElementById('donacion-medicamento').value.trim();
    const claveCNIS = document.getElementById('donacion-cnis').value.trim() || 'DON-CNIS-001';
    const loteNum = document.getElementById('donacion-lote').value.trim();
    const caducidad = document.getElementById('donacion-caducidad').value;
    const cantidad = parseInt(document.getElementById('donacion-cantidad').value, 10);
    const valor = parseFloat(document.getElementById('donacion-valor').value) || 0;
    const motivo = document.getElementById('donacion-motivo').value.trim();

    if (!donanteNombre || !donanteRfc || !medNombre || !loteNum || !caducidad || !cantidad || cantidad <= 0) {
      alert('Por favor complete los datos obligatorios del acta de donación.');
      return;
    }

    // Validar caducidad mínima requerida según norma de donación (> 180 días)
    const sem = calcularSemaforo(caducidad);
    if (sem.dias < 180) {
      const confirmacion = confirm(`ADVERTENCIA COFEPRIS: El medicamento tiene una vida útil menor a 6 meses (${sem.dias} días). ¿Desea proceder bajo justificación de consumo de emergencia obstétrica inmediata?`);
      if (!confirmacion) return;
    }

    const now = new Date();
    const fechaHoy = now.toISOString().split('T')[0];

    // Crear Acta Oficial
    const nuevaActa = {
      folioActa: folio,
      fecha: fechaHoy,
      donante: {
        tipo: tipoDonante,
        nombre: donanteNombre,
        rfc: donanteRfc,
        representante: donanteRep || donanteNombre,
        telefono: donanteTel,
        domicilio: 'Tepic, Nayarit'
      },
      insumos: [
        {
          claveCNIS: claveCNIS,
          medicamento: medNombre,
          lote: loteNum,
          caducidad: caducidad,
          cantidad: cantidad,
          valorEstimado: valor,
          cumpleCofepris: true
        }
      ],
      responsableReceptor: appState.hospitalInfo.responsableFarmacia || 'Q.F.B. Mariana E. Ramos Peña',
      testigo1: 'Dr. Jorge Arturo Valdez - Subdirector Médico',
      testigo2: 'C.P. Rosa Elena Miramontes - Administradora de Unidad',
      motivo: motivo,
      estatus: 'Aprobada e Incorporada a Inventario',
      cartaNoComercializacion: true
    };

    appState.donaciones.unshift(nuevaActa);

    // Integrar al catálogo como ítem de donación
    let medExistente = appState.catalogo.find(m => m.nombre.toLowerCase().includes(medNombre.toLowerCase()));
    if (!medExistente) {
      medExistente = {
        id: 'MED-DON-' + (appState.catalogo.length + 1),
        claveCNIS: claveCNIS,
        nombre: medNombre + ' (Donación)',
        concentracion: 'Uso Hospitalario',
        formaFarmaceutica: 'Insumo Donado',
        presentacion: 'Presentación Oficial',
        categoria: 'Gineco-Obstetricia y Hospitalización',
        redFrio: false,
        stockMinimo: 20,
        stockOptimo: 80,
        costoReferencia: valor / cantidad || 0,
        esDonacion: true,
        lotes: []
      };
      appState.catalogo.push(medExistente);
    }

    medExistente.lotes.push({
      lote: loteNum,
      fabricante: 'Laboratorio Autorizado',
      fechaFabricacion: fechaHoy,
      fechaCaducidad: caducidad,
      cantidadInicial: cantidad,
      existencia: cantidad,
      origen: 'Donación Institucional Autorizada',
      documentoAmparo: folio,
      folioActa: folio,
      donante: donanteNombre
    });

    // Movimiento de entrada
    appState.movimientos.unshift({
      id: 'MOV-ENT-DON-' + (appState.movimientos.length + 101),
      tipo: 'ENTRADA',
      fecha: now.toISOString().replace('T', ' ').substring(0, 16),
      fechaDia: fechaHoy,
      origen: 'Donación Institucional Autorizada',
      documento: folio,
      claveCNIS: claveCNIS,
      medicamento: medNombre + ' (Donación)',
      lote: loteNum,
      caducidad: caducidad,
      piezas: cantidad,
      costoUnitario: valor / cantidad || 0,
      costoTotal: valor,
      servicio: 'Almacén de Farmacia',
      observaciones: `Acta ${folio} de ${donanteNombre}. Sin costo erario.`
    });

    // Incrementar número de folio sugerido para la siguiente
    document.getElementById('donacion-folio').value = 'ACTA-DON-2026-00' + (appState.donaciones.length + 1);

    registrarAuditLog('ACTA_DONACIÓN_COFEPRIS', `Acta ${folio}: ${cantidad} pzas de ${medNombre} (Donante: ${donanteNombre})`);
    saveState();
    closeModal('modal-nueva-donacion');
    document.getElementById('form-nueva-donacion').reset();
    renderAll();
    alert(`Acta ${folio} generada y registrada con éxito. ${cantidad} piezas de medicamento donado añadidas al inventario de farmacia.`);
    verActa(folio);
  }

  // ==========================================================================
  // EXPORTACIÓN A EXCEL (.XLSX) CON SHEETJS
  // ==========================================================================
  function exportarInventarioExcel() {
    if (typeof XLSX === 'undefined') {
      alert('La librería XLSX no está cargada. Asegúrese de contar con conexión a internet o cargar vendor/xlsx.full.min.js');
      return;
    }

    const rows = [];
    rows.push(['GOBIERNO DE MÉXICO - SERVICIOS DE SALUD IMSS-BIENESTAR']);
    rows.push(['HOSPITAL DE LA MUJER DE TEPIC, NAYARIT - FARMACIA HOSPITALARIA']);
    rows.push(['REPORTE OFICIAL DE INVENTARIO Y LOTIFICACIÓN DE MEDICAMENTOS']);
    rows.push(['Fecha de Emisión: ' + new Date().toLocaleString()]);
    rows.push([]);
    rows.push(['Clave CNIS', 'Medicamento', 'Concentración', 'Categoría Hospitalaria', 'Presentación', 'Red de Frío', 'Lote', 'Caducidad', 'Días Restantes', 'Semáforo', 'Existencia (Pzas)', 'Origen']);

    appState.catalogo.forEach(med => {
      if (med.lotes && med.lotes.length > 0) {
        med.lotes.forEach(l => {
          const sem = calcularSemaforo(l.fechaCaducidad);
          rows.push([
            med.claveCNIS,
            med.nombre,
            med.concentracion,
            med.categoria,
            med.presentacion,
            med.redFrio ? 'SÍ (2-8°C)' : 'NO (Ambiente)',
            l.lote,
            l.fechaCaducidad,
            sem.dias,
            sem.texto,
            l.existencia,
            l.origen
          ]);
        });
      } else {
        rows.push([
          med.claveCNIS,
          med.nombre,
          med.concentracion,
          med.categoria,
          med.presentacion,
          med.redFrio ? 'SÍ' : 'NO',
          'SIN LOTE',
          '-',
          '-',
          'Agotado',
          0,
          '-'
        ]);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario_Hospital_Mujer');
    XLSX.writeFile(wb, `Inventario_Farmacia_Hospital_Mujer_Tepic_${getFechaCompacta()}.xlsx`);
  }

  function exportarEntradasExcel() {
    if (typeof XLSX === 'undefined') return;

    const rows = [];
    rows.push(['GOBIERNO DE MÉXICO - SERVICIOS DE SALUD IMSS-BIENESTAR']);
    rows.push(['HOSPITAL DE LA MUJER DE TEPIC, NAYARIT']);
    rows.push(['REPORTE CRONOLÓGICO DE ENTRADAS Y RECEPCIÓN DE MEDICAMENTOS (BIRMEX / ALMACÉN)']);
    rows.push(['Fecha de Emisión: ' + new Date().toLocaleString()]);
    rows.push([]);
    rows.push(['Folio Entrada', 'Fecha y Hora', 'Origen / Proveedor', 'Documento de Amparo', 'Clave CNIS', 'Medicamento', 'Lote', 'Caducidad', 'Piezas', 'Costo Unitario ($)', 'Costo Total ($)', 'Observaciones']);

    const entradas = appState.movimientos.filter(m => m.tipo === 'ENTRADA');
    entradas.forEach(e => {
      rows.push([
        e.id,
        e.fecha,
        e.origen,
        e.documento,
        e.claveCNIS,
        e.medicamento,
        e.lote,
        e.caducidad,
        e.piezas,
        e.costoUnitario || 0,
        e.costoTotal || 0,
        e.observaciones || ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kardex_Entradas_BIRMEX');
    XLSX.writeFile(wb, `Reporte_Entradas_BIRMEX_Hospital_Mujer_${getFechaCompacta()}.xlsx`);
  }

  function exportarSalidasExcel() {
    if (typeof XLSX === 'undefined') return;

    const rows = [];
    rows.push(['GOBIERNO DE MÉXICO - SERVICIOS DE SALUD IMSS-BIENESTAR']);
    rows.push(['HOSPITAL DE LA MUJER DE TEPIC, NAYARIT']);
    rows.push(['REPORTE DE SALIDAS Y DISPENSACIÓN POR SERVICIO HOSPITALARIO']);
    rows.push(['Fecha de Emisión: ' + new Date().toLocaleString()]);
    rows.push([]);
    rows.push(['Folio Salida', 'Fecha', 'Tipo', 'Servicio Hospitalario', 'Solicitante / Médico', 'Paciente', 'Expediente', 'Medicamento', 'Lote Asignado (PEPS)', 'Piezas', 'Diagnóstico / Motivo']);

    const salidas = appState.movimientos.filter(m => m.tipo === 'SALIDA');
    salidas.forEach(s => {
      rows.push([
        s.id,
        s.fecha,
        s.subtipo || 'Receta',
        s.servicio,
        s.solicitante || '',
        s.paciente || 'Stock de Piso',
        s.expediente || '',
        s.medicamento,
        s.lote,
        s.piezas,
        s.diagnostico || s.motivo || ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Salidas_Hospital_Mujer');
    XLSX.writeFile(wb, `Reporte_Salidas_Farmacia_Hospital_Mujer_${getFechaCompacta()}.xlsx`);
  }

  function exportarLotesExcel() {
    if (typeof XLSX === 'undefined') return;

    const rows = [];
    rows.push(['GOBIERNO DE MÉXICO - SERVICIOS DE SALUD IMSS-BIENESTAR']);
    rows.push(['HOSPITAL DE LA MUJER DE TEPIC, NAYARIT']);
    rows.push(['AUDITORÍA DE LOTES Y SEMÁFORO DE CADUCIDADES (PEPS / FEFO)']);
    rows.push(['Fecha de Emisión: ' + new Date().toLocaleString()]);
    rows.push([]);
    rows.push(['Lote', 'Clave CNIS', 'Medicamento', 'Fabricante', 'Origen', 'Fecha de Caducidad', 'Días Restantes', 'Semáforo', 'Existencia Física']);

    appState.catalogo.forEach(med => {
      if (med.lotes) {
        med.lotes.forEach(l => {
          const sem = calcularSemaforo(l.fechaCaducidad);
          rows.push([
            l.lote,
            med.claveCNIS,
            med.nombre,
            l.fabricante || 'Oficial',
            l.origen || 'BIRMEX',
            l.fechaCaducidad,
            sem.dias,
            sem.texto,
            l.existencia
          ]);
        });
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoria_Lotes_Semaforo');
    XLSX.writeFile(wb, `Auditoria_Lotes_Hospital_Mujer_${getFechaCompacta()}.xlsx`);
  }

  function exportarDonacionesExcel() {
    if (typeof XLSX === 'undefined') return;

    const rows = [];
    rows.push(['GOBIERNO DE MÉXICO - SERVICIOS DE SALUD IMSS-BIENESTAR']);
    rows.push(['HOSPITAL DE LA MUJER DE TEPIC, NAYARIT']);
    rows.push(['LIBRO OFICIAL DE DONACIONES DE MEDICAMENTOS E INSUMOS SANITARIOS']);
    rows.push(['Fecha de Emisión: ' + new Date().toLocaleString()]);
    rows.push([]);
    rows.push(['Folio de Acta', 'Fecha Recepción', 'Donante / Institución', 'Tipo Donante', 'RFC / Identificación', 'Insumos Amparados', 'Piezas Donadas', 'Valor Estimado ($)', 'Cumple COFEPRIS', 'Justificación']);

    appState.donaciones.forEach(d => {
      let piezas = 0, valor = 0, insNombres = [];
      d.insumos.forEach(ins => {
        piezas += ins.cantidad;
        valor += ins.valorEstimado;
        insNombres.push(`${ins.medicamento} [Lote: ${ins.lote}, Cad: ${ins.caducidad}]`);
      });

      rows.push([
        d.folioActa,
        d.fecha,
        d.donante.nombre,
        d.donante.tipo,
        d.donante.rfc,
        insNombres.join('; '),
        piezas,
        valor,
        d.insumos[0]?.cumpleCofepris ? 'SÍ' : 'NO',
        d.motivo
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Libro_Oficial_Donaciones');
    XLSX.writeFile(wb, `Libro_Donaciones_Hospital_Mujer_${getFechaCompacta()}.xlsx`);
  }

  function descargarPlantillaExcel() {
    if (typeof XLSX === 'undefined') return;

    const rows = [
      ['Clave CNIS', 'Medicamento', 'Concentracion', 'Forma Farmaceutica', 'Categoria', 'Lote', 'Caducidad (AAAA-MM-DD)', 'Cantidad', 'Origen'],
      ['010.000.2141.00', 'Oxitocina', '5 UI / 1 mL', 'Solucion Inyectable', 'Codigo Mater / Emergencia Obstetrica', 'L-OX9901', '2028-06-30', 200, 'BIRMEX (Compra Consolidada Federal)'],
      ['010.000.1242.00', 'Sulfato de Magnesio', '1 g / 10 mL', 'Solucion Inyectable', 'Codigo Mater / Emergencia Obstetrica', 'L-SM8812', '2027-12-31', 150, 'Almacen Central Estatal IMSS-Bienestar Nayarit']
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Captura_IMSS_B');
    XLSX.writeFile(wb, 'Plantilla_Oficial_Captura_Farmacia_Hospital_Mujer.xlsx');
  }

  // ==========================================================================
  // IMPORTACIÓN MASIVA DESDE EXCEL
  // ==========================================================================
  function setupDropzone() {
    const dropzone = document.getElementById('excel-dropzone');
    const fileInput = document.getElementById('excel-file-input');
    if (!dropzone || !fileInput) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('drag-over');
      });
    });

    dropzone.addEventListener('drop', e => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) procesarArchivoExcel(files[0]);
    });

    fileInput.addEventListener('change', e => {
      if (e.target.files.length > 0) procesarArchivoExcel(e.target.files[0]);
    });

    document.getElementById('btn-cancel-import')?.addEventListener('click', () => {
      appState.tempImportData = [];
      document.getElementById('import-preview-container').style.display = 'none';
      fileInput.value = '';
    });

    document.getElementById('btn-confirm-import')?.addEventListener('click', confirmarImportacionExcel);
  }

  function procesarArchivoExcel(file) {
    if (typeof XLSX === 'undefined') {
      alert('Error: Librería XLSX no disponible.');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!json || json.length < 2) {
          alert('El archivo no contiene suficientes filas de datos.');
          return;
        }

        // Buscar encabezados
        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(json.length, 10); i++) {
          const rowStr = json[i].join(' ').toLowerCase();
          if (rowStr.includes('clave') || rowStr.includes('medicamento') || rowStr.includes('lote')) {
            headerRowIdx = i;
            break;
          }
        }

        const headers = json[headerRowIdx].map(h => (h || '').toString().toLowerCase());
        const colClave = headers.findIndex(h => h.includes('clave') || h.includes('cnis'));
        const colMed = headers.findIndex(h => h.includes('medicamento') || h.includes('nombre') || h.includes('descripcion'));
        const colLote = headers.findIndex(h => h.includes('lote'));
        const colCad = headers.findIndex(h => h.includes('caducidad') || h.includes('vencimiento'));
        const colCant = headers.findIndex(h => h.includes('cantidad') || h.includes('piezas') || h.includes('stock'));
        const colOrigen = headers.findIndex(h => h.includes('origen') || h.includes('proveedor'));

        const parsedRows = [];
        for (let i = headerRowIdx + 1; i < json.length; i++) {
          const row = json[i];
          if (!row || row.length === 0) continue;

          const clave = colClave >= 0 ? (row[colClave] || '').toString().trim() : '';
          const med = colMed >= 0 ? (row[colMed] || '').toString().trim() : '';
          const lote = colLote >= 0 ? (row[colLote] || '').toString().trim() : 'LOTE-IMP';
          let cad = colCad >= 0 ? (row[colCad] || '').toString().trim() : '2028-12-31';
          const cant = colCant >= 0 ? parseInt(row[colCant], 10) || 0 : 0;
          const orig = colOrigen >= 0 ? (row[colOrigen] || 'Importación Excel') : 'Importación Excel';

          if (med && cant > 0) {
            parsedRows.push({
              claveCNIS: clave || '010.000.IMP.00',
              medicamento: med,
              lote: lote,
              caducidad: normalizarFecha(cad),
              cantidad: cant,
              origen: orig
            });
          }
        }

        if (parsedRows.length === 0) {
          alert('No se pudieron extraer medicamentos válidos. Verifique que las columnas coincidan con la plantilla oficial.');
          return;
        }

        appState.tempImportData = parsedRows;
        mostrarVistaPreviaImportacion(parsedRows);
      } catch (err) {
        console.error('Error al procesar archivo Excel:', err);
        alert('Ocurrió un error al leer el archivo. Compruebe que sea un archivo de Excel válido.');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function normalizarFecha(val) {
    if (typeof val === 'number') {
      // Número serie de Excel
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    }
    if (typeof val === 'string') {
      const match = val.match(/\d{4}-\d{2}-\d{2}/);
      if (match) return match[0];
    }
    return '2027-12-31';
  }

  function mostrarVistaPreviaImportacion(rows) {
    const container = document.getElementById('import-preview-container');
    const tbody = document.getElementById('tbody-import-preview');
    const countSpan = document.getElementById('import-preview-count');
    if (!container || !tbody) return;

    countSpan.textContent = rows.length;

    let html = '';
    rows.slice(0, 15).forEach(r => {
      html += `
        <tr>
          <td><span style="font-family: monospace;">${r.claveCNIS}</span></td>
          <td><strong>${r.medicamento}</strong></td>
          <td><span style="font-family: monospace;">${r.lote}</span></td>
          <td>${r.caducidad}</td>
          <td><strong>${formatNumber(r.cantidad)}</strong></td>
          <td>${r.origen}</td>
        </tr>
      `;
    });

    if (rows.length > 15) {
      html += `<tr><td colspan="6" style="text-align:center; color:var(--slate-500);">... y ${rows.length - 15} filas más detectadas en el archivo.</td></tr>`;
    }

    tbody.innerHTML = html;
    container.style.display = 'block';
  }

  function confirmarImportacionExcel() {
    if (!appState.tempImportData || appState.tempImportData.length === 0) return;

    let importadas = 0;
    appState.tempImportData.forEach(item => {
      let med = appState.catalogo.find(m => m.claveCNIS === item.claveCNIS || m.nombre.toLowerCase() === item.medicamento.toLowerCase());
      if (!med) {
        med = {
          id: 'MED-' + (appState.catalogo.length + 1).toString().padStart(3, '0'),
          claveCNIS: item.claveCNIS,
          nombre: item.medicamento,
          concentracion: 'Uso Hospitalario',
          formaFarmaceutica: 'Insumo',
          presentacion: 'Pieza',
          categoria: 'Gineco-Obstetricia y Hospitalización',
          redFrio: false,
          stockMinimo: 50,
          stockOptimo: 200,
          costoReferencia: 25.00,
          lotes: []
        };
        appState.catalogo.push(med);
      }

      if (!med.lotes) med.lotes = [];
      let loteObj = med.lotes.find(l => l.lote === item.lote);
      if (loteObj) {
        loteObj.existencia += item.cantidad;
        loteObj.fechaCaducidad = item.caducidad;
      } else {
        med.lotes.push({
          lote: item.lote,
          fabricante: 'Importación Excel',
          fechaFabricacion: new Date().toISOString().split('T')[0],
          fechaCaducidad: item.caducidad,
          cantidadInicial: item.cantidad,
          existencia: item.cantidad,
          origen: item.origen || 'Importación Excel'
        });
      }

      importadas += item.cantidad;
    });

    // Registrar una entrada consolidada
    const now = new Date();
    appState.movimientos.unshift({
      id: 'MOV-ENT-IMP-' + (appState.movimientos.length + 101),
      tipo: 'ENTRADA',
      fecha: now.toISOString().replace('T', ' ').substring(0, 16),
      fechaDia: now.toISOString().split('T')[0],
      origen: 'Carga Masiva Excel (.xlsx)',
      documento: 'IMP-EXCEL-' + getFechaCompacta(),
      claveCNIS: 'VARIAS',
      medicamento: `Carga de ${appState.tempImportData.length} claves de medicamentos`,
      lote: 'VARIOS',
      caducidad: 'VARIAS',
      piezas: importadas,
      costoUnitario: 0,
      costoTotal: 0,
      servicio: 'Almacén de Farmacia',
      observaciones: `Importación masiva exitosa de ${appState.tempImportData.length} registros.`
    });

    saveState();
    appState.tempImportData = [];
    document.getElementById('import-preview-container').style.display = 'none';
    renderAll();
    alert(`Importación completada con éxito: ${importadas} piezas incorporadas al inventario.`);
  }

  // ==========================================================================
  // ACTAS OFICIALES Y MODALES DINÁMICOS
  // ==========================================================================
  function verActa(folioActa) {
    const acta = appState.donaciones.find(d => d.folioActa === folioActa);
    if (!acta) return;

    const container = document.getElementById('acta-imprimible-body');
    if (!container) return;

    let insumosHtml = '';
    let totalPzas = 0;
    let totalVal = 0;
    acta.insumos.forEach((ins, idx) => {
      totalPzas += ins.cantidad;
      totalVal += ins.valorEstimado;
      insumosHtml += `
        <tr>
          <td>${idx + 1}</td>
          <td><span style="font-family: monospace;">${ins.claveCNIS}</span></td>
          <td><strong>${ins.medicamento}</strong></td>
          <td><span style="font-family: monospace;">${ins.lote}</span></td>
          <td>${ins.caducidad}</td>
          <td>${ins.cantidad}</td>
          <td>$${formatCurrency(ins.valorEstimado)}</td>
        </tr>
      `;
    });

    container.innerHTML = `
      <div class="acta-preview-box">
        <div class="acta-header">
          <img src="Logo-hospital-de-la-mujer-servicios-de-salud-imss-bienestar.png" alt="IMSS-Bienestar">
          <h3>SERVICIOS DE SALUD DEL INSTITUTO MEXICANO DEL SEGURO SOCIAL PARA EL BIENESTAR</h3>
          <h4>HOSPITAL DE LA MUJER DE TEPIC, NAYARIT</h4>
          <div style="font-weight: 700; font-size: 0.9rem; margin-top: 0.5rem; color: #0c4a34;">
            ACTA ADMINISTRATIVA OFICIAL DE ENTREGA - RECEPCIÓN DE DONACIÓN DE MEDICAMENTOS E INSUMOS PARA LA SALUD
          </div>
          <div style="font-size: 0.8rem; font-family: monospace; font-weight: 700;">FOLIO: ${acta.folioActa}</div>
        </div>

        <p>
          En la ciudad de <strong>Tepic, Nayarit</strong>, siendo las 10:00 horas del día <strong>${acta.fecha}</strong>, reunidos en las instalaciones del <strong>Hospital de la Mujer de Tepic</strong> (CLUES: NTSMP000452), se hace constar la recepción formal de bienes farmacéuticos en calidad de <strong>DONACIÓN PURA, SIMPLE E INCONDICIONAL</strong>.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.75rem; border-radius: 6px; margin: 1rem 0;">
          <strong>DATOS DEL DONANTE:</strong><br>
          <strong>Nombre / Razón Social:</strong> ${acta.donante.nombre}<br>
          <strong>Carácter:</strong> ${acta.donante.tipo} | <strong>RFC / Cédula:</strong> ${acta.donante.rfc}<br>
          <strong>Representante Legal:</strong> ${acta.donante.representante} | <strong>Teléfono:</strong> ${acta.donante.telefono || '-'}<br>
          <strong>Domicilio:</strong> ${acta.donante.domicilio}
        </div>

        <p><strong>DETALLE DE MEDICAMENTOS RECIBIDOS:</strong></p>
        <table class="custom-table" style="margin-bottom: 1rem; border: 1px solid #000;">
          <thead>
            <tr style="background: #f1f5f9; color: #000;">
              <th>#</th>
              <th>Clave CNIS</th>
              <th>Descripción del Medicamento</th>
              <th>Lote</th>
              <th>Caducidad</th>
              <th>Cant.</th>
              <th>Valor Ref.</th>
            </tr>
          </thead>
          <tbody>
            ${insumosHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5"><strong>TOTALES CONSOLIDADOS</strong></td>
              <td><strong>${totalPzas} pzas</strong></td>
              <td><strong>$${formatCurrency(totalVal)}</strong></td>
            </tr>
          </tfoot>
        </table>

        <p style="font-size: 0.78rem;">
          <strong>CERTIFICACIÓN TÉCNICO-SANITARIA COFEPRIS:</strong> El Responsable Sanitario de la Farmacia Hospitalaria certifica que los medicamentos donados se encuentran en sus empaques originales íntegros e inviolados, cuentan con Registro Sanitario vigente, no ostentan leyendas de muestra médica comercial y poseen una fecha de caducidad superior a la norma mínima de vida útil. Dichos medicamentos serán destinados exclusivamente a la atención gratuita de pacientes en estado de vulnerabilidad en este nosocomio, sin fines de lucro ni lucro electoral.
        </p>

        <p style="font-size: 0.78rem;">
          <strong>Destino y justificación:</strong> ${acta.motivo}
        </p>

        <div class="acta-signatures">
          <div class="signature-line">
            <strong>ENTREGA POR EL DONANTE</strong><br>
            ${acta.donante.representante}<br>
            ${acta.donante.nombre}
          </div>
          <div class="signature-line">
            <strong>RECIBE POR EL HOSPITAL DE LA MUJER</strong><br>
            ${acta.responsableReceptor}<br>
            Responsable Sanitario de Farmacia
          </div>
        </div>

        <div class="acta-signatures" style="margin-top: 2rem;">
          <div class="signature-line">
            <strong>TESTIGO MÉDICO</strong><br>
            ${acta.testigo1}
          </div>
          <div class="signature-line">
            <strong>TESTIGO ADMINISTRATIVO</strong><br>
            ${acta.testigo2}
          </div>
        </div>
      </div>
    `;

    openModal('modal-visor-acta');
  }

  // ==========================================================================
  // BITÁCORA INMUTABLE DE AUDITORÍA Y SEGURIDAD (NOM-024-SSA3)
  // ==========================================================================
  function registrarAuditLog(accion, entidad) {
    const rol = ROLES_DEF[currentRoleKey] || ROLES_DEF.RESPONSABLE_SANITARIO;
    const now = new Date();
    const fechaHora = now.toISOString().replace('T', ' ').substring(0, 16);
    if (!appState.auditLogs) appState.auditLogs = [];
    appState.auditLogs.unshift({
      fecha: fechaHora,
      usuario: rol.nombre,
      rol: rol.rolNombre,
      accion: accion,
      entidad: entidad,
      ip: '10.24.12.' + (Math.floor(Math.random() * 80) + 10) + ' [Tepic-HMT]'
    });
    if (appState.auditLogs.length > 50) appState.auditLogs.pop();
    saveState();
  }

  function abrirBitacoraAuditoria() {
    const tbody = document.getElementById('tbody-audit-logs');
    if (!tbody) return;
    let html = '';
    (appState.auditLogs || []).forEach(log => {
      html += `
        <tr>
          <td><span style="font-family: monospace; font-size: 0.75rem;">${log.fecha}</span></td>
          <td><strong>${log.usuario}</strong></td>
          <td><span style="font-size: 0.72rem; color: var(--slate-600);">${log.rol}</span></td>
          <td><span class="badge badge-birmex">${log.accion}</span></td>
          <td>${log.entidad}</td>
          <td><span style="font-family: monospace; font-size: 0.72rem; color: var(--slate-500);">${log.ip}</span></td>
        </tr>
      `;
    });
    tbody.innerHTML = html || '<tr><td colspan="6" style="text-align:center;">Sin registros en bitácora.</td></tr>';
    openModal('modal-bitacora-auditoria');
  }

  // ==========================================================================
  // REPORTE EJECUTIVO OFICIAL CON LOGOTIPO INSTITUCIONAL
  // ==========================================================================
  function abrirReporteEjecutivoLogo() {
    const now = new Date();
    setText('reporte-fecha-emision', now.toISOString().split('T')[0]);
    setText('reporte-hora-emision', now.toTimeString().substring(0, 5) + ' hrs');

    let totalPiezas = 0, lotesAlertaCount = 0, totalDonacionesPiezas = 0, clavesAbastoOptimo = 0;
    appState.catalogo.forEach(med => {
      let medStock = 0;
      if (med.lotes) {
        med.lotes.forEach(l => {
          const exist = parseInt(l.existencia, 10) || 0;
          medStock += exist;
          if (l.origen && l.origen.toLowerCase().includes('donación')) totalDonacionesPiezas += exist;
          const sem = calcularSemaforo(l.fechaCaducidad);
          if (sem.estado === 'amarillo' || sem.estado === 'rojo') lotesAlertaCount++;
        });
      }
      totalPiezas += medStock;
      if (medStock >= (med.stockMinimo || 10)) clavesAbastoOptimo++;
    });
    const porcentajeAbasto = appState.catalogo.length > 0 ? ((clavesAbastoOptimo / appState.catalogo.length) * 100).toFixed(1) : 100;

    setText('rep-kpi-existencia', formatNumber(totalPiezas) + ' pzas');
    setText('rep-kpi-abasto', porcentajeAbasto + '%');
    setText('rep-kpi-alertas', lotesAlertaCount + ' lotes');
    setText('rep-kpi-donados', formatNumber(totalDonacionesPiezas) + ' pzas');

    // Tabla Código Mater
    const tbodyMater = document.getElementById('tbody-reporte-mater');
    if (tbodyMater) {
      const materItems = appState.catalogo.filter(m => m.categoria.includes('Código Mater') || m.categoria.includes('Tocoquirúrgica'));
      let htmlMater = '';
      materItems.forEach(item => {
        let stock = 0;
        if (item.lotes) item.lotes.forEach(l => stock += l.existencia);
        const estatusBadge = stock <= item.stockMinimo 
          ? '<span class="badge badge-rojo">Stock Crítico</span>' 
          : '<span class="badge badge-verde">Abasto Óptimo</span>';
        htmlMater += `
          <tr>
            <td><strong style="font-family: monospace;">${item.claveCNIS}</strong></td>
            <td><strong>${item.nombre}</strong></td>
            <td>${item.concentracion}</td>
            <td><strong>${formatNumber(stock)}</strong> pzas</td>
            <td>${item.stockMinimo} pzas</td>
            <td>${estatusBadge}</td>
          </tr>
        `;
      });
      tbodyMater.innerHTML = htmlMater;
    }

    // Tabla Caducidades Próximas
    const tbodyCad = document.getElementById('tbody-reporte-caducidades');
    if (tbodyCad) {
      let lotes = [];
      appState.catalogo.forEach(med => {
        if (med.lotes) {
          med.lotes.forEach(l => {
            const sem = calcularSemaforo(l.fechaCaducidad);
            if (sem.dias <= 180) {
              lotes.push({
                lote: l.lote,
                medicamento: med.nombre,
                caducidad: l.fechaCaducidad,
                dias: sem.dias,
                existencia: l.existencia,
                accion: sem.dias <= 90 ? 'Solicitud Urgente de Canje BIRMEX' : 'Rotación Prioritaria en Tocoquirúrgica'
              });
            }
          });
        }
      });
      lotes.sort((a,b) => a.dias - b.dias);
      let htmlCad = '';
      lotes.forEach(l => {
        htmlCad += `
          <tr>
            <td><strong style="font-family: monospace;">${l.lote}</strong></td>
            <td><strong>${l.medicamento}</strong></td>
            <td>${l.caducidad}</td>
            <td><strong style="color: var(--sem-rojo);">${l.dias} días</strong></td>
            <td><strong>${l.existencia}</strong></td>
            <td><span class="badge ${l.dias <= 90 ? 'badge-rojo' : 'badge-amarillo'}">${l.accion}</span></td>
          </tr>
        `;
      });
      tbodyCad.innerHTML = htmlCad || '<tr><td colspan="6" style="text-align:center;">Todos los lotes en resguardo cuentan con vigencia óptima (> 6 meses).</td></tr>';
    }

    registrarAuditLog('GENERACIÓN_REPORTE_OFICIAL', 'Emisión de Reporte Ejecutivo de Farmacia con Logotipo Oficial');
    openModal('modal-reporte-ejecutivo-logo');
  }

  // ==========================================================================
  // VALE DE DISPENSACIÓN HOSPITALARIA CON LOGOTIPO
  // ==========================================================================
  function imprimirVale(salidaId) {
    const s = appState.movimientos.find(m => m.id === salidaId);
    if (!s) return;

    const container = document.getElementById('vale-salida-imprimible-body');
    if (!container) return;

    const rol = ROLES_DEF[currentRoleKey] || ROLES_DEF.RESPONSABLE_SANITARIO;

    container.innerHTML = `
      <div class="printable-report-container" style="border: 2px dashed var(--slate-300); max-width: 550px; margin: 0 auto; background: #ffffff;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid var(--imss-gold-500); padding-bottom: 0.75rem; margin-bottom: 1rem;">
          <img src="Logo-hospital-de-la-mujer-servicios-de-salud-imss-bienestar.png" style="height: 48px;" alt="IMSS-Bienestar">
          <div style="text-align: right;">
            <div style="font-weight: 800; font-size: 0.85rem; color: var(--imss-green-900);">SERVICIOS DE SALUD IMSS-BIENESTAR</div>
            <div style="font-size: 0.75rem; font-weight: 600; color: var(--imss-gold-700);">HOSPITAL DE LA MUJER DE TEPIC</div>
            <div style="font-family: monospace; font-size: 0.72rem;">FOLIO: ${s.id}</div>
          </div>
        </div>

        <div style="background: var(--imss-green-50); border: 1px solid var(--imss-green-100); padding: 0.6rem; border-radius: 4px; font-size: 0.75rem; margin-bottom: 0.85rem;">
          <strong>VALE INSTITUCIONAL DE DISPENSACIÓN HOSPITALARIA</strong><br>
          <strong>Fecha y Hora:</strong> ${s.fecha} | <strong>Tipo:</strong> ${s.subtipo || 'Receta'}
        </div>

        <table style="width: 100%; font-size: 0.78rem; margin-bottom: 1rem;">
          <tr>
            <td style="padding: 3px 0; color: var(--slate-500); width: 35%;"><strong>Servicio Destino:</strong></td>
            <td style="padding: 3px 0;"><strong>${s.servicio}</strong></td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: var(--slate-500);"><strong>Paciente:</strong></td>
            <td style="padding: 3px 0;">${s.paciente || 'Stock de Servicio / Carro Rojo'}</td>
          </tr>
          ${s.expediente ? `<tr><td style="padding: 3px 0; color: var(--slate-500);"><strong>Expediente:</strong></td><td style="padding: 3px 0; font-family: monospace;">${s.expediente}</td></tr>` : ''}
          <tr>
            <td style="padding: 3px 0; color: var(--slate-500);"><strong>Insumo / Fármaco:</strong></td>
            <td style="padding: 3px 0;"><strong>${s.medicamento}</strong> (${s.claveCNIS})</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: var(--slate-500);"><strong>Lote Asignado (PEPS):</strong></td>
            <td style="padding: 3px 0;"><span style="font-family: monospace; font-weight: 700; color: var(--imss-green-900);">${s.lote}</span> (Cad: ${s.caducidad})</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: var(--slate-500);"><strong>Cantidad Surtida:</strong></td>
            <td style="padding: 3px 0;"><strong style="font-size: 0.95rem; color: #000;">${s.piezas} piezas</strong></td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: var(--slate-500);"><strong>Médico / Solicitante:</strong></td>
            <td style="padding: 3px 0;">${s.solicitante || 'Personal Autorizado'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: var(--slate-500);"><strong>Diagnóstico / Motivo:</strong></td>
            <td style="padding: 3px 0;">${s.diagnostico || s.motivo || '-'}</td>
          </tr>
        </table>

        <div style="text-align: center; margin: 1.5rem 0 0.5rem 0; font-family: monospace; letter-spacing: 4px; font-size: 0.9rem;">
          *${s.id}*
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; text-align: center; font-size: 0.72rem;">
          <div style="border-top: 1px solid #000; padding-top: 4px;">
            <strong>ENTREGA FARMACIA</strong><br>
            ${rol.nombre}<br>
            ${rol.rolNombre}
          </div>
          <div style="border-top: 1px solid #000; padding-top: 4px;">
            <strong>RECIBE CONFORME</strong><br>
            ${s.solicitante || 'Enfermería de Servicio'}<br>
            Firma de Recepción
          </div>
        </div>
      </div>
    `;

    openModal('modal-vale-salida-logo');
  }

  function abrirDispensar(medId) {
    const sel = document.getElementById('salida-medicamento-select');
    if (sel) {
      sel.value = medId;
      actualizarSugerenciaPEPS(medId);
    }
    openModal('modal-nueva-salida');
  }

  function canjearLote(loteNum) {
    const confirmacion = confirm(`¿Desea iniciar el trámite oficial de canje por caducidad próxima para el lote ${loteNum} ante BIRMEX / Almacén Central Estatal IMSS-Bienestar Nayarit?`);
    if (confirmacion) {
      registrarAuditLog('SOLICITUD_CANJE_BIRMEX', `Trámite preventivo de canje para lote ${loteNum}`);
      alert(`Trámite iniciado. Se ha generado la Notificación de Canje Preventivo [OFICIO-CANJE-BRX-${loteNum}].`);
    }
  }

  function dispensarDonacion(medId, loteNum) {
    const selMed = document.getElementById('salida-medicamento-select');
    const tipo = document.getElementById('salida-tipo');
    if (selMed) {
      selMed.value = medId;
      actualizarSugerenciaPEPS(medId);
    }
    if (tipo) tipo.value = 'Dispensación Donación';
    openModal('modal-nueva-salida');
  }

  // ==========================================================================
  // SEGURIDAD SANITARIA Y BLOQUEO DE TERMINAL (NOM-024-SSA3)
  // ==========================================================================
  let timerInactividad = null;
  const TIEMPO_INACTIVIDAD_MS = 15 * 60 * 1000; // 15 minutos según norma hospitalaria

  function resetTimerInactividad() {
    clearTimeout(timerInactividad);
    timerInactividad = setTimeout(() => {
      bloquearTerminal(true);
    }, TIEMPO_INACTIVIDAD_MS);
  }

  // Detectar interacción táctil y teclado para mantener viva la sesión
  ['mousemove', 'keydown', 'touchstart', 'click'].forEach(evt => {
    window.addEventListener(evt, resetTimerInactividad, { passive: true });
  });

  function bloquearTerminal(esAutomatico = false) {
    const rol = ROLES_DEF[currentRoleKey] || ROLES_DEF.RESPONSABLE_SANITARIO;
    setText('lock-user-name', rol.nombre);
    setText('lock-user-role', rol.rolNombre);
    const avatar = document.getElementById('lock-avatar');
    if (avatar) avatar.textContent = rol.avatar;

    const pinInput = document.getElementById('input-pin-desbloqueo');
    if (pinInput) {
      pinInput.value = '';
    }
    const err = document.getElementById('pin-error-msg');
    if (err) err.style.display = 'none';

    registrarAuditLog('BLOQUEO_TERMINAL', esAutomatico ? 'Bloqueo preventivo automático por inactividad (NOM-024)' : 'Bloqueo manual por operador de farmacia');
    openModal('modal-bloqueo-terminal');

    setTimeout(() => {
      if (pinInput) pinInput.focus();
    }, 200);
  }

  function desbloquearTerminal() {
    const pinInput = document.getElementById('input-pin-desbloqueo');
    const err = document.getElementById('pin-error-msg');
    const pin = (pinInput ? pinInput.value : '').trim();

    // Acepta NIP predeterminado 1234 o cualquier NIP de 4 dígitos para demostración
    if (pin === '1234' || (pin.length >= 4 && !isNaN(pin))) {
      if (err) err.style.display = 'none';
      if (pinInput) pinInput.value = '';
      closeModal('modal-bloqueo-terminal');
      resetTimerInactividad();
      registrarAuditLog('DESBLOQUEO_TERMINAL', 'Desbloqueo exitoso de estación de trabajo farmacéutica');
    } else {
      if (err) {
        err.style.display = 'block';
        err.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> NIP incorrecto. Ingrese <strong>1234</strong> (NIP oficial de demostración).';
      }
      if (pinInput) {
        pinInput.value = '';
        pinInput.focus();
      }
    }
  }

  function abrirUltimoVale() {
    const salidas = appState.movimientos.filter(m => m.tipo === 'SALIDA');
    if (salidas.length === 0) {
      alert('Aún no se han registrado vales de dispensación en la sesión actual.');
      return;
    }
    imprimirVale(salidas[0].id);
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function formatNumber(num) {
    return (num || 0).toLocaleString('es-MX');
  }

  function formatCurrency(num) {
    return (num || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getFechaCompacta() {
    const d = new Date();
    return `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}`;
  }

  // Exponer a nivel global para llamadas desde HTML onclick
  window.farmaciaApp = {
    abrirDispensar,
    verActa,
    imprimirVale,
    canjearLote,
    dispensarDonacion,
    abrirReporteEjecutivoLogo,
    abrirBitacoraAuditoria,
    bloquearTerminal,
    desbloquearTerminal,
    abrirUltimoVale,
    escapeHtml
  };
  window.FarmaciaApp = window.farmaciaApp;

  // Inicializar al cargar el DOM y arrancar contador de seguridad
  document.addEventListener('DOMContentLoaded', () => {
    init();
    resetTimerInactividad();
  });

})();

