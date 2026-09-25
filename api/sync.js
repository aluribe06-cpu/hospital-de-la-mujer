const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!dbUrl) {
    return res.status(200).json({ status: 'fallback_local', message: 'Sin conexión de base de datos remota.' });
  }

  const sql = neon(dbUrl);

  try {
    if (req.method === 'GET') {
      // 1. Verificar si existen medicamentos en catálogo; si no, inicializar datos semilla
      const countMed = await sql`SELECT COUNT(*) FROM catalogo_medicamentos;`;
      if (parseInt(countMed[0].count, 10) === 0) {
        // Cargar catálogo inicial básico del Código Mater
        await sql`
          INSERT INTO catalogo_medicamentos (id, clave_cnis, nombre_generico, concentracion, forma_farmaceutica, presentacion, categoria_hospitalaria, red_frio, temp_min_c, temp_max_c, stock_minimo, stock_optimo, costo_referencia)
          VALUES 
            ('MED-001', '010.000.2141.00', 'Oxitocina', '5 UI / 1 mL', 'Solución Inyectable', 'Caja con 50 ampolletas', 'Código Mater / Emergencia Obstétrica', true, 2.0, 8.0, 150, 600, 14.50),
            ('MED-002', '010.000.1242.00', 'Sulfato de Magnesio', '1 g / 10 mL (10%)', 'Solución Inyectable', 'Caja con 100 ampolletas', 'Código Mater / Emergencia Obstétrica', false, 15.0, 25.0, 100, 400, 18.20),
            ('MED-003', '010.000.4158.00', 'Carbetocina', '100 mcg / 1 mL', 'Solución Inyectable', 'Caja con 5 ampolletas', 'Código Mater / Hemorragia Posparto', true, 2.0, 8.0, 30, 120, 245.00),
            ('MED-004', '010.000.2143.00', 'Ergonovina', '0.2 mg / 1 mL', 'Solución Inyectable', 'Caja con 6 ampolletas', 'Código Mater / Tocoquirúrgica', true, 2.0, 8.0, 40, 150, 22.00),
            ('MED-005', '010.000.0592.00', 'Hidralazina', '20 mg / 1 mL', 'Solución Inyectable', 'Caja con 5 ampolletas', 'Antihipertensivo / Preeclampsia Grave', false, 15.0, 25.0, 50, 200, 35.00),
            ('MED-006', '010.000.0597.00', 'Nifedipino', '10 mg', 'Cápsula de gelatina blanda', 'Frasco con 30 cápsulas', 'Antihipertensivo / Preeclampsia', false, 15.0, 25.0, 60, 250, 42.00),
            ('MED-007', '010.000.1240.00', 'Gluconato de Calcio', '1 g / 10 mL (10%)', 'Solución Inyectable', 'Caja con 100 ampolletas', 'Antídoto Toxicidad Sulfato Magnesio', false, 15.0, 25.0, 40, 150, 28.50)
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      // Obtener datos
      const catalogo = await sql`SELECT * FROM catalogo_medicamentos WHERE activo = true ORDER BY nombre_generico ASC;`;
      const lotes = await sql`SELECT * FROM lotes_inventario WHERE existencia_actual > 0 ORDER BY fecha_caducidad ASC;`;
      const movimientos = await sql`SELECT * FROM movimientos_kardex ORDER BY fecha_movimiento DESC LIMIT 100;`;
      const donaciones = await sql`SELECT * FROM actas_donacion ORDER BY fecha_recepcion DESC LIMIT 50;`;
      const audit = await sql`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50;`;

      return res.status(200).json({
        success: true,
        source: 'PostgreSQL_Neon_Cloud',
        catalogo,
        lotes,
        movimientos,
        donaciones,
        audit
      });
    }

    if (req.method === 'POST') {
      const { accion, data } = req.body || {};

      if (accion === 'REGISTRAR_MOVIMIENTO') {
        const { id, tipo, subtipo, medicamentoId, loteId, cantidad, servicio, solicitante, observaciones, usuario } = data;
        await sql`
          INSERT INTO movimientos_kardex (id, tipo, subtipo, medicamento_id, lote_id, cantidad, servicio_destino_id, solicitante_medico, observaciones, usuario_registro_id)
          VALUES (${id}, ${tipo}, ${subtipo}, ${medicamentoId}, ${loteId}, ${cantidad}, ${servicio || 'FARMACIA'}, ${solicitante || 'Personal Hospitalario'}, ${observaciones || ''}, ${usuario || 'QFB'});
        `;
        return res.status(200).json({ success: true, message: 'Movimiento registrado en PostgreSQL' });
      }

      if (accion === 'AUDIT_LOG') {
        const { usuario, accionAudit, tabla, registroId } = data;
        await sql`
          INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id)
          VALUES (${usuario || 'OPERADOR'}, ${accionAudit}, ${tabla || 'SISTEMA'}, ${registroId || 'N/A'});
        `;
        return res.status(200).json({ success: true, message: 'Log guardado en PostgreSQL' });
      }

      return res.status(400).json({ success: false, message: 'Acción no reconocida' });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('Error en API sync:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
