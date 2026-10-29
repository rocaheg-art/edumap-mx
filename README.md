<div align="center">

# 🎓 EduMap México
### Plataforma de Inteligencia Geoespacial y Observatorio Estadístico de Educación Superior en México

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js_&_Express-5.1-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL_&_Aiven-Cloud_DB-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://aiven.io/)
[![Leaflet](https://img.shields.io/badge/Leaflet_Maps-1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)

<p align="center">
  <b>Explora más de 4,000 instituciones y 14,000 programas académicos en los 32 estados de la República Mexicana con datos oficiales ANUIES.</b>
</p>

</div>

---

## 🌟 Descripción General

**EduMap México** es una plataforma web interactiva diseñada para transformar los datos estadísticos del sistema de educación superior en México (**ANUIES**) en una herramienta visual de toma de decisiones tanto para **estudiantes**, **investigadores** e **instituciones educativas**.

Integra cartografía interactiva, filtrado facetado inteligente, comparadores multidimensionales de universidades y un **Observatorio Estadístico Nacional** que revela brechas de género, presión de demanda (IPD), demografía estudiantil, eficiencia terminal e inclusión académica.

---

## 🚀 Módulos Principales

### 1. 🗺️ Explorador Geoespacial Inteligente (`Home`)
- **Interfaz Protagonista con Transición 3D:** Tarjeta principal de búsqueda con autocompletado en tiempo real para carreras e instituciones que gira en 3D hacia el mapa interactivo a pantalla completa.
- **Filtrado Facetado Dinámico:** Los filtros de **Estado**, **Municipio**, **Nivel Educativo** y **Sostenimiento (Público/Privado)** se adaptan automáticamente a los resultados reales de la búsqueda activa (ocultando estados o municipios sin oferta y seleccionando automáticamente la entidad cuando la búsqueda pertenece a una sola región).
- **Clustering & Capas Geográficas:** Agrupación automática de planteles (`MarkerClusterGroup`), resaltado de límites estatales vía GeoJSON y fichas rápidas de campus con su oferta académica.

### 2. 🔎 Directorio de Oferta Educativa (`Oferta Educativa`)
- Catálogo nacional de programas de nivel **TSU, Licenciatura, Especialidad, Maestría y Doctorado**.
- **Indicadores Clave por Carrera:**
  - **IPD (Índice de Presión de Demanda / Probabilidad de Ingreso):** Relación entre solicitudes de nuevo ingreso y lugares/admitidos.
  - **Nuevos Ingresos y Matrícula Activa.**
  - **Diferenciadores visuales** inmediatos entre sostenimiento público y privado, campus específico y enlace directo a la institución.
- **Ordenamiento Avanzado:** Ordena programas por probabilidad de ingreso (menor a mayor / mayor a menor) y volumen de nuevo ingreso.
- **Modal de Detalle Profundo:** Incluye distribución demográfica por rango de edad (`estadisticas_edad`), indicadores de inclusión (`estadisticas_inclusion`) y perfil curricular.

### 3. 🏛️ Perfiles de Instituciones (`Instituciones`)
- Tarjetas y perfiles completos por universidad con métricas agregadas:
  - Total de campus/escuelas, carreras ofertadas, matrícula total e IPD promedio institucional.
- Mapa multicampus, galería institucional, convocatorias activas y sistema de reseñas/calificaciones estudiantiles.

### 4. 📊 Observatorio Estadístico Nacional (`Observatorio`)
Sección de inteligencia de datos e historias visuales (*Data Storytelling*) alimentada por estadísticas oficiales ANUIES:
1. **KPIs Nacionales Animados:** Matrícula nacional, instituciones activas, programas registrados, cobertura en los 32 estados y paridad de género.
2. **Mapa Multicapa del Observatorio:** Capas interactivas de densidad de matrícula, brecha de género regional, distribución público vs. privado, eficiencia terminal e inclusión.
3. **Brecha de Género por Campo Amplio (Butterfly Chart):** Comparativa de presencia femenina y masculina en las 10 grandes áreas del conocimiento con desglose por campo específico.
4. **Sostenimiento Público vs. Privado por Entidad:** Análisis del peso del sector público y privado tanto en número de instituciones como en matrícula atendida.
5. **Índice de Dificultad y Selectividad:** Scatter plot y ranking de los programas con mayor presión de demanda (`solicitudes / nuevo ingreso`).
6. **Pirámide Demográfica por Edad y Modalidad:** Espejo poblacional desde $\le 17$ hasta $40+$ años, contrastando modalidades escolarizadas frente a no escolarizadas/mixtas.
7. **Embudo de Trayectoria Académica (Funnel):** Flujo completo desde `Solicitudes` $\rightarrow$ `Nuevo Ingreso` $\rightarrow$ `Matrícula` $\rightarrow$ `Egresados` $\rightarrow$ `Titulados`.
8. **Atlas de Inclusión:** Presencia de hablantes de lenguas indígenas y estudiantes con discapacidad por entidad federativa.

### 5. ⚖️ Comparador de Universidades (`Comparador`)
- Comparación lado a lado de múltiples instituciones mediante gráficos radiales (`RadarChart`) y tablas comparativas de matrícula, selectividad, eficiencia terminal y oferta académica.

---

## 🛠️ Arquitectura y Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, React Router (`HashRouter`), Framer Motion |
| **Estilos & UI** | Tailwind CSS v4, Lucide Icons, Diseño basado en tarjetas (*Card-Driven UI*) |
| **Visualización & Mapas** | Recharts, Chart.js, Leaflet, React-Leaflet, Leaflet.heat, MarkerCluster |
| **Backend** | Node.js, Express 5, API RESTful + Servidor híbrido con Vite Middleware |
| **Base de Datos** | MySQL (`mysql2/promise`) con arquitectura híbrida **Local + Aiven Cloud (SSL)** |
| **Despliegue** | Render (Web Service) + Aiven (Managed MySQL Database) |

---

## 🗄️ Estructura Principal de la Base de Datos

El modelo relacional normalizado está compuesto por:
- **Catálogos Geográficos e Institucionales:** `entidades`, `municipios`, `sostenimientos`, `subsistemas`, `tipos_institucion`, `niveles`, `modalidades`.
- **Taxonomía Académica (CMPE):** `campos_amplios` $\rightarrow$ `campos_especificos` $\rightarrow$ `campos_detallados` $\rightarrow$ `carreras`.
- **Entidades Nucleares:**
  - `instituciones`: Datos generales de cada IES.
  - `escuelas`: Campus o unidades académicas georreferenciadas (`latitud`, `longitud`, `id_municipio`).
  - `ofertas`: Programas impartidos por escuela con métricas de `matricula_total`, `nuevo_ingreso_total`, `egresados_total`, `titulados_total` e `ici`.
- **Tablas Analíticas y Demográficas:**
  - `estadisticas_inclusion`: Solicitudes de ingreso, hablantes de lenguas indígenas y alumnos con discapacidad.
  - `estadisticas_edad`: Desglose por rango de edad (`17 y menores` a `40+`), sexo y tipo (`matricula`, `nuevo_ingreso`).
- **Interacción:** `reviews`, `convocatorias`, `galeria_imagenes`, `estudiantes`, `intereses`.

---

## ⚙️ Instalación y Ejecución Local

### 1. Prerrequisitos
- **Node.js** v18+ (recomendado v20+)
- **MySQL** local corriendo en el puerto `3306` (o credenciales de instancia en **Aiven**)

### 2. Clonar e instalar dependencias
```bash
git clone https://github.com/rocaheg-art/edumap-mx.git
cd edumap-mx
npm install
```

### 3. Configurar Variables de Entorno (Opcional para Nube / Aiven)
El servidor cuenta con **configuración híbrida automática** en `server.js`:
- Si **no** defines variables de entorno, se conecta automáticamente a tu MySQL local (`localhost:3306`, base de datos `edumap_mx`).
- Para producción o conexión a **Aiven**, crea un archivo `.env` en la raíz:

```env
PORT=3000
DB_HOST=tu-instancia.aivencloud.com
DB_PORT=12345
DB_USER=avnadmin
DB_PASSWORD=tu_password
DB_NAME=edumap_mx
```

### 4. Iniciar la aplicación
```bash
npm run dev
```
La aplicación estará disponible en: **`http://localhost:3000`**

### 5. Regenerar el dataset precalculado del Observatorio (Opcional)
Para actualizar el archivo `public/observatorio_data.json` a partir de la base de datos SQL:
```bash
node generate_observatorio_json.js
```

---

## 📦 Despliegue en Nube (GitHub + Render + Aiven)

El repositorio incluye el script automatizado `./actualizar.sh` que limpia artefactos temporales (`dist`, cachés), protege archivos pesados mediante `.gitignore` y sincroniza los cambios con `origin/main` en GitHub para activar el despliegue continuo en **Render**.

---

<div align="center">
  <sub>Desarrollado para la visualización y democratización de datos de Educación Superior en México 🇲🇽</sub>
</div>
