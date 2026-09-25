const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
  // Configuración de CORS y cabeceras de seguridad
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!dbUrl) {
    return res.status(200).json({
      connected: false,
      message: 'DATABASE_URL no configurada en las variables de entorno.',
      mode: 'localStorage'
    });
  }

  try {
    const sql = neon(dbUrl);
    const dbInfo = await sql`SELECT current_database() as database, version() as version, NOW() as server_time;`;
    
    // Contar registros de las tablas hospitalarias
    const counts = await sql`
      SELECT 
        (SELECT COUNT(*) FROM usuarios) as total_usuarios,
        (SELECT COUNT(*) FROM servicios_hospitalarios) as total_servicios,
        (SELECT COUNT(*) FROM catalogo_medicamentos) as total_medicamentos,
        (SELECT COUNT(*) FROM lotes_inventario) as total_lotes,
        (SELECT COUNT(*) FROM actas_donacion) as total_donaciones,
        (SELECT COUNT(*) FROM movimientos_kardex) as total_movimientos,
        (SELECT COUNT(*) FROM audit_logs) as total_audit_logs;
    `;

    return res.status(200).json({
      connected: true,
      provider: 'Neon Serverless PostgreSQL (Vercel Storage)',
      database: dbInfo[0].database,
      serverTime: dbInfo[0].server_time,
      tables: counts[0],
      status: 'ONLINE'
    });
  } catch (error) {
    console.error('Error al conectar a PostgreSQL:', error);
    return res.status(500).json({
      connected: false,
      error: error.message,
      provider: 'Neon PostgreSQL'
    });
  }
};
