import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generate() {
    let db;
    try {
        db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Pianoverde2012',
            database: 'edumap_mx'
        });
        console.log('✅ Conectado a SQL para generar Observatorio JSON');

        const OUTPUT = {};

        // EXTRA: Counters
        const [counters] = await db.query(`
            SELECT 
                SUM(o.matricula_total) AS total_estudiantes,
                COUNT(DISTINCT o.id_institucion) AS total_instituciones,
                COUNT(DISTINCT o.id_carrera) AS total_programas,
                32 AS total_estados,
                (SUM(o.matricula_mujeres) / SUM(o.matricula_total) * 100) AS pct_mujeres
            FROM ofertas o
        `);
        OUTPUT.counters = counters[0];

        // V1: Mapa de calor: Densidad por entidad
        const [v1_raw] = await db.query(`
            SELECT 
                e.nombre AS entidad,
                SUM(o.matricula_total) AS matricula_total,
                COUNT(DISTINCT o.id_institucion) AS instituciones
            FROM ofertas o
            JOIN escuelas esc ON o.id_escuela = esc.id_escuela
            JOIN municipios m ON esc.id_municipio = m.id_municipio
            JOIN entidades e ON m.id_entidad = e.id_entidad
            GROUP BY e.nombre
        `);
        // We also need the top career per entity
        const [top_carreras] = await db.query(`
            SELECT 
                e.nombre AS entidad,
                c.nombre AS carrera,
                SUM(o.matricula_total) AS mat
            FROM ofertas o
            JOIN escuelas esc ON o.id_escuela = esc.id_escuela
            JOIN municipios m ON esc.id_municipio = m.id_municipio
            JOIN entidades e ON m.id_entidad = e.id_entidad
            JOIN carreras c ON o.id_carrera = c.id_carrera
            GROUP BY e.nombre, c.nombre
        `);
        
        let topMap = {};
        for(let row of top_carreras) {
            if(!topMap[row.entidad] || topMap[row.entidad].mat < row.mat) {
                topMap[row.entidad] = { carrera: row.carrera, mat: row.mat };
            }
        }
        OUTPUT.v1_densidad = v1_raw.map(r => ({
            ...r,
            carrera_popular: topMap[r.entidad]?.carrera || 'N/A'
        }));

        // V2: Brecha de genero por campo amplio
        const [v2] = await db.query(`
            SELECT 
                ca.nombre AS campo_amplio,
                SUM(o.matricula_mujeres) AS mujeres,
                SUM(o.matricula_hombres) AS hombres,
                SUM(o.matricula_total) AS total
            FROM ofertas o
            JOIN carreras c ON o.id_carrera = c.id_carrera
            JOIN campos_detallados cd ON c.id_campo_detallado = cd.id_campo_detallado
            JOIN campos_especificos ce ON cd.id_campo_especifico = ce.id_campo_especifico
            JOIN campos_amplios ca ON ce.id_campo_amplio = ca.id_campo_amplio
            GROUP BY ca.nombre
            ORDER BY (SUM(o.matricula_mujeres)/SUM(o.matricula_total)) DESC
        `);
        const [v2_sub] = await db.query(`
             SELECT 
                ca.nombre AS campo_amplio,
                ce.nombre AS campo_especifico,
                SUM(o.matricula_mujeres) AS mujeres,
                SUM(o.matricula_hombres) AS hombres
            FROM ofertas o
            JOIN carreras c ON o.id_carrera = c.id_carrera
            JOIN campos_detallados cd ON c.id_campo_detallado = cd.id_campo_detallado
            JOIN campos_especificos ce ON cd.id_campo_especifico = ce.id_campo_especifico
            JOIN campos_amplios ca ON ce.id_campo_amplio = ca.id_campo_amplio
            GROUP BY ca.nombre, ce.nombre
        `);
        
        OUTPUT.v2_genero = v2.map(r => {
            const subs = v2_sub.filter(s => s.campo_amplio === r.campo_amplio)
                               .sort((a,b) => (b.mujeres+b.hombres) - (a.mujeres+a.hombres))
                               .slice(0, 5);
            return { ...r, subs };
        });

        // V3: Publico vs Privado
        const [v3] = await db.query(`
            SELECT 
                e.nombre AS entidad,
                s.nombre AS sostenimiento,
                COUNT(DISTINCT o.id_institucion) AS instituciones,
                SUM(o.matricula_total) AS matricula
            FROM ofertas o
            JOIN escuelas esc ON o.id_escuela = esc.id_escuela
            JOIN municipios m ON esc.id_municipio = m.id_municipio
            JOIN entidades e ON m.id_entidad = e.id_entidad
            JOIN instituciones inst ON o.id_institucion = inst.id_institucion
            JOIN sostenimientos s ON inst.id_sostenimiento = s.id_sostenimiento
            GROUP BY e.nombre, s.nombre
        `);
        
        const v3_grouped = {};
        v3.forEach(r => {
            if(!v3_grouped[r.entidad]) v3_grouped[r.entidad] = { entidad: r.entidad, publico_inst: 0, privado_inst: 0, publico_mat: 0, privado_mat: 0 };
            if(r.sostenimiento.toLowerCase().includes('públic')) {
                v3_grouped[r.entidad].publico_inst += r.instituciones;
                v3_grouped[r.entidad].publico_mat += Number(r.matricula);
            } else {
                v3_grouped[r.entidad].privado_inst += r.instituciones;
                v3_grouped[r.entidad].privado_mat += Number(r.matricula);
            }
        });
        OUTPUT.v3_sostenimiento = Object.values(v3_grouped).map(r => {
            const tot_inst = r.publico_inst + r.privado_inst;
            r.pct_publico_inst = tot_inst > 0 ? (r.publico_inst / tot_inst * 100) : 0;
            return r;
        }).sort((a,b) => b.pct_publico_inst - a.pct_publico_inst);

        // V4: Dificultad (Top 100 to avoid giant payload)
        const [v4] = await db.query(`
            SELECT 
                c.nombre AS carrera,
                SUM(ei.solicitudes_total) AS solicitudes,
                SUM(o.nuevo_ingreso_total) AS nuevo_ingreso,
                SUM(o.matricula_total) AS matricula,
                ca.nombre AS campo_amplio,
                e.nombre AS entidad,
                s.nombre AS sostenimiento
            FROM ofertas o
            JOIN carreras c ON o.id_carrera = c.id_carrera
            JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta
            JOIN campos_detallados cd ON c.id_campo_detallado = cd.id_campo_detallado
            JOIN campos_especificos ce ON cd.id_campo_especifico = ce.id_campo_especifico
            JOIN campos_amplios ca ON ce.id_campo_amplio = ca.id_campo_amplio
            JOIN escuelas esc ON o.id_escuela = esc.id_escuela
            JOIN municipios m ON esc.id_municipio = m.id_municipio
            JOIN entidades e ON m.id_entidad = e.id_entidad
            JOIN instituciones inst ON o.id_institucion = inst.id_institucion
            JOIN sostenimientos s ON inst.id_sostenimiento = s.id_sostenimiento
            WHERE ei.solicitudes_total > 0 AND o.nuevo_ingreso_total > 0
            GROUP BY c.nombre, ca.nombre, e.nombre, s.nombre
            HAVING solicitudes >= 50
        `);
        OUTPUT.v4_dificultad = v4.map(r => {
            r.solicitudes = Number(r.solicitudes);
            r.nuevo_ingreso = Number(r.nuevo_ingreso);
            r.ratio = (r.solicitudes / r.nuevo_ingreso);
            r.matricula = Number(r.matricula);
            return r;
        }).sort((a, b) => b.ratio - a.ratio);

        // --- MAP MODULE DATA ---
        
        // Map 1: Heatmap (Entity) - Already mostly covered by v1_densidad
        OUTPUT.map_heatmap = OUTPUT.v1_densidad;

        // Map 2: Gender Gap (Municipality)
        const [m2] = await db.query(`
            SELECT 
                m.nombre AS municipio,
                e.nombre AS entidad,
                SUM(o.matricula_mujeres) AS mujeres,
                SUM(o.matricula_hombres) AS hombres,
                SUM(o.matricula_total) AS total,
                AVG(esc.latitud) AS lat,
                AVG(esc.longitud) AS lng
            FROM ofertas o
            JOIN escuelas esc ON o.id_escuela = esc.id_escuela
            JOIN municipios m ON esc.id_municipio = m.id_municipio
            JOIN entidades e ON m.id_entidad = e.id_entidad
            GROUP BY m.nombre, e.nombre
        `);
        OUTPUT.map_gender = m2.map(r => ({
            ...r,
            ratio: Number(r.hombres) > 0 ? (Number(r.mujeres) / Number(r.hombres)) : 2 // Cap for display
        }));

        // Map 3: Institution Points
        const [m3] = await db.query(`
            SELECT 
                esc.id_escuela,
                esc.nombre,
                esc.latitud AS lat,
                esc.longitud AS lng,
                inst.nombre AS institucion,
                s.nombre AS sostenimiento,
                SUM(o.matricula_total) AS matricula
            FROM ofertas o
            JOIN escuelas esc ON o.id_escuela = esc.id_escuela
            JOIN instituciones inst ON o.id_institucion = inst.id_institucion
            JOIN sostenimientos s ON inst.id_sostenimiento = s.id_sostenimiento
            WHERE esc.latitud IS NOT NULL AND esc.longitud IS NOT NULL
            GROUP BY esc.id_escuela, esc.nombre, esc.latitud, esc.longitud, inst.nombre, s.nombre
            HAVING matricula > 0
        `);
        OUTPUT.map_institutions = m3;

        // Map 4: Access Difficulty
        const [m4] = await db.query(`
            SELECT 
                e.nombre AS entidad,
                SUM(ei.solicitudes_total) AS solicitudes,
                SUM(o.nuevo_ingreso_total) AS nuevo_ingreso
            FROM ofertas o
            JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta
            JOIN escuelas esc ON o.id_escuela = esc.id_escuela
            JOIN municipios m ON esc.id_municipio = m.id_municipio
            JOIN entidades e ON m.id_entidad = e.id_entidad
            GROUP BY e.nombre
        `);
        OUTPUT.map_access = m4.map(r => ({
            ...r,
            ratio: Number(r.nuevo_ingreso) > 0 ? (Number(r.solicitudes) / Number(r.nuevo_ingreso)) : 0
        }));

        // Map 5: Inclusion (Indigenous/Disability)
        const [m5] = await db.query(`
            SELECT 
                e.nombre AS entidad,
                SUM(COALESCE(ei.matricula_li_m,0) + COALESCE(ei.matricula_li_h,0)) AS indigenas,
                SUM(COALESCE(ei.matricula_disc_m,0) + COALESCE(ei.matricula_disc_h,0)) AS discapacidad,
                SUM(o.matricula_total) AS total
            FROM ofertas o
            JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta
            JOIN escuelas esc ON o.id_escuela = esc.id_escuela
            JOIN municipios m ON esc.id_municipio = m.id_municipio
            JOIN entidades e ON m.id_entidad = e.id_entidad
            GROUP BY e.nombre
        `);
        OUTPUT.map_inclusion = m5.map(r => ({
            ...r,
            pct_indigena: Number(r.total) > 0 ? (Number(r.indigenas) / Number(r.total) * 100) : 0,
            pct_discapacidad: Number(r.total) > 0 ? (Number(r.discapacidad) / Number(r.total) * 100) : 0
        }));

        // Map 6: Efficiency
        const [m6] = await db.query(`
            SELECT 
                e.nombre AS entidad,
                SUM(o.nuevo_ingreso_total) AS admision,
                SUM(o.titulados_total) AS titulados
            FROM ofertas o
            JOIN escuelas esc ON o.id_escuela = esc.id_escuela
            JOIN municipios m ON esc.id_municipio = m.id_municipio
            JOIN entidades e ON m.id_entidad = e.id_entidad
            GROUP BY e.nombre
        `);
        OUTPUT.map_efficiency = m6.map(r => ({
            ...r,
            ratio: Number(r.admision) > 0 ? (Number(r.titulados) / Number(r.admision) * 100) : 0
        }));

        // V5: Edad por genero
        const [v5] = await db.query(`
            SELECT 
                m.nombre AS modalidad,
                ee.edad,
                SUM(ee.mujeres) AS mujeres,
                SUM(ee.hombres) AS hombres
            FROM estadisticas_edad ee
            JOIN ofertas o ON ee.id_oferta = o.id_oferta
            JOIN modalidades m ON o.id_modalidad = m.id_modalidad
            WHERE ee.tipo = 'matricula'
            GROUP BY m.nombre, ee.edad
        `);
        OUTPUT.v5_edad = v5;

        // V6: Flujo
        const [v6] = await db.query(`
            SELECT 
                SUM(ei.solicitudes_total) AS solicitudes,
                SUM(o.nuevo_ingreso_total) AS admitidos,
                SUM(o.matricula_total) AS matricula,
                SUM(o.egresados_total) AS egresados,
                SUM(o.titulados_total) AS titulados
            FROM ofertas o
            JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta
            WHERE o.matricula_total > 0
        `);
        OUTPUT.v6_flujo = v6[0];

        // V7: Inclusion por entidad
        const [v7] = await db.query(`
            SELECT 
                e.nombre AS entidad,
                SUM(COALESCE(ei.matricula_li_m,0) + COALESCE(ei.matricula_li_h,0)) AS lenguas_indigenas,
                SUM(COALESCE(ei.matricula_disc_m,0) + COALESCE(ei.matricula_disc_h,0)) AS discapacidad,
                SUM(o.matricula_total) AS matricula_total
            FROM ofertas o
            JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta
            JOIN escuelas esc ON o.id_escuela = esc.id_escuela
            JOIN municipios m ON esc.id_municipio = m.id_municipio
            JOIN entidades e ON m.id_entidad = e.id_entidad
            GROUP BY e.nombre
        `);
        // We will create the Treemap on the frontend
        OUTPUT.v7_inclusion = v7.map(r => ({
            ...r,
            pct_inclusion: r.matricula_total > 0 ? ((Number(r.lenguas_indigenas) + Number(r.discapacidad)) / Number(r.matricula_total) * 100) : 0
        }));

        const outPath = path.join(__dirname, 'public', 'observatorio_data.json');
        fs.writeFileSync(outPath, JSON.stringify(OUTPUT, null, 2));
        console.log('✅ JSON generado en ' + outPath);
        
    } catch(err) {
        console.error(err);
    } finally {
        if(db) db.end();
    }
}

generate();
