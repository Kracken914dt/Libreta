/**
 * Constantes de UI compartidas entre componentes.
 *
 * Lugar único para constantes que se repiten en múltiples vistas. Mantener
 * este archivo chiquito y sin dependencias del dominio (sin imports de
 * componentes, contextos, ni hooks).
 */

/**
 * Tamaño de página para la paginación client-side de las listas
 * (ClientesList, PrestamosList, ProductosList). Una sola fuente de verdad
 * para PAGE_SIZE, evita magic numbers repartidos por los componentes.
 *
 * Cambio aquí se propaga automáticamente a las 3 listas y a la barra
 * de paginación. Si en el futuro se quiere page-size variable por lista,
 * este archivo es el primer lugar a tocar.
 */
export const PAGE_SIZE = 20;
