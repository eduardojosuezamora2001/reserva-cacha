# AGENTS.md — Sistema de Reservas de Canchas de Fútbol

Guía de referencia para cualquier agente (o desarrollador) que trabaje en este proyecto. Describe el dominio, los roles, las reglas de negocio y las convenciones técnicas que deben respetarse al generar o modificar código.

> Stack base: proyecto ya inicializado con **shadcn/ui**. Cualquier componente nuevo debe reutilizar los componentes de `components/ui` existentes antes de crear otros nuevos.
>
> **Importante — sin backend real**: este proyecto es un **prototipo/demo sin backend**. No hay servidor de API, base de datos real ni autenticación real contra un servidor. Todo el "backend" se simula en el propio frontend usando un archivo **`db.json`** como fuente de datos, tal como se detalla en la sección 7.1.

---

## 1. Resumen del producto

Plataforma web para reservar canchas de fútbol. Existen dos roles principales:

- **Admin**: gestiona canchas y reservas.
- **Cliente**: consulta disponibilidad y reserva canchas (con o sin cuenta).

---

## 2. Roles y permisos

| Acción | Visitante (sin cuenta) | Cliente (con cuenta) | Admin |
|---|---|---|---|
| Ver listado de canchas | ✅ | ✅ | ✅ |
| Ver disponibilidad/horarios ocupados de una cancha | ✅ | ✅ | ✅ |
| Reservar una cancha | ❌ (debe llenar formulario de solicitud) | ✅ (reserva directa) | ✅ |
| Ver sus propias reservas | ❌ | ✅ | ✅ (todas) |
| Cancelar/modificar cualquier reserva | ❌ | Solo las propias (si se habilita) | ✅ (todas) |
| CRUD de canchas | ❌ | ❌ | ✅ |

### Regla clave de reservas
- **Cliente autenticado** → reserva de forma directa e inmediata (queda como `confirmada`), validando disponibilidad en tiempo real.
- **Visitante sin sesión** → no puede reservar directamente. Debe completar un **formulario de solicitud** con:
  - Nombre
  - Correo electrónico
  - Fecha(s) y hora(s) deseadas
  - Al enviar el formulario, la solicitud queda registrada en estado `pendiente` **y además se envía automáticamente por WhatsApp** (al número del admin/negocio) con los datos capturados (nombre, correo, fecha(s) y hora(s) solicitadas), para que la gestión y confirmación con el cliente se coordine directamente por ese medio.

---

## 3. Funcionalidades por rol

### 3.1 Admin

1. **Panel de administración (CRUD de canchas)**
   - Crear, editar, listar y eliminar (o desactivar) canchas.
   - Al eliminar una cancha con reservas futuras activas, se debe advertir/impedir o forzar cancelación en cascada (definir política antes de implementar delete físico; preferir *soft delete* con campo `activa: boolean`).

2. **Datos de cada cancha**
   - `nombre` (string, requerido)
   - `descripcion` (text, opcional)
   - `ubicacion` (lat/lng + dirección) integrada con **Google Maps** (Places Autocomplete para capturar dirección + mapa embebido para mostrarla)
   - `precioPorHora` (opcional, si aplica)
   - `imagenes` (opcional)
   - `horarioApertura` / `horarioCierre` (para limitar rangos reservables)
   - `activa` (boolean)

3. **Gestión de reservas de clientes**
   - Ver todas las reservas (filtrable por cancha, fecha, estado, cliente).
   - Cancelar una reserva (cambia estado a `cancelada`, libera el horario).
   - Modificar una reserva (cambiar fecha/hora/cancha), validando que el nuevo horario esté disponible.
   - Aprobar/rechazar solicitudes de visitantes sin cuenta.

### 3.2 Cliente

4. **Ver canchas disponibles**
   - Listado público de canchas con nombre, descripción, ubicación en mapa.
   - Detalle de cancha con **calendario/vista de disponibilidad**: para cada día, mostrar bloques ocupados y libres.
     - Ejemplo: *Lunes 15 → ocupado 8:00–11:00 y 14:00–16:00; el resto disponible.*
     - Esto debe ser visible para **cualquier usuario** (sin necesidad de iniciar sesión), pero sin exponer datos personales de quién reservó (solo el bloque de tiempo ocupado).

5. **Reservar una cancha**
   - Seleccionar cancha, fecha, hora de inicio y hora de fin.
   - Validar (en la capa de datos simulada, ver 7.1) que el rango no se solapa con otra reserva existente ni con horario de cierre.
   - Si está autenticado → reserva directa (`confirmada`).
   - Si no está autenticado → formulario de solicitud (`pendiente`) con nombre, correo y fecha(s)/hora(s) solicitadas.

---

## 4. Modelo de datos (sugerido)

```
User
- id
- nombre
- correo (unique)
- passwordHash (si auth propia) / proveedor OAuth
- rol: "admin" | "cliente"
- createdAt

Cancha
- id
- nombre
- descripcion
- direccion (texto formateado por Google Maps)
- lat, lng
- horarioApertura, horarioCierre
- precioPorHora (opcional)
- activa (boolean)
- createdAt / updatedAt

Reserva
- id
- canchaId (FK)
- userId (FK, nullable si es solicitud de visitante)
- nombreSolicitante (si no hay userId)
- correoSolicitante (si no hay userId)
- fecha (date)
- horaInicio (time)
- horaFin (time)
- estado: "pendiente" | "confirmada" | "cancelada" | "rechazada"
- createdAt / updatedAt
```

### Reglas de integridad
- No pueden existir dos reservas `confirmada`/`pendiente` que se solapen en la misma cancha, fecha y rango horario.
- `horaFin` > `horaInicio`.
- El rango solicitado debe estar dentro de `horarioApertura`–`horarioCierre` de la cancha.
- La validación de solapamiento debe hacerse **siempre en la capa de datos simulada** (ver sección 7.1), nunca confiar solo en validaciones de UI, para que el comportamiento sea consistente incluso si más adelante se reemplaza `db.json` por un backend real.

---

## 5. Flujos clave

### 5.1 Verificar disponibilidad
1. Usuario elige cancha y fecha.
2. Se consultan en `db.json` las reservas `confirmada` (y opcionalmente `pendiente`) de esa cancha/fecha.
3. Se renderiza un timeline/franjas horarias marcando ocupado vs libre.

### 5.2 Crear reserva (autenticado)
1. Usuario elige cancha, fecha, hora inicio/fin.
2. Se valida disponibilidad contra los datos actuales en memoria/`db.json`.
3. Se re-valida el solapamiento justo antes de "persistir" el cambio (para minimizar condiciones de carrera dentro de la sesión del navegador).
4. Se crea reserva con estado `confirmada`.

### 5.3 Crear solicitud (visitante)
1. Visitante intenta reservar sin sesión → se muestra formulario (nombre, correo, fecha/hora deseada) en vez del flujo de reserva directa.
2. Se valida disponibilidad igual que en 5.2, pero se crea la reserva en estado `pendiente`.
3. Al guardar la solicitud, el sistema dispara automáticamente un mensaje de **WhatsApp** con los datos del formulario (nombre, correo, cancha, fecha y hora solicitadas) hacia el número configurado del admin/negocio.
4. Admin recibe la solicitud tanto en su panel como por WhatsApp, y puede **aprobar** (pasa a `confirmada`) o **rechazar**; la confirmación final con el cliente puede coordinarse por el mismo chat de WhatsApp.
5. (Opcional) Notificar también por correo al visitante del resultado.

### 5.4 Admin cancela/modifica reserva
1. Admin ve listado de reservas.
2. Cancelar → estado `cancelada`, libera el bloque horario.
3. Modificar → se valida el nuevo horario contra disponibilidad antes de guardar.

---

## 6. Integración con Google Maps

- Usar **Google Places Autocomplete** en el formulario de creación/edición de cancha (admin) para capturar dirección + lat/lng automáticamente.
- Mostrar un **mapa embebido** (marker simple) en la página pública de detalle de cancha.
- Guardar siempre `lat`, `lng` y la dirección formateada, no solo el texto libre.
- Requiere `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (o equivalente) en variables de entorno — **nunca hardcodear la key**.

---

## 6.1 Integración con WhatsApp (solicitudes de visitantes)

- Cuando un visitante sin sesión envía el formulario de solicitud (ver 3.2/5.3), se debe disparar automáticamente un mensaje de WhatsApp con el detalle (nombre, correo, cancha, fecha y hora solicitadas) al número del admin/negocio.
- Como el proyecto **no tiene backend**, esta integración debe simularse también: por ejemplo, generar un **link de `wa.me`** con el mensaje pre-armado (vía `URLSearchParams`) y abrirlo en una nueva pestaña al enviar el formulario, en vez de llamar a la API oficial de WhatsApp (Cloud API/Twilio) desde un servidor que no existe.
- Dejar comentado/documentado en el código dónde iría la integración real (Cloud API o Twilio) si en el futuro se agrega backend.
- Definir una plantilla de mensaje consistente, por ejemplo:
  ```
  Nueva solicitud de reserva
  Cancha: {nombreCancha}
  Cliente: {nombre}
  Correo: {correo}
  Fecha: {fecha}
  Hora: {horaInicio} - {horaFin}
  ```

---

## 7. Convenciones técnicas

- **UI**: **usar componentes de `shadcn/ui` en absolutamente todos los elementos posibles** de la interfaz (botones, inputs, selects, diálogos/modales, tablas, tarjetas, tabs, tooltips, calendarios, dropdowns, sidebar, avatares, badges, skeletons de carga, toasts/sonner para notificaciones, etc.). No crear un componente HTML plano o custom si shadcn ya ofrece un equivalente. Instalar los componentes de shadcn que falten (`npx shadcn add ...`) en vez de reinventarlos.
- **Iconos**: usar **Hugeicons** (`@hugeicons/react`) como librería de íconos en todo el proyecto (sidebar, botones, badges de estado, etc.), en lugar de `lucide-react` u otras librerías. Si algún componente de shadcn trae íconos de `lucide-react` por defecto, reemplazarlos por el equivalente de Hugeicons para mantener consistencia visual en toda la app.
- **Navegación — Sidebar**: el menú principal de la aplicación debe implementarse como un **sidebar** usando el componente `Sidebar` de shadcn/ui (bloque `sidebar-07`).
  - El sidebar debe ser **responsive**: colapsable/expandible en desktop (usando `SidebarProvider`, `SidebarTrigger`, `SidebarRail` de shadcn) y con `Sheet`/drawer en mobile (comportamiento nativo del componente `Sidebar` de shadcn).
  - El contenido del sidebar cambia según el rol:
    - **Admin**: Dashboard, Canchas (CRUD), Reservas/Solicitudes, Configuración (temas/idioma).
    - **Cliente autenticado**: Canchas, Mis reservas, Configuración (temas/idioma).
    - **Visitante**: Canchas (público), Iniciar sesión / Registrarse.
  - Incluir en el sidebar (o en su footer) el `ThemeSwitcher` y el `LanguageSwitcher` (ver secciones 8 y 9), usando `DropdownMenu`/`Select` de shadcn.
  - Usar `Breadcrumb` de shadcn en la parte superior del contenido principal para reforzar la ubicación dentro del sidebar.
- **Formularios**: usar `react-hook-form` + `zod`, envueltos en el componente `Form` de shadcn (patrón estándar `FormField`/`FormItem`/`FormMessage`) para validar tanto el form de reserva autenticada como el de solicitud de visitante.
- **Fechas/horas**: usar el componente `Calendar`/`DatePicker` de shadcn; normalizar todo a un mismo timezone (ej. `America/Costa_Rica`) para evitar bugs de solapamiento por husos horarios.
- **Rutas sugeridas** (todas viven dentro del layout con `Sidebar`, salvo login/registro):
  - `/canchas` — listado público
  - `/canchas/[id]` — detalle + disponibilidad + reservar
  - `/mis-reservas` — reservas del cliente autenticado
  - `/admin/canchas` — CRUD de canchas
  - `/admin/reservas` — gestión de todas las reservas y solicitudes pendientes
- **Autenticación**: como no hay backend, la autenticación también se simula (ver 7.1) contra los usuarios definidos en `db.json`; proteger rutas `/admin/*` por rol `admin` y `/mis-reservas` por sesión activa (simulada), redirigiendo con componentes de shadcn (`Alert`, `Dialog`) cuando falte permiso.
- **Validaciones de negocio**: cada acción de creación/edición de reserva debe re-validar las reglas de negocio (solapamiento, horarios, etc.) en la capa de datos simulada (sección 7.1), sin excepción, aunque el formulario ya haya validado en el cliente.

### 7.1 Persistencia simulada con `db.json` (sin backend)

Este proyecto **no** tiene servidor de API ni base de datos real. Todo el estado se simula así:

- Un archivo **`db.json`** en la raíz o en `/data` actúa como "base de datos" inicial (seed), con la forma:
  ```json
  {
    "users": [],
    "canchas": [],
    "reservas": []
  }
  ```
- Al iniciar la app, el contenido de `db.json` se carga en un store en memoria (ej. usando `zustand`, `useState`/Context, o similar) que vive del lado del cliente.
- Todas las operaciones "CRUD" (crear cancha, reservar, cancelar, aprobar solicitud, etc.) se implementan como funciones que **mutan ese store en memoria**, simulando lo que serían llamadas a una API (misma forma de función, mismo `async/await` con un `delay` artificial opcional para simular latencia de red).
- Para que los cambios **persistan entre recargas de página** dentro de la misma sesión del navegador, sincronizar el store con `localStorage` (leer al montar, escribir en cada mutación). `db.json` actúa solo como **seed/reset inicial**, no como archivo que se reescribe en disco.
- Estructurar el acceso a datos detrás de un módulo `lib/data/*.ts` (ej. `lib/data/canchas.ts`, `lib/data/reservas.ts`) con funciones como `getCanchas()`, `createReserva()`, `cancelarReserva()`, etc., de modo que:
  - Los componentes nunca acceden a `localStorage`/`db.json` directamente.
  - Si en el futuro se agrega un backend real, solo hay que reemplazar la implementación interna de ese módulo (misma interfaz de funciones), sin tocar los componentes de UI.
- Incluir un botón/acción de **"Restablecer datos de ejemplo"** (en configuración o admin) que vuelva a cargar el `db.json` original y limpie `localStorage`, útil para demos.
- Dejar claro en el código (comentarios) que esta capa es una simulación y cuáles serían los equivalentes reales (endpoints REST, tablas de base de datos) si el proyecto evoluciona a tener backend.

---

## 8. Temas de color (Theming)

El proyecto debe soportar **4 temas** seleccionables por el usuario (persistir la elección en `localStorage`). Se implementan como variables CSS (`:root` + clases `.theme-x`), siguiendo el patrón de shadcn/ui (`hsl(var(--primary))`, etc.) para que todos los componentes existentes respondan automáticamente al cambio de tema.

| Tema | Modo | Color primario | Uso / vibe |
|---|---|---|---|
| **Ocean** (default) | Claro | Azul | Tema claro estándar, confiable, fácil de leer |
| **Forest** | Oscuro | Verde | Tema oscuro, buen contraste, descanso visual |
| **Sunset** | Claro | Naranja/ámbar | Alternativa cálida y energética para modo claro |
| **Midnight Violet** | Oscuro | Violeta/púrpura | Alternativa oscura con acento morado, look "premium" |

### Convenciones de implementación
- Definir las variables de shadcn (`--background`, `--foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--accent`, `--border`, `--ring`, etc.) para **cada uno de los 4 temas** en `globals.css`.
- Usar `next-themes` (o el mecanismo ya presente en el proyecto) para manejar el atributo (`class` o `data-theme`) en `<html>`, extendiéndolo para soportar más de 2 valores (no solo `light`/`dark`), por ejemplo: `data-theme="ocean" | "forest" | "sunset" | "midnight-violet"`.
- Agregar un `ThemeSwitcher` (componente `DropdownMenu` o `Select` de shadcn) dentro del sidebar (ver sección 7), con un preview de color por cada opción.
- No hardcodear colores en componentes (`bg-blue-500`, etc.) — usar siempre los tokens semánticos (`bg-primary`, `text-muted-foreground`, etc.) para que el cambio de tema sea automático en toda la app.
- Verificar contraste (WCAG AA mínimo) en los 4 temas, especialmente en los dos oscuros.

---

## 9. Internacionalización (Traducciones)

La app debe soportar múltiples idiomas desde el inicio. Idiomas sugeridos: **Español (default)** e **Inglés**, dejando la estructura lista para agregar más.

### Convenciones de implementación
- Usar una librería estándar de i18n del ecosistema del framework (ej. `next-intl` o `next-i18next` si es Next.js).
- Estructura de archivos de traducción por locale, por ejemplo:
  ```
  /messages
    es.json
    en.json
  ```
- Organizar las claves por dominio/feature, no todo en un solo bloque plano:
  ```json
  {
    "common": { "save": "Guardar", "cancel": "Cancelar" },
    "canchas": { "title": "Canchas", "reserve": "Reservar" },
    "reservas": {
      "status": {
        "pendiente": "Pendiente",
        "confirmada": "Confirmada",
        "cancelada": "Cancelada",
        "rechazada": "Rechazada"
      }
    },
    "admin": { "dashboard": "Panel de administración" },
    "guestForm": { "name": "Nombre", "email": "Correo electrónico" }
  }
  ```
- Ningún texto visible debe ir hardcodeado en los componentes; todo debe pasar por el helper/hook de traducción (`useTranslations()`, `t("key")`, etc.).
- Fechas y horas deben formatearse según el locale activo (`Intl.DateTimeFormat`), pero la lógica interna de disponibilidad/solapamiento sigue trabajando en UTC o en el timezone fijo definido en la sección 7, independientemente del idioma mostrado.
- Agregar un `LanguageSwitcher` (componente `Select`/`DropdownMenu` de shadcn) dentro del sidebar, junto al `ThemeSwitcher`.
- Los mensajes de WhatsApp/correo hacia clientes también deben soportar plantillas por idioma, usando el idioma preferido del usuario o el detectado en el formulario de solicitud.

---

## 10. Pendientes de definición (confirmar con el equipo antes de implementar)

- ¿Se permite que un cliente autenticado cancele/modifique su propia reserva, o solo el admin puede?
- ¿Cuánto tiempo antes de la hora reservada se permite cancelar sin penalización?
- ¿Las solicitudes de visitantes expiran si el admin no responde en X tiempo?
- ¿Se requiere pago/depósito al reservar, o es solo agendamiento?
- WhatsApp ya queda definido como canal para notificar **nuevas solicitudes** de visitantes al admin (simulado vía link `wa.me`, ver 6.1). Falta definir: ¿también se notifica al cliente por WhatsApp cuando su solicitud es aprobada/rechazada, o solo se coordina manualmente por chat? ¿Se envía además copia por correo?
- ¿Los usuarios (admin/clientes) de `db.json` se crean solo como seed manual, o se necesita un flujo de registro simulado que también persista en `localStorage`?
- Si más adelante se agrega backend real, ¿se migra `localStorage` a una base de datos real reutilizando la misma interfaz de `lib/data/*`, o se reescribe desde cero?