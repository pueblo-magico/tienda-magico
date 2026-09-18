# Storefront local en dispositivos móviles

El túnel limitado a webhooks no sirve para navegar la tienda. Para probar el storefront, usá el túnel que ya publica el puerto 3000; no publiques el CMS.

En `.env.local`, configurá `DEV_STOREFRONT_URL` con el origen HTTPS exacto del túnel del storefront, sin rutas ni comodines. Next.js toma ese hostname en `allowedDevOrigins` únicamente en desarrollo. No desactives las protecciones de origen ni habilites todos los subdominios del proveedor.

Reiniciá el storefront después de cambiar la variable y recargá la página del dispositivo. Actualizala cuando cambie el hostname del túnel y borrala cuando termines. No afecta la URL del webhook ni habilita orígenes en producción.

Si se ven productos y funcionan los enlaces pero no responden carrito, menú o cantidad, revisá las solicitudes `/_next/`: deben devolver JavaScript, no 403. Los enlaces HTML pueden funcionar aunque React todavía no haya inicializado los controles.

Verificación: abrí la tienda desde el túnel, desplegá y cerrá el carrito y el menú móvil; en un producto disponible incrementá la cantidad de 1 a 2, sin completar una compra. Probá también desde localhost y verificá que un origen no autorizado siga recibiendo 403 en recursos de desarrollo.
