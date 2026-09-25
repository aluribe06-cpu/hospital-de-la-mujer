-- ============================================================================
-- BASE DE DATOS DE FARMACIA HOSPITALARIA
-- HOSPITAL DE LA MUJER DE TEPIC, NAYARIT
-- SERVICIOS DE SALUD IMSS-BIENESTAR (PROGRAMA FEDERAL NACIONAL)
-- Compatible con PostgreSQL, Supabase, Google Cloud SQL y MySQL 8+
-- ============================================================================

-- 1. TABLA DE USUARIOS Y ROLES (RBAC)
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(50) PRIMARY KEY,
    curp VARCHAR(18) UNIQUE NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'AUXILIAR_FARMACIA'
        CHECK (rol IN ('RESPONSABLE_SANITARIO_QFB', 'AUXILIAR_FARMACIA', 'MEDICO_PRESCRIPTOR', 'ENFERMERA_JEFA_PISO', 'AUDITOR_OIC_ADMIN')),
    cedula_profesional VARCHAR(30),
    departamento VARCHAR(100) DEFAULT 'Farmacia Hospitalaria',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_acceso TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE SERVICIOS HOSPITALARIOS (DESTINOS DE DISPENSACIÓN)
CREATE TABLE IF NOT EXISTS servicios_hospitalarios (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    codigo_area VARCHAR(20) UNIQUE NOT NULL,
    piso_ubicacion VARCHAR(50) NOT NULL,
    responsable_jefatura VARCHAR(150),
    es_urgencia BOOLEAN DEFAULT FALSE,
    color_identificador VARCHAR(10) DEFAULT '#0c4a34',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CATÁLOGO MAESTRO DE MEDICAMENTOS (COMPENDIO NACIONAL CNIS)
CREATE TABLE IF NOT EXISTS catalogo_medicamentos (
    id VARCHAR(50) PRIMARY KEY,
    clave_cnis VARCHAR(25) UNIQUE NOT NULL,
    nombre_generico VARCHAR(150) NOT NULL,
    concentracion VARCHAR(100) NOT NULL,
    forma_farmaceutica VARCHAR(100) NOT NULL,
    presentacion VARCHAR(150) NOT NULL,
    categoria_hospitalaria VARCHAR(100) NOT NULL,
    red_frio BOOLEAN NOT NULL DEFAULT FALSE,
    temp_min_c NUMERIC(4, 1) DEFAULT 15.0,
    temp_max_c NUMERIC(4, 1) DEFAULT 25.0,
    stock_minimo INTEGER NOT NULL DEFAULT 50 CHECK (stock_minimo >= 0),
    stock_optimo INTEGER NOT NULL DEFAULT 200 CHECK (stock_optimo >= stock_minimo),
    costo_referencia NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    es_donacion BOOLEAN NOT NULL DEFAULT FALSE,
    codigo_barras VARCHAR(50),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA DE LOTIFICACIÓN Y CONTROL DE CADUCIDADES (PEPS / FEFO)
CREATE TABLE IF NOT EXISTS lotes_inventario (
    id VARCHAR(50) PRIMARY KEY,
    medicamento_id VARCHAR(50) NOT NULL,
    numero_lote VARCHAR(50) NOT NULL,
    fabricante VARCHAR(150) DEFAULT 'Laboratorio Oficial',
    fecha_fabricacion DATE,
    fecha_caducidad DATE NOT NULL,
    cantidad_inicial INTEGER NOT NULL CHECK (cantidad_inicial > 0),
    existencia_actual INTEGER NOT NULL CHECK (existencia_actual >= 0),
    origen VARCHAR(80) NOT NULL DEFAULT 'BIRMEX_COMPRA_CONSOLIDADA',
    documento_amparo VARCHAR(100) NOT NULL,
    bloqueado_cuarentena BOOLEAN NOT NULL DEFAULT FALSE,
    motivo_bloqueo TEXT,
    temperatura_recepcion VARCHAR(30),
    donante_nombre VARCHAR(150),
    folio_acta_donacion VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lote_med FOREIGN KEY (medicamento_id) REFERENCES catalogo_medicamentos(id),
    CONSTRAINT uq_med_lote UNIQUE (medicamento_id, numero_lote)
);

-- 5. APARTADO DE DONACIONES: ACTAS OFICIALES DE ENTREGA-RECEPCIÓN (COFEPRIS)
CREATE TABLE IF NOT EXISTS actas_donacion (
    id VARCHAR(50) PRIMARY KEY,
    folio_acta VARCHAR(50) UNIQUE NOT NULL,
    fecha_recepcion DATE NOT NULL,
    donante_tipo VARCHAR(80) NOT NULL,
    donante_nombre VARCHAR(200) NOT NULL,
    donante_rfc VARCHAR(20) NOT NULL,
    donante_representante VARCHAR(150),
    donante_telefono VARCHAR(30),
    donante_domicilio TEXT NOT NULL,
    responsable_receptor_id VARCHAR(50),
    testigo_medico VARCHAR(150) NOT NULL,
    testigo_administrativo VARCHAR(150) NOT NULL,
    motivo_justificacion TEXT NOT NULL,
    cumple_cofepris BOOLEAN NOT NULL DEFAULT TRUE,
    carta_no_comercializacion BOOLEAN NOT NULL DEFAULT TRUE,
    archivo_pdf_url TEXT,
    estatus_acta VARCHAR(50) DEFAULT 'APROBADA_E_INCORPORADA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_acta_resp FOREIGN KEY (responsable_receptor_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS donaciones_detalles (
    id VARCHAR(50) PRIMARY KEY,
    acta_id VARCHAR(50) NOT NULL,
    medicamento_id VARCHAR(50) NOT NULL,
    numero_lote VARCHAR(50) NOT NULL,
    fecha_caducidad DATE NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    valor_estimado NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_det_acta FOREIGN KEY (acta_id) REFERENCES actas_donacion(id),
    CONSTRAINT fk_det_med FOREIGN KEY (medicamento_id) REFERENCES catalogo_medicamentos(id)
);

-- 6. KARDEX DE MOVIMIENTOS HISTÓRICOS (ENTRADAS, SALIDAS Y DISPENSACIÓN)
CREATE TABLE IF NOT EXISTS movimientos_kardex (
    id VARCHAR(50) PRIMARY KEY,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE', 'MERMA', 'CANJE')),
    subtipo VARCHAR(80) NOT NULL,
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    medicamento_id VARCHAR(50) NOT NULL,
    lote_id VARCHAR(50) NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    costo_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    costo_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    origen_proveedor VARCHAR(150),
    documento_referencia VARCHAR(100),
    servicio_destino_id VARCHAR(50),
    solicitante_medico VARCHAR(150),
    cedula_profesional VARCHAR(30),
    paciente_nombre VARCHAR(150),
    paciente_curp VARCHAR(18),
    expediente_hospitalario VARCHAR(50),
    diagnostico_cie10 VARCHAR(255),
    observaciones TEXT,
    usuario_registro_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mov_med FOREIGN KEY (medicamento_id) REFERENCES catalogo_medicamentos(id),
    CONSTRAINT fk_mov_lote FOREIGN KEY (lote_id) REFERENCES lotes_inventario(id),
    CONSTRAINT fk_mov_serv FOREIGN KEY (servicio_destino_id) REFERENCES servicios_hospitalarios(id),
    CONSTRAINT fk_mov_usr FOREIGN KEY (usuario_registro_id) REFERENCES usuarios(id)
);

-- 7. BITÁCORA INMUTABLE DE AUDITORÍA (AUDIT TRAIL - NOM-024-SSA3 / OIC)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    usuario_id VARCHAR(50),
    accion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(80) NOT NULL,
    registro_id VARCHAR(100) NOT NULL,
    ip_origen VARCHAR(45),
    user_agent TEXT,
    valores_anteriores TEXT,
    valores_nuevos TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_usr FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- 8. ÍNDICES DE RENDIMIENTO PARA ALTA CONCURRENCIA
CREATE INDEX IF NOT EXISTS idx_lotes_caducidad ON lotes_inventario (medicamento_id, fecha_caducidad);
CREATE INDEX IF NOT EXISTS idx_mov_fecha ON movimientos_kardex (fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_mov_serv ON movimientos_kardex (servicio_destino_id);
CREATE INDEX IF NOT EXISTS idx_cat_cnis ON catalogo_medicamentos (clave_cnis);
CREATE INDEX IF NOT EXISTS idx_audit_fecha ON audit_logs (created_at);
