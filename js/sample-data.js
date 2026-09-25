/**
 * Catálogo Maestro e Información Inicial de Farmacia Hospitalaria
 * Hospital de la Mujer - Tepic, Nayarit
 * SERVICIOS DE SALUD IMSS-BIENESTAR (Programa Federal Nacional)
 */

window.HOSPITAL_DATA = {
  hospitalInfo: {
    nombre: "Hospital de la Mujer de Tepic",
    entidad: "Servicios de Salud IMSS-Bienestar Nayarit",
    jurisdiccion: "Jurisdicción Sanitaria I Tepic",
    direccion: "Av. Insurgentes s/n, Tepic, Nayarit, C.P. 63000",
    responsableFarmacia: "Q.F.B. Mariana Elizabeth Ramos Peña",
    cedulaResponsable: "CED-FARM-8492019",
    licenciaSanitaria: "COFEPRIS-NAY-HOSP-2024-0089",
    codigoUnidad: "CLUES: NTSMP000452"
  },

  // Servicios Hospitalarios donde se despacha medicamento
  servicios: [
    { id: "toco", nombre: "Tocoquirúrgica (Salas de Expulsión y Cesáreas)", color: "#0c4a34" },
    { id: "mater", nombre: "Código Mater / Carro Rojo Obstétrico", color: "#9d2449" },
    { id: "ucin", nombre: "UCIN (Cuidados Intensivos Neonatales)", color: "#0284c7" },
    { id: "triage", nombre: "Triage Obstétrico y Urgencias Ginecológicas", color: "#d97706" },
    { id: "hosp", nombre: "Hospitalización Gineco-Obstétrica", color: "#4f46e5" },
    { id: "c_ext", nombre: "Consulta Externa y Control Prenatal", color: "#16a34a" }
  ],

  // Orígenes / Proveedores de suministro oficiales
  origenesSuministro: [
    { id: "birmex", nombre: "BIRMEX (Compra Consolidada Federal)", tipo: "federal", descripcion: "Operador logístico federal nacional" },
    { id: "almacen_estatal", nombre: "Almacén Central Estatal IMSS-Bienestar Nayarit", tipo: "estatal", descripcion: "Abasto programado vía Rutas de la Salud" },
    { id: "megafarmacia", nombre: "Megafarmacia del Bienestar", tipo: "federal", descripcion: "Suministro complementario de alta prioridad" },
    { id: "traspaso", nombre: "Traspaso Interhospitalario (Red Nayarit)", tipo: "traspaso", descripcion: "Hospital General de Tepic / San Blas" },
    { id: "donacion", nombre: "Donación Institucional Autorizada", tipo: "donacion", descripcion: "Entregas con Acta Oficial COFEPRIS" }
  ],

  // Catálogo de Medicamentos e Insumos Esenciales del Hospital de la Mujer
  catalogo: [
    {
      id: "MED-001",
      claveCNIS: "010.000.2141.00",
      nombre: "Oxitocina",
      concentracion: "5 UI / 1 mL",
      formaFarmaceutica: "Solución Inyectable",
      presentacion: "Caja con 50 ampolletas",
      categoria: "Código Mater / Emergencia Obstétrica",
      redFrio: true,
      tempRango: "2°C a 8°C",
      stockMinimo: 150,
      stockOptimo: 600,
      costoReferencia: 42.50,
      lotes: [
        {
          lote: "OX-26019A",
          fabricante: "Laboratorios Pisa, S.A. de C.V.",
          fechaFabricacion: "2025-08-10",
          fechaCaducidad: "2027-08-30",
          cantidadInicial: 300,
          existencia: 185,
          origen: "BIRMEX (Compra Consolidada Federal)",
          documentoAmparo: "REM-BRX-NAY-88412",
          redFrioVerificada: true,
          tempLlegada: "4.2°C"
        },
        {
          lote: "OX-25114B",
          fabricante: "Laboratorios Pisa, S.A. de C.V.",
          fechaFabricacion: "2025-02-15",
          fechaCaducidad: "2026-11-20", // Próxima a caducar (amarillo/rojo)
          cantidadInicial: 200,
          existencia: 45,
          origen: "Almacén Central Estatal IMSS-Bienestar Nayarit",
          documentoAmparo: "REM-CEAM-2025-4109",
          redFrioVerificada: true,
          tempLlegada: "3.8°C"
        }
      ]
    },
    {
      id: "MED-002",
      claveCNIS: "010.000.4328.00",
      nombre: "Carbetocina",
      concentracion: "100 mcg / 1 mL",
      formaFarmaceutica: "Solución Inyectable",
      presentacion: "Caja con 5 frascos ámpula",
      categoria: "Código Mater / Emergencia Obstétrica",
      redFrio: true,
      tempRango: "2°C a 8°C",
      stockMinimo: 30,
      stockOptimo: 120,
      costoReferencia: 310.00,
      lotes: [
        {
          lote: "CBT-26044",
          fabricante: "Ferring Pharmaceuticals",
          fechaFabricacion: "2025-10-01",
          fechaCaducidad: "2027-10-15",
          cantidadInicial: 80,
          existencia: 62,
          origen: "BIRMEX (Compra Consolidada Federal)",
          documentoAmparo: "REM-BRX-NAY-88412",
          redFrioVerificada: true,
          tempLlegada: "4.5°C"
        }
      ]
    },
    {
      id: "MED-003",
      claveCNIS: "010.000.1242.00",
      nombre: "Sulfato de Magnesio",
      concentracion: "1 g / 10 mL (10%)",
      formaFarmaceutica: "Solución Inyectable",
      presentacion: "Caja con 100 ampolletas de 10 mL",
      categoria: "Código Mater / Emergencia Obstétrica",
      redFrio: false,
      tempRango: "15°C a 25°C",
      stockMinimo: 120,
      stockOptimo: 500,
      costoReferencia: 18.00,
      lotes: [
        {
          lote: "SM-260901",
          fabricante: "Fresenius Kabi México",
          fechaFabricacion: "2025-06-12",
          fechaCaducidad: "2028-06-30",
          cantidadInicial: 250,
          existencia: 210,
          origen: "BIRMEX (Compra Consolidada Federal)",
          documentoAmparo: "REM-BRX-NAY-89004",
          redFrioVerificada: false
        },
        {
          lote: "SM-250312",
          fabricante: "Fresenius Kabi México",
          fechaFabricacion: "2024-04-10",
          fechaCaducidad: "2026-10-31", // Próxima a vencer
          cantidadInicial: 150,
          existencia: 28,
          origen: "Almacén Central Estatal IMSS-Bienestar Nayarit",
          documentoAmparo: "REM-CEAM-2025-3310",
          redFrioVerificada: false
        }
      ]
    },
    {
      id: "MED-004",
      claveCNIS: "010.000.0543.00",
      nombre: "Hidralazina",
      concentracion: "20 mg / 1 mL",
      formaFarmaceutica: "Solución Inyectable",
      presentacion: "Caja con 5 ampolletas",
      categoria: "Código Mater / Emergencia Obstétrica",
      redFrio: false,
      tempRango: "15°C a 25°C",
      stockMinimo: 60,
      stockOptimo: 250,
      costoReferencia: 45.00,
      lotes: [
        {
          lote: "HDZ-2604B",
          fabricante: "Laboratorios Cryopharma",
          fechaFabricacion: "2025-07-20",
          fechaCaducidad: "2027-09-30",
          cantidadInicial: 180,
          existencia: 142,
          origen: "BIRMEX (Compra Consolidada Federal)",
          documentoAmparo: "REM-BRX-NAY-89004",
          redFrioVerificada: false
        }
      ]
    },
    {
      id: "MED-005",
      claveCNIS: "010.000.0571.00",
      nombre: "Nifedipino",
      concentracion: "10 mg",
      formaFarmaceutica: "Cápsula",
      presentacion: "Caja con 20 cápsulas",
      categoria: "Gineco-Obstetricia y Hospitalización",
      redFrio: false,
      tempRango: "15°C a 25°C",
      stockMinimo: 80,
      stockOptimo: 300,
      costoReferencia: 35.00,
      lotes: [
        {
          lote: "NIF-25088",
          fabricante: "Laboratorios Alpharma",
          fechaFabricacion: "2025-01-14",
          fechaCaducidad: "2027-05-15",
          cantidadInicial: 200,
          existencia: 164,
          origen: "BIRMEX (Compra Consolidada Federal)",
          documentoAmparo: "REM-BRX-NAY-87510",
          redFrioVerificada: false
        }
      ]
    },
    {
      id: "MED-006",
      claveCNIS: "010.000.1233.00",
      nombre: "Gluconato de Calcio",
      concentracion: "10% (1 g / 10 mL)",
      formaFarmaceutica: "Solución Inyectable",
      presentacion: "Caja con 10 ampolletas",
      categoria: "Código Mater / Emergencia Obstétrica",
      redFrio: false,
      tempRango: "15°C a 25°C",
      stockMinimo: 40,
      stockOptimo: 150,
      costoReferencia: 24.50,
      lotes: [
        {
          lote: "GC-26011",
          fabricante: "Laboratorios Collins",
          fechaFabricacion: "2025-05-02",
          fechaCaducidad: "2028-04-30",
          cantidadInicial: 100,
          existencia: 88,
          origen: "BIRMEX (Compra Consolidada Federal)",
          documentoAmparo: "REM-BRX-NAY-88412",
          redFrioVerificada: false
        }
      ]
    },
    {
      id: "MED-007",
      claveCNIS: "010.000.2104.00",
      nombre: "Betametasona (Maduración Pulmonar Fetal)",
      concentracion: "4 mg / 1 mL",
      formaFarmaceutica: "Suspensión Inyectable",
      presentacion: "Caja con 1 ampolleta de 1 mL",
      categoria: "Triage y Urgencias Ginecológicas",
      redFrio: false,
      tempRango: "15°C a 25°C",
      stockMinimo: 50,
      stockOptimo: 200,
      costoReferencia: 68.00,
      lotes: [
        {
          lote: "BTM-2607A",
          fabricante: "Schering-Plough / Organon",
          fechaFabricacion: "2025-03-10",
          fechaCaducidad: "2027-11-30",
          cantidadInicial: 120,
          existencia: 94,
          origen: "BIRMEX (Compra Consolidada Federal)",
          documentoAmparo: "REM-BRX-NAY-88412",
          redFrioVerificada: false
        }
      ]
    },
    {
      id: "MED-008",
      claveCNIS: "010.000.1972.00",
      nombre: "Fitomenadiona (Vitamina K1 Neonatal)",
      concentracion: "1 mg / 0.5 mL",
      formaFarmaceutica: "Solución Inyectable",
      presentacion: "Caja con 5 ampolletas",
      categoria: "UCIN y Neonatología",
      redFrio: true,
      tempRango: "2°C a 8°C (Protegida de luz)",
      stockMinimo: 100,
      stockOptimo: 400,
      costoReferencia: 52.00,
      lotes: [
        {
          lote: "VITK-26033",
          fabricante: "Laboratorios Roche",
          fechaFabricacion: "2025-08-01",
          fechaCaducidad: "2027-12-15",
          cantidadInicial: 250,
          existencia: 198,
          origen: "BIRMEX (Compra Consolidada Federal)",
          documentoAmparo: "REM-BRX-NAY-89004",
          redFrioVerificada: true,
          tempLlegada: "4.0°C"
        }
      ]
    },
    {
      id: "MED-009",
      claveCNIS: "010.000.1932.00",
      nombre: "Ampicilina",
      concentracion: "1 g",
      formaFarmaceutica: "Solución Inyectable (Polvo para reconstituir)",
      presentacion: "Frasco ámpula con diluyente",
      categoria: "Tocoquirúrgica y Quirófanos",
      redFrio: false,
      tempRango: "15°C a 25°C",
      stockMinimo: 150,
      stockOptimo: 600,
      costoReferencia: 22.00,
      lotes: [
        {
          lote: "AMP-2512A",
          fabricante: "Laboratorios Pisa",
          fechaFabricacion: "2025-04-18",
          fechaCaducidad: "2027-08-20",
          cantidadInicial: 350,
          existencia: 245,
          origen: "Almacén Central Estatal IMSS-Bienestar Nayarit",
          documentoAmparo: "REM-CEAM-2025-4512",
          redFrioVerificada: false
        }
      ]
    },
    {
      id: "MED-010",
      claveCNIS: "010.000.1936.00",
      nombre: "Ceftriaxona",
      concentracion: "1 g",
      formaFarmaceutica: "Solución Inyectable",
      presentacion: "Frasco ámpula con diluyente 10 mL",
      categoria: "Tocoquirúrgica y Quirófanos",
      redFrio: false,
      tempRango: "15°C a 25°C",
      stockMinimo: 150,
      stockOptimo: 500,
      costoReferencia: 29.50,
      lotes: [
        {
          lote: "CEF-26012",
          fabricante: "Laboratorios Kener",
          fechaFabricacion: "2025-09-05",
          fechaCaducidad: "2028-02-28",
          cantidadInicial: 300,
          existencia: 215,
          origen: "BIRMEX (Compra Consolidada Federal)",
          documentoAmparo: "REM-BRX-NAY-89004",
          redFrioVerificada: false
        }
      ]
    },
    {
      id: "MED-011",
      claveCNIS: "010.000.3601.00",
      nombre: "Solución Fisiológica 0.9%",
      concentracion: "Cloruro de Sodio 0.9% / 1000 mL",
      formaFarmaceutica: "Solución para Infusión",
      presentacion: "Bolsa de PVC con 1000 mL",
      categoria: "Soluciones y Electrólitos",
      redFrio: false,
      tempRango: "15°C a 30°C",
      stockMinimo: 300,
      stockOptimo: 1200,
      costoReferencia: 28.00,
      lotes: [
        {
          lote: "FIS-26055",
          fabricante: "Baxter México",
          fechaFabricacion: "2025-05-10",
          fechaCaducidad: "2028-05-15",
          cantidadInicial: 600,
          existencia: 420,
          origen: "BIRMEX (Compra Consolidada Federal)",
          documentoAmparo: "REM-BRX-NAY-87510",
          redFrioVerificada: false
        }
      ]
    },
    {
      id: "MED-012",
      claveCNIS: "010.000.3608.00",
      nombre: "Solución Hartmann",
      concentracion: "Electrólitos Balanceados / 1000 mL",
      formaFarmaceutica: "Solución para Infusión",
      presentacion: "Bolsa con 1000 mL",
      categoria: "Soluciones y Electrólitos",
      redFrio: false,
      tempRango: "15°C a 30°C",
      stockMinimo: 250,
      stockOptimo: 1000,
      costoReferencia: 31.00,
      lotes: [
        {
          lote: "HRT-26088",
          fabricante: "Laboratorios Pisa",
          fechaFabricacion: "2025-07-01",
          fechaCaducidad: "2028-07-15",
          cantidadInicial: 500,
          existencia: 380,
          origen: "BIRMEX (Compra Consolidada Federal)",
          documentoAmparo: "REM-BRX-NAY-88412",
          redFrioVerificada: false
        }
      ]
    },
    {
      id: "MED-013",
      claveCNIS: "010.000.4190.00",
      nombre: "Ácido Tranexámico",
      concentracion: "500 mg / 5 mL",
      formaFarmaceutica: "Solución Inyectable",
      presentacion: "Caja con 5 ampolletas",
      categoria: "Código Mater / Emergencia Obstétrica",
      redFrio: false,
      tempRango: "15°C a 25°C",
      stockMinimo: 40,
      stockOptimo: 180,
      costoReferencia: 145.00,
      lotes: [
        {
          lote: "TXA-26010",
          fabricante: "Laboratorios Cryopharma",
          fechaFabricacion: "2025-06-20",
          fechaCaducidad: "2027-12-30",
          cantidadInicial: 100,
          existencia: 76,
          origen: "BIRMEX (Compra Consolidada Federal)",
          documentoAmparo: "REM-BRX-NAY-89004",
          redFrioVerificada: false
        }
      ]
    },
    // MEDICAMENTO RECIBIDO POR DONACIÓN (APARTADO DE DONACIONES)
    {
      id: "MED-DON-014",
      claveCNIS: "010.000.2145.00",
      nombre: "Hierro Dextrano (Donación)",
      concentracion: "100 mg / 2 mL",
      formaFarmaceutica: "Solución Inyectable",
      presentacion: "Caja con 3 ampolletas",
      categoria: "Gineco-Obstetricia y Hospitalización",
      redFrio: false,
      tempRango: "15°C a 25°C",
      stockMinimo: 30,
      stockOptimo: 100,
      costoReferencia: 95.00,
      esDonacion: true,
      lotes: [
        {
          lote: "DON-HD-8901",
          fabricante: "Laboratorios Chinoin",
          fechaFabricacion: "2025-04-10",
          fechaCaducidad: "2027-10-31",
          cantidadInicial: 60,
          existencia: 42,
          origen: "Donación Institucional Autorizada",
          documentoAmparo: "ACTA-DON-2026-001",
          donante: "Fundación Mujeres Unidas por Nayarit, A.C.",
          folioActa: "ACTA-DON-2026-001",
          redFrioVerificada: false
        }
      ]
    },
    {
      id: "MED-DON-015",
      claveCNIS: "010.000.2604.00",
      nombre: "Ácido Fólico",
      concentracion: "5 mg",
      formaFarmaceutica: "Tableta",
      presentacion: "Frasco con 90 tabletas",
      categoria: "Consulta Externa y Control Prenatal",
      redFrio: false,
      tempRango: "15°C a 25°C",
      stockMinimo: 100,
      stockOptimo: 400,
      costoReferencia: 28.00,
      esDonacion: true,
      lotes: [
        {
          lote: "DON-AF-2601",
          fabricante: "Laboratorios Serral",
          fechaFabricacion: "2025-08-01",
          fechaCaducidad: "2027-08-30",
          cantidadInicial: 200,
          existencia: 165,
          origen: "Donación Institucional Autorizada",
          documentoAmparo: "ACTA-DON-2026-002",
          donante: "Voluntariado Estatal de Salud Nayarit",
          folioActa: "ACTA-DON-2026-002",
          redFrioVerificada: false
        }
      ]
    }
  ],

  // Registro de Actas de Donación Formales
  donaciones: [
    {
      folioActa: "ACTA-DON-2026-001",
      fecha: "2026-08-15",
      donante: {
        tipo: "Asociación Civil / ONG",
        nombre: "Fundación Mujeres Unidas por Nayarit, A.C.",
        rfc: "FMU1409228A1",
        representante: "Lic. Carmen Sofía Estrada Gómez",
        telefono: "311-214-5589",
        domicilio: "Calle Hidalgo #142, Col. Centro, Tepic, Nayarit"
      },
      insumos: [
        {
          claveCNIS: "010.000.2145.00",
          medicamento: "Hierro Dextrano 100 mg / 2 mL",
          lote: "DON-HD-8901",
          caducidad: "2027-10-31",
          cantidad: 60,
          valorEstimado: 5700.00,
          cumpleCofepris: true
        }
      ],
      responsableReceptor: "Q.F.B. Mariana Elizabeth Ramos Peña (Farmacia)",
      testigo1: "Dr. Jorge Arturo Valdez - Subdirector Médico",
      testigo2: "C.P. Rosa Elena Miramontes - Administradora de Unidad",
      motivo: "Apoyo a pacientes obstétricas con anemia gestacional severa de escasos recursos en la zona serrana de Nayarit.",
      estatus: "Aprobada e Incorporada a Inventario",
      cartaNoComercializacion: true
    },
    {
      folioActa: "ACTA-DON-2026-002",
      fecha: "2026-09-02",
      donante: {
        tipo: "Voluntariado Institucional",
        nombre: "Voluntariado Estatal de Salud Nayarit",
        rfc: "VES990314NA2",
        representante: "Dra. Beatriz Lorena Santos",
        telefono: "311-210-9011",
        domicilio: "Calzada del Panteón #45, Tepic, Nayarit"
      },
      insumos: [
        {
          claveCNIS: "010.000.2604.00",
          medicamento: "Ácido Fólico 5 mg tabletas",
          lote: "DON-AF-2601",
          caducidad: "2027-08-30",
          cantidad: 200,
          valorEstimado: 5600.00,
          cumpleCofepris: true
        }
      ],
      responsableReceptor: "Q.F.B. Mariana Elizabeth Ramos Peña (Farmacia)",
      testigo1: "Dra. Gabriela Solís Mondragón - Jefa de Ginecología",
      testigo2: "C.P. Rosa Elena Miramontes - Administradora de Unidad",
      motivo: "Campañas de control prenatal y prevención de defectos de tubo neural en adolescentes.",
      estatus: "Aprobada e Incorporada a Inventario",
      cartaNoComercializacion: true
    }
  ],

  // Historial de Movimientos de Entradas y Salidas (Últimos días/semanas para alimentar gráficas)
  movimientos: [
    // Entradas recientes
    {
      id: "MOV-ENT-101",
      tipo: "ENTRADA",
      fecha: "2026-09-18 09:30",
      fechaDia: "2026-09-18",
      semana: 37,
      mes: "2026-09",
      origen: "BIRMEX (Compra Consolidada Federal)",
      documento: "REM-BRX-NAY-89004",
      claveCNIS: "010.000.2141.00",
      medicamento: "Oxitocina 5 UI / 1 mL",
      lote: "OX-26019A",
      caducidad: "2027-08-30",
      piezas: 300,
      costoUnitario: 42.50,
      costoTotal: 12750.00,
      servicio: "Almacén de Farmacia",
      observaciones: "Red de frío verificada con data-logger a 4.2°C al momento de descarga en andén."
    },
    {
      id: "MOV-ENT-102",
      tipo: "ENTRADA",
      fecha: "2026-09-18 10:15",
      fechaDia: "2026-09-18",
      semana: 37,
      mes: "2026-09",
      origen: "BIRMEX (Compra Consolidada Federal)",
      documento: "REM-BRX-NAY-89004",
      claveCNIS: "010.000.1242.00",
      medicamento: "Sulfato de Magnesio 1 g / 10 mL",
      lote: "SM-260901",
      caducidad: "2028-06-30",
      piezas: 250,
      costoUnitario: 18.00,
      costoTotal: 4500.00,
      servicio: "Almacén de Farmacia",
      observaciones: "Empaque íntegro sin merma de ámpulas."
    },
    {
      id: "MOV-ENT-103",
      tipo: "ENTRADA",
      fecha: "2026-09-20 11:00",
      fechaDia: "2026-09-20",
      semana: 38,
      mes: "2026-09",
      origen: "Almacén Central Estatal IMSS-Bienestar Nayarit",
      documento: "REM-CEAM-2025-4512",
      claveCNIS: "010.000.1932.00",
      medicamento: "Ampicilina 1 g IV",
      lote: "AMP-2512A",
      caducidad: "2027-08-20",
      piezas: 350,
      costoUnitario: 22.00,
      costoTotal: 7700.00,
      servicio: "Almacén de Farmacia",
      observaciones: "Abasto ordinario Ruta Sanitaria Tepic Norte."
    },
    {
      id: "MOV-ENT-104",
      tipo: "ENTRADA",
      fecha: "2026-09-21 14:00",
      fechaDia: "2026-09-21",
      semana: 38,
      mes: "2026-09",
      origen: "BIRMEX (Compra Consolidada Federal)",
      documento: "REM-BRX-NAY-89004",
      claveCNIS: "010.000.3601.00",
      medicamento: "Solución Fisiológica 0.9% 1000 mL",
      lote: "FIS-26055",
      caducidad: "2028-05-15",
      piezas: 600,
      costoUnitario: 28.00,
      costoTotal: 16800.00,
      servicio: "Almacén de Farmacia",
      observaciones: "Reposición de stock para tocoquirófanos."
    },
    // Salidas recientes (Despachos y Recetas)
    {
      id: "MOV-SAL-201",
      tipo: "SALIDA",
      subtipo: "Vale Colectivo Hospitalario",
      fecha: "2026-09-22 08:30",
      fechaDia: "2026-09-22",
      semana: 38,
      mes: "2026-09",
      servicio: "Tocoquirúrgica (Salas de Expulsión y Cesáreas)",
      solicitante: "Enf. Esp. Laura Karina Mendoza (Jefa de Piso)",
      claveCNIS: "010.000.2141.00",
      medicamento: "Oxitocina 5 UI / 1 mL",
      lote: "OX-25114B", // Algoritmo PEPS: Sale primero el lote más próximo a caducar
      caducidad: "2026-11-20",
      piezas: 40,
      costoUnitario: 42.50,
      costoTotal: 1700.00,
      motivo: "Surtimiento de 8 partos y 4 cesáreas programadas turno matutino."
    },
    {
      id: "MOV-SAL-202",
      tipo: "SALIDA",
      subtipo: "Código Mater",
      fecha: "2026-09-22 11:45",
      fechaDia: "2026-09-22",
      semana: 38,
      mes: "2026-09",
      servicio: "Código Mater / Carro Rojo Obstétrico",
      solicitante: "Dr. Carlos Eduardo Meza - Médico Gineco-Obstetra",
      paciente: "María Guadalupe Hernández Peña",
      curp: "HEPM980512MNYRRN02",
      expediente: "EXP-2026-9812",
      diagnostico: "Preeclampsia con criterios de severidad + Crisis hipertensiva",
      claveCNIS: "010.000.1242.00",
      medicamento: "Sulfato de Magnesio 1 g / 10 mL",
      lote: "SM-250312", // PEPS
      caducidad: "2026-10-31",
      piezas: 12,
      costoUnitario: 18.00,
      costoTotal: 216.00,
      motivo: "Impregnación y mantenimiento Esquema Zuspan Código Mater."
    },
    {
      id: "MOV-SAL-203",
      tipo: "SALIDA",
      subtipo: "Código Mater",
      fecha: "2026-09-22 12:10",
      fechaDia: "2026-09-22",
      semana: 38,
      mes: "2026-09",
      servicio: "Código Mater / Carro Rojo Obstétrico",
      solicitante: "Dr. Carlos Eduardo Meza - Médico Gineco-Obstetra",
      paciente: "María Guadalupe Hernández Peña",
      curp: "HEPM980512MNYRRN02",
      expediente: "EXP-2026-9812",
      diagnostico: "Crisis hipertensiva del embarazo",
      claveCNIS: "010.000.0543.00",
      medicamento: "Hidralazina 20 mg / 1 mL",
      lote: "HDZ-2604B",
      caducidad: "2027-09-30",
      piezas: 4,
      costoUnitario: 45.00,
      costoTotal: 180.00,
      motivo: "Bolo IV de rescate hemodinámico."
    },
    {
      id: "MOV-SAL-204",
      tipo: "SALIDA",
      subtipo: "Receta Individual",
      fecha: "2026-09-23 09:10",
      fechaDia: "2026-09-23",
      semana: 38,
      mes: "2026-09",
      servicio: "UCIN (Cuidados Intensivos Neonatales)",
      solicitante: "Dra. Patricia Alatorre - Pediatra Neonatóloga",
      paciente: "Recién Nacido de María Guadalupe Hernández",
      curp: "RNHP260922MNYRRN00",
      expediente: "EXP-2026-9813",
      diagnostico: "Prematurez tardía 35 SDG + Profilaxis neonatal",
      claveCNIS: "010.000.1972.00",
      medicamento: "Fitomenadiona (Vitamina K1) 1 mg / 0.5 mL",
      lote: "VITK-26033",
      caducidad: "2027-12-15",
      piezas: 2,
      costoUnitario: 52.00,
      costoTotal: 104.00,
      motivo: "Profilaxis de enfermedad hemorrágica del recién nacido."
    },
    {
      id: "MOV-SAL-205",
      tipo: "SALIDA",
      subtipo: "Dispensación Donación",
      fecha: "2026-09-23 11:20",
      fechaDia: "2026-09-23",
      semana: 38,
      mes: "2026-09",
      servicio: "Hospitalización Gineco-Obstétrica",
      solicitante: "Dr. Víctor Manuel Orozco - Médico Tratante",
      paciente: "Elena Vázquez Chimal",
      curp: "VACE021103MNYRRS05",
      expediente: "EXP-2026-9740",
      diagnostico: "Puerperio quirúrgico + Anemia microcítica grado III",
      claveCNIS: "010.000.2145.00",
      medicamento: "Hierro Dextrano 100 mg / 2 mL (Donación)",
      lote: "DON-HD-8901",
      caducidad: "2027-10-31",
      piezas: 3,
      costoUnitario: 95.00,
      costoTotal: 285.00,
      esDonacion: true,
      folioActa: "ACTA-DON-2026-001",
      motivo: "Dispensación gratuita a paciente de escasos recursos proveniente de Del Nayar."
    },
    {
      id: "MOV-SAL-206",
      tipo: "SALIDA",
      subtipo: "Vale Colectivo Hospitalario",
      fecha: "2026-09-24 10:00",
      fechaDia: "2026-09-24",
      semana: 38,
      mes: "2026-09",
      servicio: "Tocoquirúrgica (Salas de Expulsión y Cesáreas)",
      solicitante: "Enf. Sandra Luz Navarro",
      claveCNIS: "010.000.1936.00",
      medicamento: "Ceftriaxona 1 g IV",
      lote: "CEF-26012",
      caducidad: "2028-02-28",
      piezas: 35,
      costoUnitario: 29.50,
      costoTotal: 1032.50,
      motivo: "Profilaxis antibiótica perioperatoria cesáreas turno especial."
    },
    {
      id: "MOV-SAL-207",
      tipo: "SALIDA",
      subtipo: "Receta Individual",
      fecha: "2026-09-24 12:40",
      fechaDia: "2026-09-24",
      semana: 38,
      mes: "2026-09",
      servicio: "Consulta Externa y Control Prenatal",
      solicitante: "Dra. Sofía Rentería - Consulta Externa",
      paciente: "Brenda Lizbeth Ramos C.",
      curp: "RACB010419MNYRMD08",
      expediente: "EXP-2026-8921",
      diagnostico: "Embarazo 12 SDG normoevolutivo",
      claveCNIS: "010.000.2604.00",
      medicamento: "Ácido Fólico 5 mg tabletas (Donación)",
      lote: "DON-AF-2601",
      caducidad: "2027-08-30",
      piezas: 1, // 1 frasco de 90 tabs
      costoUnitario: 28.00,
      costoTotal: 28.00,
      esDonacion: true,
      folioActa: "ACTA-DON-2026-002",
      motivo: "Dispensación de programa preventivo prenatal voluntariado."
    }
  ],

  // Datos cronológicos históricos consolidados para gráficas periódicas (diario, semanal, mensual)
  metricasCronologicas: {
    diario: [
      { label: "18 Sep", entradas: 550, salidas: 85, recetas: 42, donaciones: 0 },
      { label: "19 Sep", entradas: 0, salidas: 92, recetas: 48, donaciones: 0 },
      { label: "20 Sep", entradas: 350, salidas: 110, recetas: 55, donaciones: 0 },
      { label: "21 Sep", entradas: 600, salidas: 125, recetas: 61, donaciones: 0 },
      { label: "22 Sep", entradas: 0, salidas: 142, recetas: 70, donaciones: 3 },
      { label: "23 Sep", entradas: 0, salidas: 118, recetas: 58, donaciones: 5 },
      { label: "24 Sep", entradas: 120, salidas: 134, recetas: 66, donaciones: 1 }
    ],
    semanal: [
      { label: "Semana 33", entradas: 1400, salidas: 620, recetas: 310, costo: 38200 },
      { label: "Semana 34", entradas: 850, salidas: 690, recetas: 345, costo: 27400 },
      { label: "Semana 35", entradas: 2100, salidas: 740, recetas: 370, costo: 54100 },
      { label: "Semana 36", entradas: 600, salidas: 710, recetas: 355, costo: 22800 },
      { label: "Semana 37", entradas: 1950, salidas: 780, recetas: 390, costo: 49300 },
      { label: "Semana 38", entradas: 1620, salidas: 806, recetas: 403, costo: 41800 }
    ],
    mensual: [
      { label: "Abril 2026", entradas: 4800, salidas: 2850, recetas: 1420, donaciones: 120 },
      { label: "Mayo 2026", entradas: 5600, salidas: 3120, recetas: 1560, donaciones: 180 },
      { label: "Junio 2026", entradas: 5100, salidas: 2980, recetas: 1490, donaciones: 90 },
      { label: "Julio 2026", entradas: 6300, salidas: 3340, recetas: 1670, donaciones: 260 },
      { label: "Agosto 2026", entradas: 5900, salidas: 3210, recetas: 1605, donaciones: 140 },
      { label: "Septiembre 2026", entradas: 6420, salidas: 3450, recetas: 1725, donaciones: 310 }
    ]
  },

  // Consumo por servicio para gráficas de barras
  consumoPorServicio: [
    { servicio: "Tocoquirúrgica (Expulsión y Cesáreas)", piezas: 1240, porcentaje: 36.0, color: "#0c4a34" },
    { servicio: "Código Mater / Emergencia Obstétrica", piezas: 680, porcentaje: 19.7, color: "#9d2449" },
    { servicio: "UCIN (Neonatología)", piezas: 520, porcentaje: 15.1, color: "#0284c7" },
    { servicio: "Hospitalización Gineco-Obstétrica", piezas: 450, porcentaje: 13.0, color: "#4f46e5" },
    { servicio: "Triage Obstétrico y Urgencias", piezas: 340, porcentaje: 9.9, color: "#d97706" },
    { servicio: "Consulta Externa Prenatal", piezas: 220, porcentaje: 6.3, color: "#16a34a" }
  ]
};
