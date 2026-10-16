# src/components/Footer.tsx

## ¿Para qué sirve?
Es el **pie de página** de la página de inicio: un recuadro naranja con el botón "Pedir Ahora", la
descripción del negocio, redes sociales, enlaces y un campo de suscripción.

## ¿Con qué se conecta?
| Dirección | Archivo | Para qué |
|---|---|---|
| ← lo usa | `pages/Landing.tsx` | Al final de la página de inicio. |
| → usa | `rutaBase()` de `servicios/api.ts` | Enlaces a `/` y `/login`. |
| → enlaces `#nosotros`, `#menu`... | secciones de `Landing.tsx` | |

No tiene estado (`useState`) ni recibe props: solo muestra contenido fijo.

## Partes
| Parte | Qué muestra |
|---|---|
| Recuadro naranja | "¿Listo para probar el auténtico sabor?" + botón **Pedir Ahora** → `/login`. Tiene margen negativo (`-mt-20`, `mb-[-120px]`) para quedar montado entre dos secciones. |
| Columna de marca | Logo, descripción y botones de Instagram, Facebook y Twitter (enlaces `#`, sin dirección real). |
| Compañía / Legal | Enlaces a secciones de la página y páginas legales (sin dirección real). |
| Suscríbete | Formulario de correo. Al enviarlo, `e.preventDefault()` evita recargar y muestra `alert('Suscrito exitosamente.')`: **no guarda nada** en el servidor. |
| Copyright | "© 2024 Hamburguer Copiway". |

## ¿Qué pasa si se borra?

Los cambios en `src/` **no se ven** hasta compilar con `npm run build`: mientras tanto el navegador
sigue usando la versión ya compilada (`public/assets/main.js`). Por eso, si el instructor borra algo
aquí, primero hay que ejecutar `npm run build` para ver el error (o usar `npm run dev`).

| Si se borra… | Qué pasa |
|---|---|
| **El archivo completo** | `npm run build` falla con `Could not resolve ".../Footer"` porque lo importan: `src/pages/Landing.tsx`. |
| Algo que este archivo exporta (`export ...`) | `npm run build` / `npm run lint` fallan en los archivos que lo importan: `"X" is not exported by ...` o `has no exported member`. |
