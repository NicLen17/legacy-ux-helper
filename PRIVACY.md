# Política de Privacidad — Legacy UX Helper

**Última actualización:** julio 2026

## Resumen

Legacy UX Helper **no recopila, transmite ni vende datos personales**. Toda la configuración se guarda **únicamente en tu navegador** usando `chrome.storage.local`.

## Qué se almacena (solo local)

| Dato | Dónde | Propósito |
|------|-------|-----------|
| Colores, modos y preferencias visuales | `chrome.storage.local` | Recordar tu configuración |
| Exclusiones y selectores CSS custom | `chrome.storage.local` | Personalizar el resaltado |
| Estado ON/OFF por pestaña (sesión) | `chrome.storage.session` | Badge temporal en el icono |

## Qué NO se almacena

- Dominios o URLs visitadas
- Reglas por sitio web
- Historial de navegación
- Contenido de páginas, formularios o credenciales
- Estadísticas de uso
- Datos enviados a servidores externos

## Permisos

| Permiso | Motivo |
|---------|--------|
| `storage` | Guardar preferencias localmente |
| `activeTab` | Alternar el resaltado en la pestaña activa cuando usás el popup o el atajo |
| Content scripts (`<all_urls>`) | Analizar el DOM visible para resaltar elementos accionables |

## Exportar / Importar

La exportación genera un archivo JSON **en tu equipo**. La extensión no sube ese archivo a ningún servidor.

## Contacto

Para consultas sobre privacidad, contactá al desarrollador del repositorio.
