/**
 * La columna con la tarjeta del modelo (y la de la explicabilidad, si la hay): en pantallas grandes se queda fija al
 * bajar, pero con su propio desplazamiento si no cabe (las descripciones largas no se quedan cortadas por abajo); en las
 * pequeñas va en su sitio, encima del resto.
 */
export default function N4LModelAside({ children }: { children: React.ReactNode }) {
  return <div className={'n4l-model-aside d-grid gap-3 mt-3'}>{children}</div>
}
