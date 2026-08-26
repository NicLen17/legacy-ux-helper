# Legacy UX Helper

<img src="icons/app-128.png" alt="Legacy UX Helper" width="128" height="128" />

Repositorio: [github.com/NicLen17/legacy-ux-helper](https://github.com/NicLen17/legacy-ux-helper)

Extensión Chrome (Manifest V3) que **resalta** elementos interactivos en interfaces web legacy **sin alterar el layout**. Funciona **100% en local**, con permisos mínimos.

## Características

- Toggle desde popup o atajo `Alt+Shift+H`
- Colores distintos por tipo: botones, enlaces, inputs, selects, textareas, ARIA, legacy, custom y tablas
- Modos: **Todos** / **Solo legacy** / **Guía hover**
- Modo entrenamiento con etiquetas ("Botón", "Enlace", etc.)
- Estilos configurables: grosor, estilo de borde, glow
- Presets de accesibilidad para resaltado
- Exclusiones y selectores CSS custom (globales, sin guardar dominios)
- Exportar / Importar configuración JSON (archivo local, versión 1.4)
- Indicador flotante, Shadow DOM, optimizaciones de rendimiento
- Ayuda contextual (icono *i*) en popup y página de opciones

## Privacidad y permisos

| Permiso | Uso |
|---------|-----|
| `storage` | Preferencias en `chrome.storage.local` |
| `activeTab` | Toggle en la pestaña activa (popup / atajo) |
| `scripting` | Inyectar el resaltado en la pestaña activa si el content script aún no está cargado |

**No se usa:** `tabs`, sincronización en la nube, reglas por dominio ni estadísticas de navegación.

El resaltado es CSS local sobre la página activa. No modifica el HTML ni envía información a servidores.

Ver [PRIVACY.md](PRIVACY.md).

## Instalación en desarrollo

1. Abrí `chrome://extensions`
2. Activá **Modo de desarrollador**
3. Clic en **Cargar descomprimida**
4. Seleccioná esta carpeta
5. Recargá la extensión tras cada cambio de código

## Uso

1. Navegá a cualquier página web
2. Clic en el icono → **Activar resaltado** (o `Alt+Shift+H`)
3. Elegí el modo en el popup: **Todos**, **Solo legacy** o **Guía hover**
4. Configuración: clic derecho en el icono → **Opciones**

Probá también con `test-page.html` incluido en el repo.

## Estructura del proyecto

```
├── manifest.json
├── background.js
├── content.js
├── styles.css
├── popup.html / popup.js
├── options.html / options.js
├── shared/settings.js / ui.css
├── assets/app-identifier.jpg
├── assets/toolbar-icon.jpg
├── icons/app-*.png          # identificador (Web Store, chrome://extensions)
├── icons/toolbar-*.png      # icono de acceso rápido (toolbar)
├── docs/linkedin-post-v1.4.md
├── docs/store/               # capturas y tiles para Chrome Web Store
├── test-page.html
├── PRIVACY.md
└── README.md
```

## Identidad visual

| Uso | Origen | Archivos |
|-----|--------|----------|
| Identificador de la app (Chrome Web Store, `chrome://extensions`, favicon) | `assets/app-identifier.jpg` | `icons/app-16.png` … `icons/app-128.png` |
| Icono de acceso rápido (toolbar) | `assets/toolbar-icon.jpg` | `icons/toolbar-16.png` … `icons/toolbar-128.png` |

Para regenerar los PNG en Windows: `node scripts/generate-icons.js`.

---

## Publicar en Chrome Web Store

### Requisitos previos

1. Cuenta de [Google Chrome Web Store Developer](https://chrome.google.com/webstore/devconsole) (pago único de registro)
2. Extensión probada y funcionando en modo desarrollador
3. Iconos en 128×128 px: identificador `icons/app-128.png` e icono de toolbar `icons/toolbar-128.png`
4. Política de privacidad pública (usá `PRIVACY.md` en GitHub Pages o en el repo)
5. Imágenes de ficha en `docs/store/` (capturas 1280×800 y tile 440×280)

### Paso 1: Preparar el paquete ZIP

Desde la carpeta del proyecto, incluí **solo** los archivos de la extensión (no incluyas `.git`, `scripts/` ni archivos de desarrollo):

**Windows (PowerShell):**

```powershell
cd "c:\Users\Wako\Desktop\Proyectos\legacy-ux-helper"
Compress-Archive -Path manifest.json,background.js,content.js,styles.css,popup.html,popup.js,options.html,options.js,shared,icons,PRIVACY.md -DestinationPath legacy-ux-helper.zip -Force
```

**macOS / Linux:**

```bash
zip -r legacy-ux-helper.zip manifest.json background.js content.js styles.css popup.html popup.js options.html options.js shared icons PRIVACY.md -x "*.git*"
```

> `test-page.html` y `docs/` son opcionales en el ZIP de producción; no son necesarios para la store.

### Paso 2: Subir a Chrome Web Store

1. Entrá a [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Clic en **New item** / **Nuevo elemento**
3. Subí `legacy-ux-helper.zip`
4. Completá la ficha:
   - **Nombre:** Legacy UX Helper
   - **Descripción corta:** Resalta elementos accionables en UIs legacy. 100% local.
   - **Descripción detallada:** (ver copy abajo)
   - **Categoría:** Productivity
   - **Screenshots:** Subí las de `docs/store/` (1280×800, JPEG sin transparencia)
     1. `screenshot-1-all.jpg` — modo Todos en un ERP legacy
     2. `screenshot-2-legacy.jpg` — modo Solo legacy
     3. `screenshot-3-popup.jpg` — popup + icono de acceso rápido
     4. `screenshot-4-options.jpg` — página de configuración
   - **Icono de la ficha:** `icons/app-128.png`
   - **Imagen promocional pequeña (obligatoria, 440×280):** `docs/store/promo-small-440x280.jpg`
   - **Marquee opcional (1400×560, para destacar):** `docs/store/promo-marquee-1400x560.jpg`

#### Copy para la ficha (Chrome Web Store)

**Short description:**
Resalta elementos accionables en UIs legacy. 100% local.

**Long description (idea):**
Resalta qué es clickeable en pantallas legacy **sin cambiar el layout**.

Tres modos:

1. **Todos** — outlines y glow por tipo (botones, enlaces, inputs, legacy onclick, tablas clickeables).
2. **Solo legacy** — únicamente controles no semánticos (cursor pointer, onclick, tablas).
3. **Guía hover** — resalta solo el elemento sobre el que pasás el mouse.

Incluye presets de accesibilidad, modo entrenamiento, exclusiones CSS y exportación de configuración.

**100% local.** Sin cloud, sin analytics, sin reglas por dominio. Permisos: `storage`, `activeTab` y `scripting`.

### Paso 3: Privacidad y permisos

En el formulario de privacidad de la store:

- **Recopila datos personales:** No
- **Política de privacidad:** [PRIVACY.md](https://github.com/NicLen17/legacy-ux-helper/blob/master/PRIVACY.md)
- **Permisos:** Justificá `storage` (preferencias locales), `activeTab` (toggle en pestaña activa) y `scripting` (inyectar el resaltado en esa pestaña)
- **Host permissions:** Ninguno adicional (content scripts declarados en manifest)

### Paso 4: Revisión y publicación

1. Elegí visibilidad: **Public**, **Unlisted** o **Private**
2. Enviá a revisión (**Submit for review**)
3. Google suele tardar entre horas y varios días
4. Tras aprobación, la extensión queda publicada en la store

### Paso 5: Actualizaciones futuras

1. Incrementá `"version"` en `manifest.json` (ej. `1.4.0` → `1.4.1`)
2. Generá un nuevo ZIP
3. En el dashboard → tu extensión → **Package** → subí el nuevo ZIP
4. Enviá a revisión

---

## Desarrollo local

```bash
node scripts/verify-extension.js
node scripts/generate-icons.js
```

`verify-extension.js` comprueba estructura, permisos mínimos, modos de resaltado e iconos. `generate-icons.js` regenera los PNG desde `assets/` (Windows).

## Licencia

MIT (ajustá según prefieras al publicar el repo).
