<?php
/**
 * Pie HTML: carga el JavaScript de la app de React.
 */
$rutaAssets = dirname(__DIR__, 3) . '/public/assets';
$verJs = @filemtime($rutaAssets . '/main.js') ?: time();
?>
    </div>
    <script type="module" src="<?= rutaBase() ?>/assets/main.js?v=<?= $verJs ?>"></script>
</body>
</html>
