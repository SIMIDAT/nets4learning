## Qué cambia

<!-- Qué hace este cambio y por qué. -->

## Accesibilidad

<!-- Lo que se comprueba en cada cambio (docs/accessibility.md). Marca lo que hayas revisado o explica por qué no aplica. -->

- [ ] Se puede usar solo con el teclado: se llega a todo, el orden es lógico, el foco se ve y no se pierde.
- [ ] Cada control tiene un nombre que empieza por lo que se ve; las imágenes y las gráficas, su texto alternativo o su tabla («Ver los datos»).
- [ ] Lo que cambia sin mover el foco se anuncia con `announce()`; los errores se dicen junto al campo.
- [ ] Contraste suficiente en los temas claro y oscuro (texto 4,5:1; bordes, iconos y gráficas 3:1) y nada depende solo del color.
- [ ] Se ve bien a 320 px de ancho, con el texto al 200 % y con los ajustes de accesibilidad de /settings.
- [ ] Las páginas o estados nuevos están en las pruebas de axe (`e2e/accesibilidad*.spec.ts`) y, si tienen un flujo nuevo, en `e2e/teclado.spec.ts`.
