CREATE DATABASE IF NOT EXISTS edumap_mx;
USE edumap_mx;
-- ============================================================
--  EduMap MX — Esquema SQL Normalizado
--  Fuente: Datos ANUIES + enriquecimiento por scraping
-- ============================================================

-- -----------------------------------------------
-- 1. CATÁLOGOS (tablas de referencia)
-- -----------------------------------------------

CREATE TABLE entidades (
    id_entidad      INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,   -- "Querétaro"
    clave_inegi     CHAR(2)                  -- "22"
);

CREATE TABLE municipios (
    id_municipio    INT AUTO_INCREMENT PRIMARY KEY,
    id_entidad      INT NOT NULL,
    nombre          VARCHAR(100) NOT NULL,
    clave_inegi     CHAR(5),
    FOREIGN KEY (id_entidad) REFERENCES entidades(id_entidad)
);

CREATE TABLE sostenimientos (
    id_sostenimiento    INT AUTO_INCREMENT PRIMARY KEY,
    nombre              VARCHAR(50) NOT NULL  -- "Público", "Privado", "Autónomo"
);

CREATE TABLE subsistemas (
    id_subsistema   INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,    -- "Universidades Públicas Estatales"
    clave_anuies    VARCHAR(20)
);

CREATE TABLE niveles (
    id_nivel    INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(80) NOT NULL,         -- "Licenciatura", "Maestría", "Doctorado", "TSU"
    clave       VARCHAR(20)
);

CREATE TABLE tipos_institucion (
    id_tipo     INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(50) NOT NULL          -- "Pública", "Privada"
);

-- Campos de formación (jerarquía UNESCO CINE)
CREATE TABLE campos_amplios (
    id_campo_amplio     INT AUTO_INCREMENT PRIMARY KEY,
    nombre              VARCHAR(150) NOT NULL  -- "Ingeniería, manufactura y construcción"
);

CREATE TABLE campos_especificos (
    id_campo_especifico INT AUTO_INCREMENT PRIMARY KEY,
    id_campo_amplio     INT NOT NULL,
    nombre              VARCHAR(150) NOT NULL,
    FOREIGN KEY (id_campo_amplio) REFERENCES campos_amplios(id_campo_amplio)
);

CREATE TABLE campos_detallados (
    id_campo_detallado  INT AUTO_INCREMENT PRIMARY KEY,
    id_campo_especifico INT NOT NULL,
    nombre              VARCHAR(150) NOT NULL,
    FOREIGN KEY (id_campo_especifico) REFERENCES campos_especificos(id_campo_especifico)
);

CREATE TABLE modalidades (
    id_modalidad    INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(80) NOT NULL      -- "Escolarizada", "En Línea", "Mixta"
);

CREATE TABLE IF NOT EXISTS campos_formacion (
    id_campo_formacion INT AUTO_INCREMENT PRIMARY KEY,
    nombre             VARCHAR(150) NOT NULL
);

-- -----------------------------------------------
-- 2. INSTITUCIONES
-- -----------------------------------------------

CREATE TABLE instituciones (
    id_institucion      INT AUTO_INCREMENT PRIMARY KEY,
    nombre              VARCHAR(200) NOT NULL,
    siglas              VARCHAR(30),
    id_tipo             INT,
    id_sostenimiento    INT,
    id_subsistema       INT,
    -- Contacto y web (scraping)
    sitio_web           VARCHAR(255),
    telefono            VARCHAR(30),
    correo              VARCHAR(150),
    -- Imágenes (scraping / manual)
    logo_url            VARCHAR(500),
    banner_url          VARCHAR(500),
    -- Estética en mapa
    color_hex           VARCHAR(20) DEFAULT 'bg-slate-600',
    -- Auth admin
    usuario_admin       VARCHAR(80) UNIQUE,
    password_admin      VARCHAR(255),         -- bcrypt hash
    -- Metadatos
    descripcion         TEXT,
    fecha_fundacion     YEAR,
    FOREIGN KEY (id_tipo)            REFERENCES tipos_institucion(id_tipo),
    FOREIGN KEY (id_sostenimiento)   REFERENCES sostenimientos(id_sostenimiento),
    FOREIGN KEY (id_subsistema)      REFERENCES subsistemas(id_subsistema)
);

-- -----------------------------------------------
-- 3. CAMPUS / ESCUELAS
-- -----------------------------------------------

CREATE TABLE escuelas (
    id_escuela          INT AUTO_INCREMENT PRIMARY KEY,
    id_institucion      INT NOT NULL,
    id_municipio        INT,
    nombre              VARCHAR(200) NOT NULL,  -- nombre del campus/plantel
    nombre_anuies       VARCHAR(200),           -- nombre exacto en CSV ANUIES
    direccion           VARCHAR(300),
    latitud             DECIMAL(10, 7),
    longitud            DECIMAL(10, 7),
    logo_url            VARCHAR(500),
    banner_url          VARCHAR(500),
    FOREIGN KEY (id_institucion) REFERENCES instituciones(id_institucion),
    FOREIGN KEY (id_municipio)   REFERENCES municipios(id_municipio)
);

-- -----------------------------------------------
-- 4. CARRERAS (catálogo único, sin duplicados)
-- -----------------------------------------------

CREATE TABLE carreras (
    id_carrera          INT AUTO_INCREMENT PRIMARY KEY,
    nombre              VARCHAR(250) NOT NULL,
    nombre_normalizado  VARCHAR(250),           -- lowercase sin acentos para búsqueda
    clave_programa      VARCHAR(30),
    id_campo_detallado  INT,
    FOREIGN KEY (id_campo_detallado) REFERENCES campos_detallados(id_campo_detallado)
);

-- -----------------------------------------------
-- 5. OFERTA EDUCATIVA
--    Une institución + escuela + carrera + nivel + modalidad
-- -----------------------------------------------

CREATE TABLE ofertas (
    id_oferta           INT AUTO_INCREMENT PRIMARY KEY,
    id_escuela          INT NOT NULL,
    id_institucion      INT NOT NULL,
    id_carrera          INT NOT NULL,
    id_nivel            INT NOT NULL,
    id_modalidad        INT,
    duracion            VARCHAR(50),            -- "4 años", "8 semestres"
    -- Estadísticas ANUIES (agregado anual)
    anio_ciclo          YEAR,
    matricula_total     INT DEFAULT 0,
    matricula_mujeres   INT DEFAULT 0,
    matricula_hombres   INT DEFAULT 0,
    nuevo_ingreso_total INT DEFAULT 0,
    egresados_total     INT DEFAULT 0,
    titulados_total     INT DEFAULT 0,
    lugares_ofertados   INT DEFAULT 0,
    ici                 DECIMAL(5, 2) DEFAULT 0,
    eficiencia_terminal DECIMAL(5, 2) DEFAULT 0,
    tasa_egreso         DECIMAL(5, 2) DEFAULT 0,
    FOREIGN KEY (id_escuela)      REFERENCES escuelas(id_escuela),
    FOREIGN KEY (id_institucion)  REFERENCES instituciones(id_institucion),
    FOREIGN KEY (id_carrera)      REFERENCES carreras(id_carrera),
    FOREIGN KEY (id_nivel)        REFERENCES niveles(id_nivel),
    FOREIGN KEY (id_modalidad)    REFERENCES modalidades(id_modalidad)
);

-- -----------------------------------------------
-- 6. DETALLES DE OFERTA (contenido enriquecido)
--    Llenado manual / scraping de sitios institucionales
-- -----------------------------------------------

CREATE TABLE detalles_oferta (
    id_detalle          INT AUTO_INCREMENT PRIMARY KEY,
    id_oferta           INT NOT NULL UNIQUE,
    mapa_curricular_url VARCHAR(500),
    perfil_ingreso      TEXT,
    perfil_egreso       TEXT,
    campo_laboral       TEXT,
    habilidades         TEXT,               -- CSV: "Liderazgo, Programación, Análisis"
    FOREIGN KEY (id_oferta) REFERENCES ofertas(id_oferta)
);

-- -----------------------------------------------
-- 7. ESTADÍSTICAS DEMOGRÁFICAS ANUIES
--    Tabla separada para no ensuciar ofertas
-- -----------------------------------------------

CREATE TABLE estadisticas_edad (
    id_estadistica      INT AUTO_INCREMENT PRIMARY KEY,
    id_oferta           INT NOT NULL,
    anio_ciclo          YEAR,
    rango_edad          VARCHAR(20),        -- "18", "19", "20-21", "30-34", "40+"
    matricula_mujeres   INT DEFAULT 0,
    matricula_hombres   INT DEFAULT 0,
    nuevo_ingreso_m     INT DEFAULT 0,
    nuevo_ingreso_h     INT DEFAULT 0,
    FOREIGN KEY (id_oferta) REFERENCES ofertas(id_oferta)
);

CREATE TABLE estadisticas_inclusion (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    id_oferta           INT NOT NULL,
    anio_ciclo          YEAR,
    -- Lenguas indígenas
    matricula_li_m      INT DEFAULT 0,
    matricula_li_h      INT DEFAULT 0,
    ni_li_total         INT DEFAULT 0,      -- nuevo ingreso lenguas indígenas
    egresados_li        INT DEFAULT 0,
    titulados_li        INT DEFAULT 0,
    -- Discapacidad
    matricula_disc_m    INT DEFAULT 0,
    matricula_disc_h    INT DEFAULT 0,
    ni_disc_total       INT DEFAULT 0,
    egresados_disc      INT DEFAULT 0,
    titulados_disc      INT DEFAULT 0,
    -- Solicitudes
    solicitudes_m       INT DEFAULT 0,
    solicitudes_h       INT DEFAULT 0,
    solicitudes_total   INT DEFAULT 0,
    FOREIGN KEY (id_oferta) REFERENCES ofertas(id_oferta)
);

-- -----------------------------------------------
-- 8. CONTENIDO SOCIAL
-- -----------------------------------------------

CREATE TABLE reviews (
    id_review           INT AUTO_INCREMENT PRIMARY KEY,
    id_institucion      INT NOT NULL,
    nombre_usuario      VARCHAR(100),
    calificacion        TINYINT CHECK (calificacion BETWEEN 1 AND 5),
    comentario          TEXT,
    fecha               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_institucion) REFERENCES instituciones(id_institucion)
);

CREATE TABLE convocatorias (
    id_convocatoria     INT AUTO_INCREMENT PRIMARY KEY,
    id_institucion      INT NOT NULL,
    titulo              VARCHAR(250) NOT NULL,
    contenido           TEXT,
    imagen_url          VARCHAR(500),
    fecha               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_institucion) REFERENCES instituciones(id_institucion)
);

CREATE TABLE galeria_imagenes (
    id_imagen           INT AUTO_INCREMENT PRIMARY KEY,
    id_institucion      INT NOT NULL,
    imagen_url          VARCHAR(500) NOT NULL,
    descripcion         VARCHAR(300),
    orden               TINYINT DEFAULT 0,
    FOREIGN KEY (id_institucion) REFERENCES instituciones(id_institucion)
);

-- -----------------------------------------------
-- 9. USUARIOS
-- -----------------------------------------------

CREATE TABLE estudiantes (
    id_estudiante   INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    apellido        VARCHAR(100),
    email           VARCHAR(150) UNIQUE NOT NULL,
    password        VARCHAR(255) NOT NULL,   -- bcrypt hash
    telefono        VARCHAR(20),
    avatar_url      VARCHAR(500),
    fecha_registro  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE intereses (
    id_interes      INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante   INT NOT NULL,
    id_institucion  INT NOT NULL,
    fecha           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_interes (id_estudiante, id_institucion),
    FOREIGN KEY (id_estudiante)  REFERENCES estudiantes(id_estudiante),
    FOREIGN KEY (id_institucion) REFERENCES instituciones(id_institucion)
);

-- -----------------------------------------------
-- 10. INFO CARRERAS (showcase / marketing)
-- -----------------------------------------------

CREATE TABLE info_carreras (
    id_info             INT AUTO_INCREMENT PRIMARY KEY,
    titulo_marketing    VARCHAR(200),
    descripcion_breve   TEXT,
    imagen_url          VARCHAR(500),
    palabra_clave       VARCHAR(100)        -- "Ingeniería", "Derecho", "Medicina"
);

-- -----------------------------------------------
-- ÍNDICES útiles para rendimiento
-- -----------------------------------------------

CREATE INDEX idx_ofertas_inst     ON ofertas(id_institucion);
CREATE INDEX idx_ofertas_escuela  ON ofertas(id_escuela);
CREATE INDEX idx_ofertas_carrera  ON ofertas(id_carrera);
CREATE INDEX idx_escuelas_inst    ON escuelas(id_institucion);
CREATE INDEX idx_escuelas_mun     ON escuelas(id_municipio);
CREATE INDEX idx_carreras_nombre  ON carreras(nombre_normalizado);

-- -----------------------------------------------
-- 11. VISTAS (para reportes y dashboards)
-- -----------------------------------------------

DROP VIEW IF EXISTS resumen_instituciones;
CREATE VIEW resumen_instituciones AS
SELECT 
    i.id_institucion, i.nombre, i.siglas, i.id_sostenimiento, i.id_subsistema, i.logo_url, i.color_hex,
    s.nombre as sostenimiento, sub.nombre as subsistema,
    mun.id_entidad as id_entidad, e.id_municipio as id_municipio,
    COUNT(DISTINCT e.id_escuela) as total_campus,
    COUNT(DISTINCT o.id_carrera) as total_carreras,
    COALESCE(SUM(o.matricula_total), 0) as matricula_total,
    COALESCE(SUM(o.egresados_total), 0) as egresados_total,
    COALESCE(SUM(o.titulados_total), 0) as titulados_total,
    COALESCE(AVG(o.ici), 0) as ici_promedio,
    COALESCE(AVG(o.eficiencia_terminal), 0) as eficiencia_promedio,
    COALESCE(AVG(r.calificacion), 0) as promedio_calificacion,
    COUNT(DISTINCT r.id_review) as total_reviews,
    CASE 
        WHEN COALESCE(SUM(o.matricula_total), 0) > 0 THEN (SUM(o.matricula_mujeres) / SUM(o.matricula_total)) * 100
        ELSE 0
    END as porcentaje_mujeres,
    CASE
        WHEN COALESCE(AVG(o.ici), 0) > 80 THEN 'Alta'
        WHEN COALESCE(AVG(o.ici), 0) > 60 THEN 'Media'
        ELSE 'Baja'
    END as competitividad_predominante
FROM instituciones i
LEFT JOIN sostenimientos s ON i.id_sostenimiento = s.id_sostenimiento
LEFT JOIN subsistemas sub ON i.id_subsistema = sub.id_subsistema
LEFT JOIN escuelas e ON i.id_institucion = e.id_institucion
LEFT JOIN municipios mun ON e.id_municipio = mun.id_municipio
LEFT JOIN ofertas o ON i.id_institucion = o.id_institucion
LEFT JOIN reviews r ON i.id_institucion = r.id_institucion
GROUP BY i.id_institucion, mun.id_entidad, e.id_municipio;

DROP VIEW IF EXISTS resumen_ofertas;
CREATE VIEW resumen_ofertas AS
SELECT 
    o.*, i.nombre as inst_nombre, i.siglas, i.logo_url, i.color_hex,
    e.nombre as escuela_nombre, e.latitud, e.longitud, mun.id_entidad as id_entidad, e.id_municipio as id_municipio,
    c.nombre as carrera_nombre, c.id_campo_detallado, n.nombre as nivel_nombre,
    m.nombre as modalidad_nombre, mun.nombre as municipio_nombre,
    s.nombre as sostenimiento_nombre,
    ei.solicitudes_total,
    ic.titulo_marketing, ic.descripcion_breve, ic.imagen_url
FROM ofertas o
JOIN instituciones i ON o.id_institucion = i.id_institucion
LEFT JOIN sostenimientos s ON i.id_sostenimiento = s.id_sostenimiento
JOIN escuelas e ON o.id_escuela = e.id_escuela
JOIN municipios mun ON e.id_municipio = mun.id_municipio
JOIN carreras c ON o.id_carrera = c.id_carrera
JOIN niveles n ON o.id_nivel = n.id_nivel
LEFT JOIN modalidades m ON o.id_modalidad = m.id_modalidad
LEFT JOIN estadisticas_inclusion ei ON o.id_oferta = ei.id_oferta
LEFT JOIN info_carreras ic ON c.nombre LIKE CONCAT('%', ic.palabra_clave, '%');
