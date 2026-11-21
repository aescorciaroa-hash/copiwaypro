# 19. Subir los cambios a Hostinger (sin el administrador de archivos)

## ¿Qué se logra?
Cada vez que guardas tus cambios en GitHub (`git push`), Hostinger los descarga solo y la página queda actualizada. Ya no hay que subir archivos uno por uno.

```
Tu computador  --git push-->  GitHub  --aviso (webhook)-->  Hostinger descarga los cambios
```

**Palabras que vas a ver:**
- **Repositorio:** la carpeta del proyecto guardada en GitHub.
- **Deploy (despliegue):** poner el código en el servidor para que la página lo use.
- **Webhook:** un aviso automático. GitHub le dice a Hostinger "hay cambios nuevos".
- **SSH key (llave):** un permiso para que Hostinger pueda leer tu repositorio privado.

---

## Parte 1. Lo que ya quedó listo en el proyecto

| Cambio | Por qué |
|---|---|
| `config/database.php` elige los datos de conexión solo | En tu computador (Windows) usa los de Laragon. En Hostinger (Linux) lee el archivo `datos_bd.php`, que está **afuera** de `public_html` y nunca se sube a GitHub. Así la clave no queda pública y el deploy nunca daña la conexión. |
| `config/app.php` elige `entorno` y `debug` solo | En Hostinger queda `production` y `debug = false`, así no se muestran errores internos ni el código de recuperación de contraseña. |
| `.gitignore` ya no ignora `public/assets/` | Hostinger no puede correr `npm run build`. Por eso el `main.js` compilado tiene que ir en GitHub. |

`public/uploads/` (las fotos que sube el admin) sigue ignorado: esas fotos viven en el servidor y el deploy no las toca.

---

## Parte 2. Escribir los datos de la base de datos de Hostinger (una sola vez)

1. En hPanel: **Sitios web → tu sitio → Bases de datos → Administración**.
2. Copia el **nombre de la base de datos**, el **usuario** y la **clave** (si no la recuerdas, cámbiala ahí).
3. En hPanel → **Archivos → Administrador de archivos**. Sube un nivel desde `public_html` (a la carpeta que contiene `public_html`).
4. Ahí crea un archivo nuevo llamado `datos_bd.php` con esto (cambia los datos por los tuyos):
   ```php
   <?php
   $host = "localhost";
   $user = "u123456789_copiway";
   $password = "tu_clave";
   $bd = "u123456789_copiway";
   ?>
   ```
   Debe quedar así:
   ```
   (carpeta de tu sitio)/
   ├── datos_bd.php      <- aquí, AFUERA de public_html
   └── public_html/
       └── config/database.php   (lo busca dos carpetas arriba: ../../datos_bd.php)
   ```
5. Importa la base de datos: en hPanel → **phpMyAdmin** → **Importar** → el archivo `.sql` de la carpeta `sql/`.

> **¿Por qué afuera de `public_html`?** Todo lo de `public_html` viene de GitHub (que es público) y se reemplaza con cada deploy. Lo que está afuera no se ve desde internet, no está en GitHub y el deploy no lo toca.

---

## Parte 2b. La clave de Gmail (para los correos de recuperar contraseña)

Igual que la base de datos, la clave de Gmail **no** está en el código. `models/CorreoService.php` la lee del archivo `datos_correo.php`, que va **afuera** del proyecto:

| Dónde | Ruta del archivo |
|---|---|
| Tu computador | `C:\laragon\www\datos_correo.php` (al lado de la carpeta `Copiwaypro`) |
| Hostinger | en la 🏠, al lado de `public_html` y de `datos_bd.php` |

Contenido (cambia solo la clave):
```php
<?php
$claveGmail = "abcdefghijklmnop";
?>
```

- La clave es una **contraseña de aplicación** de 16 letras, sin espacios. Se crea en [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords). **No** es la contraseña normal de Gmail.
- Si el archivo no existe, no se envían correos, pero la página sigue funcionando.
- Para cambiar la clave solo editas `datos_correo.php`. No hace falta `git push`.

---

## Parte 2c. La llave de las notificaciones (push)

La llave **privada** de las notificaciones tampoco está en el código. `models/PushNotificationService.php` la lee del archivo `datos_push.php`, en el mismo lugar que `datos_correo.php`:

| Dónde | Ruta del archivo |
|---|---|
| Tu computador | `C:\laragon\www\datos_push.php` |
| Hostinger | en la 🏠, al lado de `public_html` |

Contenido:
```php
<?php
$llavePrivadaPush = "LA_LLAVE_PRIVADA";
?>
```

- La llave **pública** sí sigue en el código (`VAPID_PUBLIC_KEY`): es pública a propósito, el navegador la necesita.
- Si el archivo no existe, no salen notificaciones al celular, pero la página sigue funcionando.

---

## Parte 3. Respaldar lo que ya está en Hostinger

Hostinger solo instala desde Git en una carpeta **vacía**.

1. hPanel → **Archivos → Administrador de archivos** → entra a `public_html`.
2. Descarga una copia de `public_html/public/uploads/` (las fotos de productos) si ya existe.
3. Borra todo lo que hay dentro de `public_html` (o muévelo a otra carpeta como respaldo).

---

## Parte 4. Conectar GitHub con Hostinger

1. hPanel → **Sitios web → tu sitio → Avanzado → GIT**.
2. Como el repositorio es público, no hace falta la SSH key.
3. De vuelta en Hostinger, en **Crear un nuevo repositorio**:
   - **Repositorio:** `https://github.com/aescorciaroa-hash/copiwaypro.git`
   - **Rama:** `main`
   - **Directorio:** déjalo vacío (se instala en `public_html`).
   - Clic en **Crear**.
4. En la lista que aparece abajo, clic en **Implementar (Deploy)**. Espera a que termine.
5. Vuelve a subir la carpeta `public/uploads/` que respaldaste en la Parte 3.

---

## Parte 5. Que se actualice solo con cada `git push`

1. En la misma pantalla de GIT de Hostinger, clic en **Auto Deployment**. Copia la **URL del webhook**.
2. En GitHub → tu repositorio → **Settings → Webhooks → Add webhook**:
   - **Payload URL:** pega la URL de Hostinger.
   - **Content type:** `application/json`.
   - **Which events:** *Just the push event*.
   - Clic en **Add webhook**.

Listo. Desde ahora cada `git push` a `main` actualiza la página.

---

## El día a día: subir un cambio

```bash
npm run build          # solo si cambiaste algo en src/ (React)
git add .
git commit -m "Lo que cambié"
git push
```

Espera unos segundos y recarga la página con **Ctrl + F5**.

---

## Si algo sale mal

| Qué ves | Qué pasa | Qué hacer |
|---|---|---|
| `Failed to open stream ... datos_bd.php` | No existe `datos_bd.php` o está en otra carpeta | Créalo afuera de `public_html` (Parte 2, pasos 3 y 4). |
| `Error de Conexion: Access denied` | El usuario o la clave están mal en `datos_bd.php` | Revísalos en hPanel → Bases de datos y corrígelos en `datos_bd.php` (no hace falta `git push`). |
| `Error de Conexion: Unknown database` | El nombre de la base de datos está mal o no la importaste | Revisa `$bd` y la Parte 2, paso 4. |
| La página se ve en blanco o sin estilos | Falta el `main.js` compilado | Corre `npm run build`, luego `git add .`, `commit` y `push`. |
| El cambio no aparece | El navegador guardó la versión vieja | Ctrl + F5, o F12 → Application → Clear site data. |
| Hostinger dice que la carpeta no está vacía | Quedaron archivos en `public_html` | Parte 3, paso 3. |
| Las fotos de productos no salen | No volviste a subir `public/uploads/` | Parte 4, paso 5. |
