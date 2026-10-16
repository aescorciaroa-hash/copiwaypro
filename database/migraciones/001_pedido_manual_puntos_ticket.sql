-- ======================================================
-- Migracion 001: pedido manual, canje de puntos y datos del ticket
--
-- Para bases de datos creadas ANTES de este cambio. No borra ningun dato.
-- Una instalacion nueva no la necesita: schema.sql ya trae estas columnas.
-- Se ejecuta UNA sola vez (MySQL 8.0 no admite ADD COLUMN IF NOT EXISTS):
--
--   mysql -u root --default-character-set=utf8mb4 hamburguer_copiway < database\migraciones\001_pedido_manual_puntos_ticket.sql
-- ======================================================

-- Pedido manual: el cliente puede ser un invitado sin cuenta (id_cliente NULL).
ALTER TABLE PEDIDO
    MODIFY id_cliente INT UNSIGNED NULL,
    ADD COLUMN id_admin_registro INT UNSIGNED NULL AFTER id_reporte,
    ADD COLUMN nombre_contacto   VARCHAR(120) NULL AFTER id_admin_registro,
    ADD COLUMN telefono_contacto VARCHAR(20)  NULL AFTER nombre_contacto,
    ADD COLUMN puntos_canjeados  INT          NOT NULL DEFAULT 0 AFTER descuento_cumpleanos,
    ADD COLUMN descuento_puntos  DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER puntos_canjeados,
    ADD FOREIGN KEY (id_admin_registro) REFERENCES ADMINISTRADOR(id_admin);

-- Programa de puntos y datos del negocio para el ticket.
ALTER TABLE CONFIGURACION_SISTEMA
    ADD COLUMN valor_punto         DECIMAL(10,2) NOT NULL DEFAULT 10 AFTER id_ingrediente_bolsa_global,
    ADD COLUMN minimo_puntos_canje INT          NOT NULL DEFAULT 100 AFTER valor_punto,
    ADD COLUMN negocio_nombre      VARCHAR(120) NOT NULL DEFAULT 'COPIWAY PRO' AFTER minimo_puntos_canje,
    ADD COLUMN negocio_nit         VARCHAR(30)  NOT NULL DEFAULT '900.123.456-7' AFTER negocio_nombre,
    ADD COLUMN negocio_direccion   VARCHAR(255) NOT NULL DEFAULT 'Cra 43 # 79-115, Barranquilla' AFTER negocio_nit,
    ADD COLUMN negocio_telefono    VARCHAR(30)  NOT NULL DEFAULT '(300) 123-4567' AFTER negocio_direccion,
    ADD COLUMN negocio_instagram   VARCHAR(80)  NOT NULL DEFAULT '@copiway_pro' AFTER negocio_telefono,
    ADD COLUMN negocio_web         VARCHAR(120) NOT NULL DEFAULT 'www.copiway.com' AFTER negocio_instagram;
