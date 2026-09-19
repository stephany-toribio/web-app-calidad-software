# Web App Empleo - Frontend

![Angular](https://img.shields.io/badge/Angular-19.2.0-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

Frontend oficial para el Portal de Empleos (CREO ). Esta aplicación está diseñada para conectar talentos con empresas a través de una interfaz moderna, rápida y escalable.

## Características Principales

La aplicación cubre múltiples módulos orientados tanto a usuarios como a reclutadores:

- **Interfaz de Candidatos:** Búsqueda, visualización y postulación a ofertas laborales.
- **Interfaz de Empresas:** Publicación de empleos y gestión del perfil corporativo.
- **Kanban de Postulantes:** Gestión ágil e intuitiva de candidatos en distintas fases del proceso de selección.
- **Dashboard Interactivo:** Panel de control con métricas clave para usuarios y empresas.
- **Integración API REST:** Consumo eficiente de servicios backend para sincronización en tiempo real.

## Tecnologías Utilizadas

- **Framework:** Angular 19
- **Estilos:** Tailwind CSS 4 + PostCSS
- **Lenguaje:** TypeScript 
- **Programación Reactiva:** RxJS

## Requisitos Previos

Asegúrate de tener instalado en tu entorno local:
- [Node.js](https://nodejs.org/) (Versión 22.x recomendada)
- [Angular CLI](https://angular.io/cli) versión 19 o superior (npm install -g @angular/cli)

## Instalación y Ejecución

Sigue estos pasos para levantar el entorno de desarrollo local:

1. **Clona el repositorio:**

    git clone https://github.com/JH-Compan/web-app-empleo/edit/develop
   
    cd Frontend

3. **Instala las dependencias:**

    npm install

4. **Inicia el servidor de desarrollo:**

    npm run start

*La aplicación estará disponible en http://localhost:4200/*

## Flujo de Trabajo y Ramas

Seguimos una estrategia de ramas estructurada para asegurar la estabilidad del proyecto:

### Ramas Principales
- `main` : Código estable y listo para producción.
- `develop` : Código de integración de las nuevas funcionalidades.

### Ramas de Desarrollo
- `feature/*` : Para nuevas funcionalidades (ej. feature/dashboard-empresas).
- `bugfix/*` : Para corrección de errores (ej. bugfix/login-error).
