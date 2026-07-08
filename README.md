# Legacy UX Helper

Repositorio: [github.com/NicLen17/legacy-ux-helper](https://github.com/NicLen17/legacy-ux-helper)

Extensión Chrome (Manifest V3) que resalta elementos interactivos en interfaces web legacy **sin alterar el layout**. Funciona **100% en local**, con permisos mínimos.

## Características

- Toggle desde popup o atajo `Alt+Shift+H`
- Colores distintos por tipo: botones, enlaces, inputs, selects, textareas, ARIA, legacy, custom y tablas
- Modos: **Todos** / **Solo legacy** / **Guía hover**
- Modo entrenamiento con etiquetas ("Botón", "Enlace", etc.)
- Estilos configurables: grosor, estilo de borde, glow
- Presets de accesibilidad
- Exclusiones y selectores CSS custom (globales, sin guardar dominios)
- Exportar / Importar configuración JSON (archivo local)
- Indicador flotante, Shadow DOM, optimizaciones de rendimiento

## Privacidad y permisos

| Permiso | Uso |
|---------|-----|
| `storage` | Preferencias en `chrome.storage.local` |
| `activeTab` | Toggle en la pestaña activa (popup / atajo) |

**No se usa:** `tabs`, `scripting`, sincronización en la nube, reglas por dominio ni estadísticas de navegación.

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
3. Configuración avanzada: clic derecho en el icono → **Opciones**

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
├── icons/
├── test-page.html
├── PRIVACY.md
└── README.md
```

---

## Publicar en Chrome Web Store

### Requisitos previos

1. Cuenta de [Google Chrome Web Store Developer](https://chrome.google.com/webstore/devconsole) (pago único de registro)
2. Extensión probada y funcionando en modo desarrollador
3. Iconos en 128×128 px (incluidos en `icons/`)
4. Política de privacidad pública (usá `PRIVACY.md` en GitHub Pages o en el repo)

### Paso 1: Preparar el paquete ZIP

Desde la carpeta del proyecto, incluí **solo** los archivos de la extensión (no incluyas `.git`, `scripts/` ni archivos de desarrollo):

**Windows (PowerShell):**

```powershell
cd "c:\Users\Nic Len\Desktop\PROYECTOS\Extencion"
Compress-Archive -Path manifest.json,background.js,content.js,styles.css,popup.html,popup.js,options.html,options.js,shared,icons,test-page.html,PRIVACY.md -DestinationPath legacy-ux-helper.zip -Force
```

**macOS / Linux:**

```bash
zip -r legacy-ux-helper.zip manifest.json background.js content.js styles.css popup.html popup.js options.html options.js shared icons PRIVACY.md -x "*.git*"
```

> `test-page.html` es opcional en el ZIP de producción; no es necesario para la store.

### Paso 2: Subir a Chrome Web Store

1. Entrá a [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Clic en **New item** / **Nuevo elemento**
3. Subí `legacy-ux-helper.zip`
4. Completá la ficha:
   - **Nombre:** Legacy UX Helper
   - **Descripción corta:** Resalta elementos accionables en sistemas legacy sin alterar el layout
   - **Descripción detallada:** Explicá modos, colores por tipo, privacidad local
   - **Categoría:** Productivity / Accessibility
   - **Screenshots:** Mínimo 1 (1280×800 recomendado) mostrando el resaltado activo
   - **Icono:** `icons/icon128.png`

### Paso 3: Privacidad y permisos

En el formulario de privacidad de la store:

- **Recopila datos personales:** No
- **Política de privacidad:** [PRIVACY.md](https://github.com/NicLen17/legacy-ux-helper/blob/master/PRIVACY.md)
- **Permisos:** Justificá `storage` (preferencias locales) y `activeTab` (toggle en pestaña activa)
- **Host permissions:** Ninguno adicional (content scripts declarados en manifest)

### Paso 4: Revisión y publicación

1. Elegí visibilidad: **Public**, **Unlisted** o **Private**
2. Enviá a revisión (**Submit for review**)
3. Google suele tardar entre horas y varios días
4. Tras aprobación, la extensión queda publicada en la store

### Paso 5: Actualizaciones futuras

1. Incrementá `"version"` en `manifest.json` (ej. `1.3.1` → `1.4.0`)
2. Generá un nuevo ZIP
3. En el dashboard → tu extensión → **Package** → subí el nuevo ZIP
4. Enviá a revisión

---

## Desarrollo local

```bash
node scripts/verify-extension.js
```

Verifica estructura, permisos mínimos y restricciones de CSS.

## Licencia

MIT (ajustá según prefieras al publicar el repo).
