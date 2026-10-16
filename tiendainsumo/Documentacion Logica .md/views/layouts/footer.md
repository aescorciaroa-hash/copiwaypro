# views/layouts/footer.php — Pie de página

Archivo puramente de cierre: HTML estático (footer visual con enlaces de contacto/redes) más las etiquetas de cierre `</section></main></div>` y `</body></html>` que abren [[header]] y las vistas que lo incluyen.

No contiene lógica PHP — es la contraparte de cierre de `header.php` para que cada vista protegida (`dashboard.php`, `gusuarios.php`) tenga una estructura HTML completa: `header.php` abre `<html><body>...`, la vista imprime su contenido, y `footer.php` cierra todo al final.

## Conexiones

- Se incluye al final de las mismas vistas que incluyen [[header]] y [[sidebaradmin]] (`views/admin/dashboard.php`, `views/admin/gusuarios.php`).
