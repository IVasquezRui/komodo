# ROL Y OBJETIVO
Actúa como Senior React / Next.js & UI Architecture Engineer. Tu tarea es instalar, limpiar de código demo y adaptar a producción únicamente los **Componentes 2 (`Sidebar`) y 3 (`Signup Form`)** de **Aceternity UI** vía `shadcn` en la plataforma Web de **Komodo**, alineándolos completamente con la paleta de colores de marca y las reglas anti-overflow de botones.

**Alcance estricto:** NO instales ni implementes `multi-step-loader` en esta tarea (se conectará en la fase de confirmación de pago).

# REQUISITOS PREVIOS E INSTALACIÓN (PLATAFORMA WEB)
Antes de instalar, verifica en el directorio Web la presencia y versiones compatibles de `components.json`, Tailwind CSS, `motion/react`, `@tabler/icons-react`, `clsx` y `tailwind-merge`. Luego ejecuta únicamente:

1. `npx shadcn@latest add @aceternity/sidebar`
2. `npx shadcn@latest add @aceternity/signup-form-demo`

*(Revisa los diffs para no sobrescribir utilidades ni componentes base existentes en `components/ui/`).*

---

# COMPONENTE 2: SIDEBAR DE NAVEGACIÓN PRINCIPAL (`KomodoSidebar`)
- **Ubicación:** `components/layout/KomodoSidebar.tsx` (consumiendo `Sidebar`, `SidebarBody` y `SidebarLink` desde `components/ui/sidebar`).
- **Directiva `"use client"`:** Obligatoria en los archivos interactivos para evitar errores de hidratación.
- **Limpieza obligatoria de demo:**
  - Elimina `"Acet Labs"`, el avatar hardcoded de `"Manu Arora"`, el componente dummy `<Dashboard />` con bloques `animate-pulse` y el contenedor fijo `h-[60vh]`.
- **Implementación para Komodo:**
  - Integra el sidebar en el **layout shell real** a pantalla completa (`min-h-screen` / `h-screen`) envolviendo `{children}` de las vistas principales.
  - Reemplaza `Logo` y `LogoIcon` por el isotipo y logotipo de **Komodo** usando el **Morado/Índigo de marca**.
  - Conecta enlaces reales del router de la aplicación (prohibido dejar `href="#"`) usando íconos de `@tabler/icons-react`:
    - **Explorar Viajes** (búsqueda de rutas y líneas)
    - **Mis Viajes** (boletos comprados y descarga de PDF)
    - **Terminales de Venezuela** (directorio/mapa de terminales)
    - **Mi Perfil**
    - **Configuración**
    - **Cerrar Sesión** (conectado al cierre real de sesión y limpieza de caché local sensible)
  - Resalta visualmente la ruta activa con la paleta **Komodo** (morado + acento esmeralda) y asegura que ninguna etiqueta se desborde al expandir/colapsar el sidebar.
  - En el pie del sidebar, muestra los datos del **usuario autenticado real** (nombre + avatar o iniciales sobre badge morado); si navega como invitado, muestra un acceso limpio a `"Iniciar sesión"`.

---

# COMPONENTE 3: FORMULARIO DE REGISTRO (`KomodoSignupForm`)
- **Ubicación:** `components/auth/KomodoSignupForm.tsx` (adoptando `Label`, `Input`, `LabelInputContainer` y `BottomGradient` del patrón de `signup-form-demo`).
- **Limpieza obligatoria de demo:**
  - Elimina por completo `"Welcome to Aceternity"`, `"Tyler Durden"`, `"projectmayhem@fc.com"`, el campo falso `"twitterpassword"` y **elimina completamente el botón de `OnlyFans`**.
- **Implementación para Komodo (contexto Venezuela):**
  - Copy en español claro y directo: título `"Crea tu cuenta en Komodo"` y subtítulo breve orientado a la compra rápida de pasajes de autobús en Venezuela.
  - Campos reales con validación tipada (usando `zod` o el validador ya instalado en el repo):
    - **Nombre** y **Apellido** (grid responsivo: 2 columnas en desktop, 1 en pantallas pequeñas).
    - **Cédula de Identidad / Documento** con selector de prefijo (`V-`, `E-`, `P-`) y validación numérica (requisito real para emitir boletos terrestres en Venezuela).
    - **Teléfono (WhatsApp / Pago Móvil)** con formato venezolano (`+58 412/414/416/424/426-...`).
    - **Correo Electrónico**.
    - **Contraseña** y **Confirmar Contraseña** (con toggle de visibilidad y reglas mínimas de seguridad).
  - **Botón principal de envío:** Estilizado con gradiente de marca **Komodo**, `BottomGradient` en violeta/esmeralda/cian, estado `loading` con texto seguro anti-overflow y prevención de doble envío (compatible con idempotencia).
  - **Conexión Backend / Offline:** Conecta el submit al endpoint real de registro en **FastAPI Core** (puerto `8000`). Si aún no existe el endpoint, crea el cliente tipado + contrato de request/response y deja un manejador mock explícitamente marcado con `TODO(auth-api)` + manejo claro si el usuario está offline.
  - **Sección OAuth inferior:** Mantén únicamente proveedores legítimos planificados (ej. `"Continuar con Google"`) solo si tienen flujo configurado; de lo contrario, omite botones OAuth muertos y deja únicamente el enlace funcional `"¿Ya tienes cuenta? Inicia sesión"`.