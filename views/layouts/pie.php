<?php
/**
 * Pie HTML: carga el JavaScript de la app de React.
 * main.js va SIN ?v= a proposito: los archivos de cada pantalla (assets/chunks/)
 * lo importan con esta misma direccion. Si fueran distintas, React arrancaria
 * dos veces y la pagina saldria en blanco. Para que llegue la version nueva,
 * public/.htaccess le dice al navegador que siempre lo revise (no-cache).
 */
?>
    </div>
    <script type="module" src="<?= rutaBase() ?>/assets/main.js"></script>
</body>
</html>
