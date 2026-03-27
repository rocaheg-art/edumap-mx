
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));

  // Request Logger
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.url}`);
    }
    next();
  });

  // CONFIGURACIÓN HÍBRIDA (Mac + Aiven)
  const isProduction = process.env.DB_HOST ? true : false;
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Pianoverde2012',
    database: process.env.DB_NAME || 'edumap_mx',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true,
    // Solo activa SSL si está en la nube (Aiven lo exige)
    ssl: isProduction ? { rejectUnauthorized: false } : null 
  };

  let db;
  try {
    db = await mysql.createConnection(dbConfig);
    console.log(isProduction ? '✅ CONECTADO A AIVEN (NUBE)' : '🏠 CONECTADO A MYSQL LOCAL');
  } catch (err) {
    console.error('❌ ERROR DE CONEXIÓN:', err.message);
  }

  // --- HELPER PARA CONSULTAS ---
  const query = async (sql, params = []) => {
      if (!db) {
          console.warn('⚠️ Intento de consulta sin DB');
          return [];
      }
      try {
          const [results] = await db.query(sql, params);
          return results;
      } catch (err) {
          console.error('❌ Error SQL:', err.message);
          console.error('Query:', sql);
          throw err;
      }
  };

  // --- SINCRONIZACIÓN DE BASE DE DATOS ---
  async function syncDatabase() {
    try {
      const sqlPath = path.join(__dirname, 'database.sql');
      if (!fs.existsSync(sqlPath)) return;
      
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      
      // Split by semicolon and filter empty results
      const statements = sqlContent
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

      console.log(`🚀 Sincronizando base de datos (${statements.length} sentencias)...`);
      
      for (const statement of statements) {
          try {
              // ALWAYS run DROP VIEW and CREATE VIEW statements to ensure schema is fresh
              const isViewOp = statement.toUpperCase().includes('VIEW');
              if (isViewOp) {
                  await db.query(statement);
              } else {
                  await db.query(statement);
              }
          } catch (err) {
              // Ignore "already exists" for tables/indexes, but re-throw for critical view issues if needed
              if (err.code === 'ER_TABLE_EXISTS_ERROR' || 
                  err.code === 'ER_DUP_FIELDNAME' || 
                  err.code === 'ER_DUP_KEYNAME' ||
                  err.code === 'ER_VIEW_EXISTS' ||
                  err.message.includes('already exists')) {
                  continue;
              }
              console.warn(`⚠️ Error en sentencia SQL: ${err.message}`);
          }
      }
      console.log('✅ Sincronización completada');
    } catch (err) {
      console.error('❌ Error crítico en syncDatabase:', err.message);
    }
  }

  if (db) {
    // Asegurar que las columnas de cálculo existan en ofertas
    const cols = [
      'matricula_total INT DEFAULT 0',
      'matricula_mujeres INT DEFAULT 0',
      'matricula_hombres INT DEFAULT 0',
      'nuevo_ingreso_total INT DEFAULT 0',
      'egresados_total INT DEFAULT 0',
      'titulados_total INT DEFAULT 0',
      'ici DECIMAL(5,2) DEFAULT 0',
      'eficiencia_terminal DECIMAL(5,2) DEFAULT 0'
    ];
    for (const col of cols) {
      try { await db.query(`ALTER TABLE ofertas ADD ${col}`); } catch (e) {}
    }
    await syncDatabase();
  }

  // --- LOGIN STRICTO ---
  app.post('/api/login', async (req, res) => {
      const { role, identifier, password } = req.body;
      try {
          if (role === 'institution') {
              // Verificar usuario_admin y password_admin
              const sql = 'SELECT id_institucion, nombre, logo_url FROM instituciones WHERE usuario_admin = ? AND password_admin = ?';
              const results = await query(sql, [identifier, password]);
              if (results.length > 0) {
                  res.json({ id: results[0].id_institucion, name: results[0].nombre, role: 'institution', avatar: results[0].logo_url });
              } else {
                  res.status(401).json({ message: 'Usuario de institución o contraseña incorrectos.' });
              }
          } else {
              // Admin Backdoor
              if (identifier === 'admin@edumap.mx' && password === 'admin') {
                  return res.json({ 
                      id: 999, 
                      name: 'Administrador General', 
                      role: 'admin', 
                      avatar: 'https://img.icons8.com/bubbles/100/admin-settings-male.png' 
                  });
              }

              // Verificar email y password en tabla estudiantes
              const sql = 'SELECT * FROM estudiantes WHERE email = ? AND password = ?';
              const results = await query(sql, [identifier, password]);
              if (results.length > 0) {
                  const s = results[0];
                  res.json({ id: s.id_estudiante, name: `${s.nombre} ${s.apellido}`, email: s.email, role: 'student', avatar: s.avatar_url, telefono: s.telefono });
              } else {
                  res.status(401).json({ message: 'Correo de estudiante o contraseña incorrectos.' });
              }
          }
      } catch (err) { res.status(500).send(err); }
  });

  app.post('/api/register', async (req, res) => {
      const { nombre, apellido, email, password } = req.body;
      try {
          const result = await query('INSERT INTO estudiantes (nombre, apellido, email, password) VALUES (?, ?, ?, ?)', [nombre, apellido, email, password]);
          res.json({ id: result.insertId, name: `${nombre} ${apellido}`, email, role: 'student' });
      } catch (err) { res.status(500).send(err); }
  });

  app.put('/api/students/:id', async (req, res) => {
      const { nombre, apellido, telefono, avatarUrl } = req.body;
      try {
          await query(`UPDATE estudiantes SET nombre=?, apellido=?, telefono=?, avatar_url=? WHERE id_estudiante=?`, [nombre, apellido, telefono, avatarUrl, req.params.id]);
          const r = await query('SELECT * FROM estudiantes WHERE id_estudiante = ?', [req.params.id]);
          const s = r[0];
          res.json({ id: s.id_estudiante, name: `${s.nombre} ${s.apellido}`, email: s.email, role: 'student', avatar: s.avatar_url, telefono: s.telefono });
      } catch (err) { res.status(500).send(err); }
  });

  // --- INSTITUCIONES ---
  app.get('/api/instituciones', async (req, res) => {
    try {
        const { q, estado, municipio, sostenimiento, subsistema, page, limit } = req.query;
        let params = [];
        let where = " WHERE 1=1 ";

        if (q) {
            where += " AND (i.nombre LIKE ? OR i.siglas LIKE ?)";
            params.push(`%${q}%`, `%${q}%`);
        }
        if (estado || municipio) {
            where += ` AND i.id_institucion IN (SELECT id_institucion FROM escuelas WHERE 1=1 ${estado ? 'AND id_municipio IN (SELECT id_municipio FROM municipios WHERE id_entidad = ?)' : ''} ${municipio ? 'AND id_municipio = ?' : ''})`;
            if (estado) params.push(estado || null);
            if (municipio) params.push(municipio || null);
        }
        if (sostenimiento) {
            where += " AND i.id_sostenimiento = ?";
            params.push(sostenimiento);
        }
        if (subsistema) {
            where += " AND i.id_subsistema = ?";
            params.push(subsistema);
        }

        // Combine count and global aggregation in one query
        const countResults = await query(`
            SELECT COUNT(DISTINCT i.id_institucion) as total,
                   AVG(CASE WHEN ei.solicitudes_total > 0 AND o.ici > 0 THEN o.ici ELSE NULL END) as global_ici
            FROM instituciones i
            LEFT JOIN ofertas o ON i.id_institucion = o.id_institucion
            LEFT JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta
            ${where}
        `, params);
        
        const total = countResults[0]?.total || 0;
        const globalIci = countResults[0]?.global_ici || 0;

        const limitVal = parseInt(limit) || 12;
        const pageVal = parseInt(page) || 1;
        const offsetVal = (pageVal - 1) * limitVal;

        const results = await query(`
            SELECT i.*, s.nombre as sostenimiento, sub.nombre as subsistema,
                   (SELECT COUNT(*) FROM escuelas WHERE id_institucion = i.id_institucion) as total_campus,
                   (SELECT COUNT(*) FROM ofertas o JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta WHERE o.id_institucion = i.id_institucion AND ei.solicitudes_total > 0) as total_ofertas,
                   (SELECT AVG(o.ici) FROM ofertas o JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta WHERE o.id_institucion = i.id_institucion AND ei.solicitudes_total > 0 AND o.ici > 0) as ici_promedio,
                   (SELECT SUM(matricula_total) FROM ofertas WHERE id_institucion = i.id_institucion) as matricula_total,
                   (SELECT SUM(nuevo_ingreso_total) FROM ofertas WHERE id_institucion = i.id_institucion) as nuevo_ingreso_total,
                   (SELECT SUM(ei.solicitudes_total) FROM estadisticas_inclusion ei JOIN ofertas o ON ei.id_oferta = o.id_oferta WHERE o.id_institucion = i.id_institucion) as solicitudes_total
            FROM instituciones i
            LEFT JOIN sostenimientos s ON i.id_sostenimiento = s.id_sostenimiento
            LEFT JOIN subsistemas sub ON i.id_subsistema = sub.id_subsistema
            ${where}
            LIMIT ? OFFSET ?
        `, [...params, limitVal, offsetVal]);

        res.json({ data: results || [], total, globalIci, page: pageVal, limit: limitVal });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
  });


  // --- NUEVOS ENDPOINTS PARA HOME REDISEÑADA ---

  // Resumen de estadísticas nacionales
  app.get('/api/stats/resumen', async (req, res) => {
    try {
      const [row] = await query(`
        SELECT 
          SUM(o.matricula_total) AS estudiantes,
          COUNT(DISTINCT o.id_institucion) AS instituciones,
          COUNT(DISTINCT o.id_oferta) AS programas,
          SUM(COALESCE(ei.solicitudes_total, 0)) AS solicitudes,
          SUM(o.nuevo_ingreso_total) AS nuevo_ingreso
        FROM ofertas o
        LEFT JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta
      `);
      
      const sol = Number(row.solicitudes || 0);
      const ni = Number(row.nuevo_ingreso || 1);
      
      res.json({
        estudiantes: Number(row.estudiantes || 5500000).toLocaleString(),
        instituciones: Number(row.instituciones || 4332).toLocaleString(),
        programas: Number(row.programas || 14475).toLocaleString(),
        ipd_nacional: (sol / ni).toFixed(2) + 'x'
      });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // Carreras más competitivas (Top IPD)
  app.get('/api/carreras/top-ipd', async (req, res) => {
    const limit = Number(req.query.limit) || 5;
    try {
      const sql = `
        SELECT 
          c.nombre AS carrera,
          inst.siglas AS inst_siglas,
          en.nombre AS entidad,
          (COALESCE(ei.solicitudes_total, 0) / NULLIF(o.nuevo_ingreso_total, 0)) AS ipd_val
        FROM ofertas o
        JOIN carreras c ON o.id_carrera = c.id_carrera
        JOIN instituciones inst ON o.id_institucion = inst.id_institucion
        JOIN escuelas esc ON inst.id_institucion = esc.id_institucion
        JOIN municipios m ON esc.id_municipio = m.id_municipio
        JOIN entidades en ON m.id_entidad = en.id_entidad
        LEFT JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta
        WHERE o.nuevo_ingreso_total > 0
        GROUP BY o.id_oferta
        ORDER BY ipd_val DESC
        LIMIT ?
      `;
      const rows = await query(sql, [limit]);
      res.json(rows.map(r => ({
        carrera: r.carrera,
        institucion: `${r.inst_siglas || 'IES'} · ${r.entidad}`,
        ipd: Number(r.ipd_val || 0).toFixed(1) + 'x'
      })));
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // Instituciones para el Mapa (Optimizado)
  app.get('/api/instituciones/mapa', async (req, res) => {
    const { sector, campo } = req.query;
    try {
      let sql = `
        SELECT 
          inst.id_institucion,
          inst.nombre,
          inst.siglas,
          inst.logo_url,
          sost.nombre AS sector_nombre,
          esc.latitud,
          esc.longitud,
          m.nombre AS ciudad,
          en.nombre AS estado,
          SUM(o.matricula_total) AS matricula_total,
          COUNT(DISTINCT o.id_oferta) AS num_programas,
          SUM(COALESCE(ei.solicitudes_total, 0)) AS total_solicitudes,
          SUM(o.nuevo_ingreso_total) AS total_ingreso,
          SUM(o.matricula_mujeres) AS total_mujeres
        FROM instituciones inst
        JOIN escuelas esc ON inst.id_institucion = esc.id_institucion
        JOIN municipios m ON esc.id_municipio = m.id_municipio
        JOIN entidades en ON m.id_entidad = en.id_entidad
        JOIN sostenimientos sost ON inst.id_sostenimiento = sost.id_sostenimiento
        JOIN ofertas o ON inst.id_institucion = o.id_institucion
        LEFT JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta
      `;

      const conditions = [];
      const params = [];

      if (sector) {
        if (sector === 'pub') conditions.push("inst.id_sostenimiento = 2");
        if (sector === 'priv') conditions.push("inst.id_sostenimiento = 1");
      }

      if (campo) {
        const campoMap = {
          'Salud': 'CIENCIAS DE LA SALUD',
          'Ingeniería': 'INGENIERÍA, MANUFACTURA Y CONSTRUCCIÓN',
          'TIC': 'TECNOLOGÍAS DE LA INFORMACIÓN Y LA COMUNICACIÓN'
        };
        const mappedCampo = campoMap[campo];
        if (mappedCampo) {
          conditions.push(`
            o.id_carrera IN (
              SELECT c2.id_carrera 
              FROM carreras c2 
              JOIN campos_detallados cd2 ON c2.id_campo_detallado = cd2.id_campo_detallado
              JOIN campos_especificos ce2 ON cd2.id_campo_especifico = ce2.id_campo_especifico
              JOIN campos_amplios ca2 ON ce2.id_campo_amplio = ca2.id_campo_amplio
              WHERE ca2.nombre = ?
            )
          `);
          params.push(mappedCampo);
        }
      }

      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }

      sql += " GROUP BY inst.id_institucion, esc.id_escuela ORDER BY matricula_total DESC LIMIT 2000";

      const rows = await query(sql, params);
      res.json(rows.map(r => {
        const sol = Number(r.total_solicitudes || 0);
        const ing = Number(r.total_ingreso || 1);
        const mat = Number(r.matricula_total || 0);
        // Mock rating based on ID to keep it stable but varied
        const mockRating = (4.2 + (r.id_institucion % 8) / 10).toFixed(1);

        return {
          id: r.id_institucion,
          nombre: r.nombre,
          siglas: r.siglas,
          logo: r.logo_url,
          sector: r.sector_nombre,
          lat: parseFloat(r.latitud),
          lng: parseFloat(r.longitud),
          ciudad: `${r.ciudad}, ${r.estado}`,
          matricula: mat,
          num_programas: r.num_programas,
          ipd: ing > 0 ? (sol / ing) : 1,
          pct_mujeres: mat > 0 ? (Number(r.total_mujeres || 0) / mat) * 100 : 50,
          rating: mockRating
        };
      }));
    } catch(e) { 
      res.status(500).json({ error: e.message }); 
    }
  });

  app.get('/api/instituciones/:id', async (req, res) => {
      try {
          const instId = req.params.id;
          const r = await query(`
              SELECT i.*, s.nombre as sostenimiento, sub.nombre as subsistema,
                     (SELECT COUNT(*) FROM escuelas WHERE id_institucion = i.id_institucion) as total_campus,
                     (SELECT COUNT(*) FROM ofertas o JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta WHERE o.id_institucion = i.id_institucion AND ei.solicitudes_total > 0) as total_ofertas,
                     (SELECT SUM(o.matricula_total) FROM ofertas o JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta WHERE o.id_institucion = i.id_institucion AND ei.solicitudes_total > 0) as matricula_total,
                     (SELECT SUM(o.nuevo_ingreso_total) FROM ofertas o JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta WHERE o.id_institucion = i.id_institucion AND ei.solicitudes_total > 0) as nuevo_ingreso_total,
                     (SELECT SUM(o.egresados_total) FROM ofertas o JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta WHERE o.id_institucion = i.id_institucion AND ei.solicitudes_total > 0) as egresados_total,
                     (SELECT SUM(o.titulados_total) FROM ofertas o JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta WHERE o.id_institucion = i.id_institucion AND ei.solicitudes_total > 0) as titulados_total,
                     (SELECT SUM(o.matricula_mujeres) FROM ofertas o JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta WHERE o.id_institucion = i.id_institucion AND ei.solicitudes_total > 0) as matricula_mujeres,
                     (SELECT SUM(ei.solicitudes_total) FROM estadisticas_inclusion ei JOIN ofertas o ON ei.id_oferta = o.id_oferta WHERE o.id_institucion = i.id_institucion) as solicitudes_total
              FROM instituciones i
              LEFT JOIN sostenimientos s ON i.id_sostenimiento = s.id_sostenimiento
              LEFT JOIN subsistemas sub ON i.id_subsistema = sub.id_subsistema
              WHERE i.id_institucion = ?
          `, [instId]);
          
          if (!r || r.length === 0) return res.status(404).json({ error: 'Institución no encontrada' });
          res.json({ ...r[0], _debug: "v3-core-raw" });
      } catch (err) {
          res.status(500).json({ error: err.message });
      }
  });

  app.get('/api/instituciones/:id/edad', async (req, res) => {
      try {
          const sql = `
              SELECT ee.edad as rango_edad, 
                     SUM(ee.mujeres) as matricula_mujeres, 
                     SUM(ee.hombres) as matricula_hombres,
                     SUM(ee.total) as total
              FROM estadisticas_edad ee
              JOIN ofertas o ON ee.id_oferta = o.id_oferta
              WHERE o.id_institucion = ? AND ee.tipo = 'matricula'
              GROUP BY ee.edad
              ORDER BY ee.edad
          `;
          const results = await query(sql, [req.params.id]);
          res.json(results || []);
      } catch (err) { res.status(500).send(err); }
  });

  app.put('/api/instituciones/:id', async (req, res) => {
      const { nombre, descripcion, telefono, sitio_web, banner_url, logo_url, siglas, id_sostenimiento, id_subsistema } = req.body;
      try {
          await query(`UPDATE instituciones SET nombre=?, descripcion=?, telefono=?, sitio_web=?, banner_url=?, logo_url=?, siglas=?, id_sostenimiento=?, id_subsistema=? WHERE id_institucion=?`, 
          [nombre || null, descripcion || null, telefono || null, sitio_web || null, banner_url || null, logo_url || null, siglas || null, id_sostenimiento || null, id_subsistema || null, req.params.id]);
          const r = await query('SELECT * FROM instituciones WHERE id_institucion = ?', [req.params.id]);
          res.json(r[0]);
      } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/subsistemas', async (req, res) => {
    try {
      const results = await query('SELECT id_subsistema, nombre FROM subsistemas ORDER BY nombre');
      res.json(results || []);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- OFERTAS ---
  app.get('/api/ofertas', async (req, res) => {
    try {
        const { institucion } = req.query;
        let sql = `
          SELECT o.*, i.nombre as inst_nombre, i.siglas, i.logo_url, i.color_hex,
                 e.nombre as escuela_nombre, e.latitud, e.longitud,
                 c.nombre as carrera_nombre, n.nombre as nivel_nombre,
                 m.nombre as modalidad_nombre, s.nombre as sostenimiento,
                 COALESCE(ei.solicitudes_total, 0) as solicitudes_total
          FROM ofertas o
          JOIN instituciones i ON o.id_institucion = i.id_institucion
          LEFT JOIN sostenimientos s ON i.id_sostenimiento = s.id_sostenimiento
          JOIN escuelas e ON o.id_escuela = e.id_escuela
          JOIN carreras c ON o.id_carrera = c.id_carrera
          JOIN niveles n ON o.id_nivel = n.id_nivel
          LEFT JOIN modalidades m ON o.id_modalidad = m.id_modalidad
          LEFT JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta
          WHERE (ei.solicitudes_total > 0)
        `;
        const params = [];
        if (institucion) {
            sql += ' AND o.id_institucion = ?';
            params.push(institucion);
        }
        const results = await query(sql, params);
        res.json(results || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/ofertas/search', async (req, res) => {
    try {
      const { q, nivel, modalidad, estado, municipio, sostenimiento, page, limit, sort } = req.query;
      
      let baseJoins = `
        FROM ofertas o
        JOIN carreras c ON o.id_carrera = c.id_carrera
        JOIN niveles n ON o.id_nivel = n.id_nivel
        LEFT JOIN modalidades m ON o.id_modalidad = m.id_modalidad
        JOIN escuelas e ON o.id_escuela = e.id_escuela
        JOIN instituciones inst ON o.id_institucion = inst.id_institucion
        LEFT JOIN sostenimientos s ON inst.id_sostenimiento = s.id_sostenimiento
        LEFT JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta
        WHERE (ei.solicitudes_total > 0) AND (o.nuevo_ingreso_total > 0)
      `;
      const params = [];
      
      if (q) {
        baseJoins += ` AND (c.nombre LIKE ? OR inst.nombre LIKE ? OR inst.siglas LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
      }
      if (nivel) { 
        const nIds = String(nivel).split(',').map(n => parseInt(n));
        baseJoins += ` AND o.id_nivel IN (${nIds.map(() => '?').join(',')})`; 
        params.push(...nIds); 
      }
      if (modalidad) { baseJoins += ` AND o.id_modalidad = ?`; params.push(modalidad); }
      if (estado || municipio) {
          baseJoins += ` AND e.id_municipio IN (SELECT id_municipio FROM municipios WHERE 1=1 ${estado ? 'AND id_entidad = ?' : ''} ${municipio ? 'AND id_municipio = ?' : ''})`;
          if (estado) params.push(estado);
          if (municipio) params.push(municipio);
      }
      if (sostenimiento) { baseJoins += ` AND inst.id_sostenimiento = ?`; params.push(sostenimiento); }

      let sql = `
        SELECT o.*, c.nombre as carrera_nombre, n.nombre as nivel_nombre, m.nombre as modalidad_nombre,
               inst.nombre as inst_nombre, inst.siglas, inst.logo_url, inst.color_hex,
               e.nombre as escuela_nombre, e.latitud, e.longitud,
               s.nombre as sostenimiento,
               COALESCE(ei.solicitudes_total, 0) as solicitudes_total
      ` + baseJoins;

      if (sort === 'ipd_desc') {
          sql += ` ORDER BY (o.nuevo_ingreso_total / COALESCE(NULLIF(ei.solicitudes_total, 0), 1)) DESC`;
      } else if (sort === 'ipd_asc') {
          sql += ` ORDER BY (o.nuevo_ingreso_total / COALESCE(NULLIF(ei.solicitudes_total, 0), 1)) ASC`;
      } else if (sort === 'ingreso_desc') {
          sql += ` ORDER BY o.nuevo_ingreso_total DESC`;
      } else if (sort === 'ingreso_asc') {
          sql += ` ORDER BY o.nuevo_ingreso_total ASC`;
      }

      const limitVal = parseInt(limit) || 12;
      const pageVal = parseInt(page) || 1;
      const offsetVal = (pageVal - 1) * limitVal;
      
      const countSql = `
        SELECT 
          COUNT(*) as total, 
          AVG(NULLIF(o.eficiencia_terminal, 0)) as efficiencyFromColumn,
          (SUM(o.titulados_total) * 100.0 / NULLIF(SUM(o.egresados_total), 0)) as calculatedEfficiency
      ` + baseJoins;
      const countResults = await query(countSql, params);
      const total = countResults[0]?.total || 0;
      const globalEficiencia = countResults[0]?.calculatedEfficiency || countResults[0]?.efficiencyFromColumn || 0;

      sql += ` LIMIT ? OFFSET ?`;
      params.push(limitVal, offsetVal);
      const results = await query(sql, params);
      
      const formatted = (results || []).map(r => ({
        ...r,
        institucion: { id_institucion: r.id_institucion, nombre: r.inst_nombre, siglas: r.siglas, logoUrl: r.logo_url, color: r.color_hex },
        escuela: { id_escuela: r.id_escuela, nombre: r.escuela_nombre, latitud: r.latitud, longitud: r.longitud }
      }));

      res.json({ data: formatted, total, globalEficiencia, page: pageVal, limit: limitVal });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/comparar/carreras', async (req, res) => {
    try {
        const { ids } = req.query;
        if (!ids) return res.json([]);
        const idArray = ids.split(',').map(id => parseInt(id));
        
        const sql = `
            SELECT 
                o.id_oferta AS id,
                c.nombre AS nombre_programa,
                i.nombre AS nombre_institucion,
                e.nombre AS nombre_escuela,
                CASE WHEN s.nombre LIKE '%PÚBLICO%' THEN 'pub' ELSE 'priv' END AS sector,
                ca.nombre AS campo_amplio,
                ent.nombre AS entidad,
                CASE 
                    WHEN COALESCE(ei.solicitudes_total, 0) > 0 AND o.nuevo_ingreso_total > 0 
                    THEN ROUND(ei.solicitudes_total / o.nuevo_ingreso_total, 2) 
                    ELSE 1.00 
                END AS ipd,
                COALESCE(ei.solicitudes_total, 0) AS solicitudes,
                o.nuevo_ingreso_total AS nuevo_ingreso,
                o.matricula_total AS matricula_total,
                o.egresados_total AS egresados,
                o.titulados_total AS titulados,
                CASE WHEN o.matricula_total > 0 THEN ROUND((o.matricula_mujeres * 100.0 / o.matricula_total), 1) ELSE 0 END AS pct_mujeres
            FROM ofertas o
            JOIN carreras c ON o.id_carrera = c.id_carrera
            JOIN instituciones i ON o.id_institucion = i.id_institucion
            JOIN escuelas e ON o.id_escuela = e.id_escuela
            JOIN municipios m ON e.id_municipio = m.id_municipio
            JOIN entidades ent ON m.id_entidad = ent.id_entidad
            JOIN sostenimientos s ON i.id_sostenimiento = s.id_sostenimiento
            JOIN campos_detallados cd ON c.id_campo_detallado = cd.id_campo_detallado
            JOIN campos_especificos ce ON cd.id_campo_especifico = ce.id_campo_especifico
            JOIN campos_amplios ca ON ce.id_campo_amplio = ca.id_campo_amplio
            LEFT JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta
            WHERE o.id_oferta IN (?)
        `;
        
        const results = await query(sql, [idArray]);
        res.json(results || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/ofertas/:id/detalles', async (req, res) => {
      try {
          const results = await query('SELECT * FROM detalles_oferta WHERE id_oferta = ?', [req.params.id]);
          const stats = await query('SELECT * FROM estadisticas_inclusion WHERE id_oferta = ?', [req.params.id]);
          const ageStats = await query("SELECT edad as rango_edad, mujeres as matricula_mujeres, hombres as matricula_hombres, total FROM estadisticas_edad WHERE id_oferta = ? AND tipo = 'matricula'", [req.params.id]);
          res.json({
              detalles: results && results.length > 0 ? results[0] : null,
              estadisticas: stats && stats.length > 0 ? stats[0] : null,
              estadisticasEdad: ageStats || []
          });
      } catch (err) { res.status(500).send(err); }
  });

  app.put('/api/ofertas/:id/detalles', async (req, res) => {
      const { 
          mapa_curricular_url, perfil_ingreso, perfil_egreso, campo_laboral, habilidades,
          requisitos_inscripcion, costos_estimados, becas_disponibles,
          // Inclusion stats
          anio_ciclo,
          matricula_li_m, matricula_li_h, ni_li_total, egresados_li, titulados_li,
          matricula_disc_m, matricula_disc_h, ni_disc_total, egresados_disc, titulados_disc,
          solicitudes_m, solicitudes_h, solicitudes_total,
          // Legacy/Simplified fields
          alumnos_discapacidad, alumnos_lengua_indigena, becas_total
      } = req.body;
      try {
          // Detalles
          const results = await query('SELECT * FROM detalles_oferta WHERE id_oferta = ?', [req.params.id]);
          if (results.length > 0) {
              await query(`UPDATE detalles_oferta SET mapa_curricular_url=?, perfil_ingreso=?, perfil_egreso=?, campo_laboral=?, habilidades=?, requisitos_inscripcion=?, costos_estimados=?, becas_disponibles=? WHERE id_oferta=?`, 
              [mapa_curricular_url, perfil_ingreso, perfil_egreso, campo_laboral, habilidades, requisitos_inscripcion, costos_estimados, becas_disponibles, req.params.id]);
          } else {
              await query(`INSERT INTO detalles_oferta (id_oferta, mapa_curricular_url, perfil_ingreso, perfil_egreso, campo_laboral, habilidades, requisitos_inscripcion, costos_estimados, becas_disponibles) VALUES (?,?,?,?,?,?,?,?,?)`, 
              [req.params.id, mapa_curricular_url, perfil_ingreso, perfil_egreso, campo_laboral, habilidades, requisitos_inscripcion, costos_estimados, becas_disponibles]);
          }

          // Estadísticas de Inclusión
          const statsResults = await query('SELECT * FROM estadisticas_inclusion WHERE id_oferta = ?', [req.params.id]);
          if (statsResults.length > 0) {
              await query(`UPDATE estadisticas_inclusion SET 
                anio_ciclo=?, 
                matricula_li_m=?, matricula_li_h=?, ni_li_total=?, egresados_li=?, titulados_li=?,
                matricula_disc_m=?, matricula_disc_h=?, ni_disc_total=?, egresados_disc=?, titulados_disc=?,
                solicitudes_m=?, solicitudes_h=?, solicitudes_total=?
                WHERE id_oferta=?`,
              [
                anio_ciclo || 2024,
                matricula_li_m || alumnos_lengua_indigena || 0, matricula_li_h || 0, ni_li_total || 0, egresados_li || 0, titulados_li || 0,
                matricula_disc_m || alumnos_discapacidad || 0, matricula_disc_h || 0, ni_disc_total || 0, egresados_disc || 0, titulados_disc || 0,
                solicitudes_m || 0, solicitudes_h || 0, solicitudes_total || 0,
                req.params.id
              ]);
          } else {
              await query(`INSERT INTO estadisticas_inclusion (
                id_oferta, anio_ciclo,
                matricula_li_m, matricula_li_h, ni_li_total, egresados_li, titulados_li,
                matricula_disc_m, matricula_disc_h, ni_disc_total, egresados_disc, titulados_disc,
                solicitudes_m, solicitudes_h, solicitudes_total
              ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
              [
                req.params.id, anio_ciclo || 2024,
                matricula_li_m || alumnos_lengua_indigena || 0, matricula_li_h || 0, ni_li_total || 0, egresados_li || 0, titulados_li || 0,
                matricula_disc_m || alumnos_discapacidad || 0, matricula_disc_h || 0, ni_disc_total || 0, egresados_disc || 0, titulados_disc || 0,
                solicitudes_m || 0, solicitudes_h || 0, solicitudes_total || 0
              ]);
          }

          res.json({ message: "Actualizado con éxito" });
      } catch (e) { res.status(500).send(e); }
  });

  app.post('/api/ofertas', async (req, res) => {
      const { id_institucion, id_escuela, id_carrera, id_nivel, id_modalidad, duracion } = req.body;
      try {
          const result = await query(`INSERT INTO ofertas (id_institucion, id_escuela, id_carrera, id_nivel, id_modalidad, duracion) VALUES (?,?,?,?,?,?)`, 
          [id_institucion, id_escuela, id_carrera, id_nivel, id_modalidad, duracion]);
          res.json({ message: "Agregada", id: result.insertId });
      } catch (err) { res.status(500).send(err); }
  });

  app.delete('/api/ofertas/:id', async (req, res) => {
      try {
          await query('DELETE FROM ofertas WHERE id_oferta = ?', [req.params.id]);
          res.json({ message: "Eliminada" });
      } catch (err) { res.status(500).send(err); }
  });

  app.post('/api/carreras', async (req, res) => {
      const { nombre, id_campo_detallado } = req.body;
      try {
          const result = await query('INSERT INTO carreras (nombre, id_campo_detallado) VALUES (?, ?)', [nombre, id_campo_detallado]);
          res.json({ id_carrera: result.insertId, nombre, id_campo_detallado });
      } catch (err) { res.status(500).send(err); }
  });

  // --- ESCUELAS / CAMPUS ---
  app.get('/api/escuelas', async (req, res) => { 
      const { institucion, carrera, estado, municipio, nivel, sostenimiento, q } = req.query;
      
      let sql = `
          SELECT e.id_escuela, e.id_institucion, e.nombre, e.latitud, e.longitud,
                 i.nombre as inst_nombre, i.siglas, i.logo_url, i.color_hex, s.nombre as sostenimiento_nombre, i.banner_url,
                 mun.nombre as municipio_nombre
          FROM escuelas e
          JOIN instituciones i ON e.id_institucion = i.id_institucion
          LEFT JOIN sostenimientos s ON i.id_sostenimiento = s.id_sostenimiento
          LEFT JOIN municipios mun ON e.id_municipio = mun.id_municipio
      `;
      
      sql += `
          JOIN ofertas o ON e.id_escuela = o.id_escuela
          LEFT JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta
          JOIN carreras c ON o.id_carrera = c.id_carrera
      `;

      const params = [];
      let whereAdded = false;
      const addWhere = (clause, param) => {
          sql += (whereAdded ? ' AND ' : ' WHERE ') + clause;
          if (Array.isArray(param)) {
              params.push(...param);
          } else {
              params.push(param);
          }
          whereAdded = true;
      };

      if (institucion) addWhere('e.id_institucion = ?', [institucion]);
      if (carrera) addWhere('o.id_carrera = ?', [carrera]);
      if (nivel) addWhere('o.id_nivel = ?', [nivel]);
      // Filtrar solo las que tienen solicitudes (demanda activa)
      addWhere('(ei.solicitudes_total > 0)', []);
      if (municipio) addWhere('e.id_municipio = ?', municipio);
      if (estado) addWhere('mun.id_entidad = ?', estado);
      if (sostenimiento) addWhere('i.id_sostenimiento = ?', sostenimiento);
      if (q) addWhere('(c.nombre LIKE ? OR i.nombre LIKE ? OR i.siglas LIKE ?)', [`%${q}%`, `%${q}%`, `%${q}%`]);

      sql += ` GROUP BY e.id_escuela`;

      try { 
          const results = await query(sql, params); 
          res.json(results || []); 
      } catch(e){ 
          console.error("Error fetching escuelas", e);
          res.status(500).send(e.message); 
      }
  });

  app.get('/api/distribucion-edad/:id_carrera', async (req, res) => {
      const sql = `
          SELECT
              ee.edad as rango_edad,
              SUM(ee.mujeres)                        AS mujeres,
              SUM(ee.hombres)                        AS hombres,
              SUM(ee.total)                          AS total
          FROM estadisticas_edad ee
          JOIN ofertas o ON ee.id_oferta = o.id_oferta
          WHERE o.id_carrera = ? AND ee.tipo = 'matricula'
          GROUP BY ee.edad
          ORDER BY ee.edad
      `;
      try {
          const rows = await query(sql, [req.params.id_carrera]);
          const totalGen = rows.length > 0 ? rows.reduce((s, r) => s + Number(r.total), 0) : 0;
          const result = rows.map(r => ({
              ...r,
              rango_edad: r.rango_edad,
              matricula_mujeres: Number(r.mujeres),
              matricula_hombres: Number(r.hombres),
              total: Number(r.total),
              pct: totalGen > 0 ? +((Number(r.total) / totalGen) * 100).toFixed(1) : 0
          }));
          res.json(result);
      } catch(e) { 
          console.error("Error en distribucion-edad:", e);
          res.status(500).json({ error: e.message }); 
      }
  });

  // ═══════════════════════════════════════════════
  // OBSERVATORIO ESTADÍSTICO - Analytics endpoints
  // ═══════════════════════════════════════════════

  // KPIs globales para el observatorio
  app.get('/api/observatorio/kpis', async (req, res) => {
    try {
      const [totales] = await Promise.all([
        query(`
          SELECT 
            SUM(o.matricula_total)    AS matricula_total,
            SUM(o.nuevo_ingreso_total) AS nuevo_ingreso,
            SUM(o.egresados_total)    AS egresados,
            SUM(o.titulados_total)    AS titulados,
            COUNT(DISTINCT o.id_oferta) AS total_ofertas,
            COUNT(DISTINCT o.id_institucion) AS total_instituciones
          FROM ofertas o
        `)
      ]);

      const [solicitudes] = await Promise.all([
        query(`SELECT SUM(ei.solicitudes_total) AS solicitudes FROM estadisticas_inclusion ei`)
      ]);

      const [edadMedia] = await Promise.all([
        query(`
          SELECT AVG(
            CASE ee.edad
              WHEN '17 y menores' THEN 17
              WHEN '18' THEN 18 WHEN '19' THEN 19 WHEN '20' THEN 20
              WHEN '21' THEN 21 WHEN '22' THEN 22 WHEN '23' THEN 23
              WHEN '24' THEN 24 WHEN '25' THEN 25 WHEN '26-29' THEN 27
              WHEN '30-34' THEN 32 WHEN '35-39' THEN 37 WHEN '40+' THEN 42
              ELSE NULL END
          ) AS edad_media
          FROM estadisticas_edad
          WHERE tipo = 'matricula' AND total > 0
        `)
      ]);

      const [genero] = await Promise.all([
        query(`SELECT SUM(matricula_mujeres) AS mujeres, SUM(matricula_total) AS total FROM ofertas WHERE matricula_total > 0`)
      ]);

      const kpis = totales[0] || {};
      const sol = solicitudes[0] || {};
      const sol_total = Number(sol.solicitudes || 0);
      const ni = Number(kpis.nuevo_ingreso || 1);

      res.json({
        matricula_total:    Number(kpis.matricula_total || 0),
        nuevo_ingreso:      Number(kpis.nuevo_ingreso || 0),
        egresados:          Number(kpis.egresados || 0),
        titulados:          Number(kpis.titulados || 0),
        total_ofertas:      Number(kpis.total_ofertas || 0),
        total_instituciones: Number(kpis.total_instituciones || 0),
        solicitudes:        sol_total,
        aspirantes_por_lugar: ni > 0 ? +(sol_total / ni).toFixed(1) : 0,
        pct_mujeres:        genero[0]?.total > 0 ? +((Number(genero[0].mujeres) / Number(genero[0].total)) * 100).toFixed(1) : 0,
        edad_media:         edadMedia[0]?.edad_media ? +Number(edadMedia[0].edad_media).toFixed(1) : null,
        eficiencia_global:  Number(kpis.nuevo_ingreso) > 0 ? +((Number(kpis.egresados) / Number(kpis.nuevo_ingreso)) * 100).toFixed(1) : 0,
      });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // Scatter plot: Selectividad vs Matrícula (por sostenimiento)
  app.get('/api/observatorio/selectividad', async (req, res) => {
    try {
      const rows = await query(`
        SELECT 
          o.id_oferta,
          o.id_carrera,
          c.nombre AS carrera_nombre,
          o.matricula_total,
          o.nuevo_ingreso_total,
          o.lugares_ofertados,
          COALESCE(ei.solicitudes_total, 0) AS solicitudes,
          s.nombre AS sostenimiento,
          n.nombre AS nivel,
          inst.nombre AS inst_nombre
        FROM ofertas o
        JOIN carreras c ON o.id_carrera = c.id_carrera
        JOIN instituciones inst ON o.id_institucion = inst.id_institucion
        LEFT JOIN sostenimientos s ON inst.id_sostenimiento = s.id_sostenimiento
        JOIN niveles n ON o.id_nivel = n.id_nivel
        LEFT JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta
        WHERE ei.solicitudes_total > 0
          AND o.matricula_total > 0
      `);

      const result = rows.map(r => {
        const sol = Number(r.solicitudes);
        const ni  = Number(r.nuevo_ingreso_total || 1);
        const mat = Number(r.matricula_total || 0);
        const ipd = ni > 0 ? +((ni / sol) * 100).toFixed(1) : 100;
        const rechazo = sol > 0 ? +(((sol - ni) / sol) * 100).toFixed(1) : 0;
        return {
          id: r.id_oferta,
          carrera: r.carrera_nombre,
          institucion: r.inst_nombre,
          nivel: r.nivel,
          matricula: mat,
          solicitudes: sol,
          nuevo_ingreso: ni,
          ipd,
          rechazo,
          sostenimiento: r.sostenimiento || 'Sin dato',
        };
      });
      res.json(result);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // Age distribution by modalidad
  app.get('/api/observatorio/edad-modalidad', async (req, res) => {
    try {
      const rows = await query(`
        SELECT 
          m.nombre AS modalidad,
          ee.edad,
          SUM(ee.mujeres) AS mujeres,
          SUM(ee.hombres) AS hombres,
          SUM(ee.total) AS total
        FROM estadisticas_edad ee
        JOIN ofertas o ON ee.id_oferta = o.id_oferta
        LEFT JOIN modalidades m ON o.id_modalidad = m.id_modalidad
        WHERE ee.tipo = 'matricula' AND ee.total > 0
        GROUP BY m.nombre, ee.edad
        ORDER BY m.nombre, ee.edad
      `);
      res.json(rows);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // Inclusion by nivel
  app.get('/api/observatorio/inclusion-nivel', async (req, res) => {
    try {
      const rows = await query(`
        SELECT 
          n.nombre AS nivel,
          SUM(o.matricula_total) AS matricula_base,
          SUM(COALESCE(ei.matricula_disc_m, 0) + COALESCE(ei.matricula_disc_h, 0)) AS discapacidad,
          SUM(COALESCE(ei.matricula_li_m, 0) + COALESCE(ei.matricula_li_h, 0)) AS lengua_indigena,
          SUM(COALESCE(ei.becas_total, 0)) AS becados
        FROM ofertas o
        JOIN niveles n ON o.id_nivel = n.id_nivel
        LEFT JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta
        WHERE o.matricula_total > 0
        GROUP BY n.id_nivel, n.nombre
        ORDER BY n.id_nivel
      `);
      res.json(rows);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // Flujo de eficiencia (Sankey-ready data)
  app.get('/api/observatorio/flujo', async (req, res) => {
    try {
      const [row] = await query(`
        SELECT 
          SUM(COALESCE(ei.solicitudes_total, 0)) AS solicitudes,
          SUM(o.nuevo_ingreso_total) AS nuevo_ingreso,
          SUM(o.matricula_total) AS matricula,
          SUM(o.egresados_total) AS egresados,
          SUM(o.titulados_total) AS titulados
        FROM ofertas o
        LEFT JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta
        WHERE o.matricula_total > 0
      `);
      res.json({
        solicitudes:   Number(row.solicitudes || 0),
        nuevo_ingreso: Number(row.nuevo_ingreso || 0),
        matricula:     Number(row.matricula || 0),
        egresados:     Number(row.egresados || 0),
        titulados:     Number(row.titulados || 0),
      });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // Gender gap by campo amplio
  app.get('/api/observatorio/genero-campo', async (req, res) => {
    try {
      const rows = await query(`
        SELECT 
          ca.nombre AS campo_amplio,
          SUM(o.matricula_mujeres) AS mujeres,
          SUM(o.matricula_total - o.matricula_mujeres) AS hombres,
          SUM(o.matricula_total) AS total
        FROM ofertas o
        JOIN carreras c ON o.id_carrera = c.id_carrera
        JOIN campos_detallados cd ON c.id_campo_detallado = cd.id_campo_detallado
        JOIN campos_especificos ce ON cd.id_campo_especifico = ce.id_campo_especifico
        JOIN campos_amplios ca ON ce.id_campo_amplio = ca.id_campo_amplio
        WHERE o.matricula_total > 0
        GROUP BY ca.id_campo_amplio, ca.nombre
        ORDER BY total DESC
        LIMIT 12
      `);
      res.json(rows);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });


  app.post('/api/escuelas', async (req, res) => {
      const { id_institucion, id_municipio, nombre, latitud, longitud } = req.body;
      try {
          const result = await query('INSERT INTO escuelas (id_institucion, id_municipio, nombre, latitud, longitud) VALUES (?, ?, ?, ?, ?)', 
          [id_institucion, id_municipio, nombre, latitud, longitud]);
          res.json({ id_escuela: result.insertId, ...req.body });
      } catch (err) { res.status(500).send(err); }
  });


  app.get('/api/info-carreras', async (req, res) => {
      try {
          const results = await query('SELECT * FROM info_carreras');
          res.json(results || []);
      } catch (err) { res.status(500).send(err); }
  });

  app.get('/api/carreras/search', async (req, res) => {
      const { q } = req.query;
      if (!q) return res.json([]);
      try {
          const sql = `
              SELECT c.*, ic.titulo_marketing, ic.descripcion_breve, ic.imagen_url
              FROM carreras c
              LEFT JOIN info_carreras ic ON c.nombre LIKE CONCAT('%', ic.palabra_clave, '%')
              WHERE c.nombre LIKE ?
              LIMIT 10
          `;
          const results = await query(sql, [`%${q}%`]);
          res.json(results || []);
      } catch (err) { res.status(500).send(err); }
  });

  app.get('/api/municipios', async (req, res) => { try { res.json(await query('SELECT * FROM municipios') || []); } catch(e){res.json([])} });
  app.get('/api/estados', async (req, res) => { try { res.json(await query('SELECT * FROM entidades') || []); } catch(e){res.json([])} });
  app.get('/api/sostenimientos', async (req, res) => { try { res.json(await query('SELECT * FROM sostenimientos') || []); } catch(e){res.json([])} });
  app.get('/api/niveles', async (req, res) => { try { res.json(await query('SELECT * FROM niveles') || []); } catch(e){res.json([])} });
  app.get('/api/campos', async (req, res) => { try { res.json(await query('SELECT * FROM campos_formacion') || []); } catch(e){res.json([])} });
  app.get('/api/modalidades', async (req, res) => { try { res.json(await query('SELECT * FROM modalidades') || []); } catch(e){res.json([])} });
  app.get('/api/carreras', async (req, res) => { try { res.json(await query('SELECT * FROM carreras ORDER BY nombre') || []); } catch(e){res.json([])} });

  app.get('/api/health', async (req, res) => {
      try {
          if (!db) throw new Error("Base de datos no inicializada");
          await query('SELECT 1');
          res.json({ status: 'ok', database: 'connected', db_name: 'edumap_mx' });
      } catch (err) {
          res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
      }
  });

  app.post('/api/reviews', async (req, res) => {
      const { id_institucion, nombre_usuario, calificacion, comentario } = req.body;
      try {
          const result = await query('INSERT INTO reviews (id_institucion, nombre_usuario, calificacion, comentario) VALUES (?, ?, ?, ?)', [id_institucion, nombre_usuario, calificacion, comentario]);
          res.json({ id_review: result.insertId, ...req.body, fecha: new Date() });
      } catch (err) { res.status(500).send(err); }
  });
  app.get('/api/reviews', async (req, res) => {
      try { res.json(await query('SELECT * FROM reviews WHERE id_institucion = ? ORDER BY fecha DESC', [req.query.institucion]) || []); } catch(e){res.json([])}
  });
  app.get('/api/convocatorias', async (req, res) => {
      try { res.json(await query('SELECT id_convocatoria, id_institucion, titulo, contenido, fecha, imagen_url as imagenUrl FROM convocatorias WHERE id_institucion = ? ORDER BY fecha DESC', [req.query.institucion]) || []); } catch(e){res.json([])}
  });
  app.post('/api/convocatorias', async (req, res) => {
      const { id_institucion, titulo, contenido, imagen_url } = req.body;
      try {
          const result = await query('INSERT INTO convocatorias (id_institucion, titulo, contenido, imagen_url) VALUES (?, ?, ?, ?)', [id_institucion, titulo, contenido, imagen_url]);
          res.json({ id_convocatoria: result.insertId, ...req.body, fecha: new Date() });
      } catch (err) { res.status(500).send(err); }
  });

  // --- GALERIA ---
  app.get('/api/galeria', async (req, res) => {
      try {
          const results = await query('SELECT id_imagen, id_institucion, imagen_url as imagenUrl, descripcion FROM galeria_imagenes WHERE id_institucion = ? ORDER BY orden ASC', [req.query.institucion]);
          res.json(results || []);
      } catch (err) { res.status(500).send(err); }
  });
  app.post('/api/galeria', async (req, res) => {
      const { id_institucion, imagen_url, descripcion } = req.body;
      try {
          const result = await query('INSERT INTO galeria_imagenes (id_institucion, imagen_url, descripcion) VALUES (?, ?, ?)', [id_institucion, imagen_url, descripcion]);
          res.json({ id_imagen: result.insertId, ...req.body });
      } catch (err) { res.status(500).send(err); }
  });
  app.delete('/api/galeria/:id', async (req, res) => {
      try {
          await query('DELETE FROM galeria_imagenes WHERE id_imagen = ?', [req.params.id]);
          res.json({ message: "Eliminada" });
      } catch (err) { res.status(500).send(err); }
  });

  // --- INTERESES / LEAD GEN ---
  app.post('/api/intereses', async (req, res) => {
      const { userId, instId } = req.body;
      try {
          await query('INSERT INTO intereses (id_estudiante, id_institucion) VALUES (?, ?) ON DUPLICATE KEY UPDATE fecha_interes=NOW()', [userId, instId]);
          res.json({ success: true });
      } catch (err) { res.status(500).send(err); }
  });

  app.post('/api/import', async (req, res) => {
      const { sql } = req.body;
      try {
          await query(sql);
          res.json({ message: "Importación exitosa" });
      } catch (err) {
          console.error("Error en importación:", err);
          res.status(500).json({ message: "Error al importar SQL", error: err.message });
      }
  });

  app.post('/api/admin/clear', async (req, res) => {
      try {
          const tables = [
              'reviews', 'convocatorias', 'galeria_imagenes', 'intereses', 
              'detalles_oferta', 'estadisticas_inclusion',
              'ofertas', 'escuelas', 'carreras', 'instituciones',
              'municipios', 'entidades', 'sostenimientos', 'subsistemas',
              'niveles', 'tipos_institucion', 'campos_detallados', 
              'campos_especificos', 'campos_amplios', 'modalidades', 'info_carreras',
              'estudiantes'
          ];
          await query('SET FOREIGN_KEY_CHECKS = 0');
          for (const table of tables) {
              await query(`TRUNCATE TABLE ${table}`);
          }
          await query('SET FOREIGN_KEY_CHECKS = 1');
          res.json({ message: "Base de datos reseteada" });
      } catch (err) {
          res.status(500).json({ error: err.message });
      }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        watch: {
          usePolling: true,
          interval: 100
        }
      },
      appType: 'spa',
      root: process.cwd()
    });
    app.use(vite.middlewares);

    // Servir index.html para todas las rutas en desarrollo (Regex compatible con Express 5)
    app.get(/^(?!\/api).+/, async (req, res, next) => {
      const url = req.originalUrl;
      // No atrapar archivos estáticos con punto (ej. .js, .css, .png)
      if (url.includes('.')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
