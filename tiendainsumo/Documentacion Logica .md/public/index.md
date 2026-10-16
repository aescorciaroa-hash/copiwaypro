# public/index.php — Landing page pública

- `session_start()` se llama pero `$_SESSION` no se usa en ningún otro punto de este archivo — código de precaución sin uso real.
- `$systemStatus = "...";`: valor simulado (fijo), no una consulta real. El comentario original lo aclara: "Simulación de conexión (sólo para la presentación)".
- El resto del archivo es prácticamente 100% HTML + Bootstrap + JavaScript (typewriter, simulador de venta POS, gráfico con Chart.js) — cero lógica PHP adicional, y **sin conexión real a la base de datos**.

## Conexiones

- No se conecta con ningún modelo ni con `config/database.php` — es intencionalmente independiente, solo la "vitrina" antes de entrar al sistema real.
- Sus botones "Acceder"/"Iniciar Sesión" enlazan a `views/auth/login.php`.
