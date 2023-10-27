import { Accordion, Table } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import React from 'react'

export default function Glossary5Layers () {

  const { t } = useTranslation()

  return <>
    {process.env.REACT_APP_ENVIRONMENT === 'development' && <>
      <Accordion defaultValue={''} defaultActiveKey={''}>
        <Accordion.Item eventKey={'layers'}>
          <Accordion.Header><h2>Tipos de capas</h2></Accordion.Header>
          <Accordion.Body>
            <Table striped bordered hover responsive={true}>
              <thead>
              <tr>
                <th>{t('pages.glossary.table-head.name')}</th>
                <th>{t('pages.glossary.table-head.description')}</th>
              </tr>
              </thead>
              <tbody>
              <tr>
                <th>Dense</th>
                <td>Esta función se utiliza para crear capas completamente conectadas, en las que cada salida depende de cada entrada.</td>
              </tr>
              <tr>
                <th>Convolutional</th>
                <td>Existen tres tipos de capas Convolutional, 1d, 2d y 3d. Estas capas nos permiten crear un núcleo de convolución que se transforma con los datos de entrada sobre el número de dimensiones elegido según la capa.
                </td>
              </tr>
              <tr>
                <th>Merge</th>
                <td>Se trata de un conjunto de funciones que definen diferentes operaciones como añadir o concatenar tensores a una capa.</td>
              </tr>
              <tr>
                <th>Normalization</th>
                <td>Nos permite normalizar la activación de la capa anterior es decir mantiene la activación media cerca de 0 y la desviación estándar de activación cerca de 1.</td>
              </tr>
              </tbody>
            </Table>
          </Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey={'normalization'} style={{ display: 'none' }}>
          <Accordion.Header><h2>Normalización</h2></Accordion.Header>
          <Accordion.Body>
            <p>La normalización de datos es un paso importante en el procesamiento de datos para redes neuronales. La normalización se refiere a la transformación de los datos de entrada para que tengan una escala común.</p>
            <p>La normalización de datos se utiliza en redes neuronales por varias razones:</p>
            <ol>
              <li><b>Mejora la estabilidad numérica</b>: Al normalizar los datos, los valores de entrada se escalan a un rango más pequeño y manejable, lo que ayuda a evitar problemas numéricos como la explosión del gradiente.</li>
              <li><b>Mejora la velocidad de entrenamiento</b>: La normalización de datos puede ayudar a que los algoritmos de aprendizaje automático converjan más rápido, ya que los valores de entrada se encuentran en un rango más
                pequeño y uniforme, lo que permite que el optimizador pueda ajustar los pesos más fácilmente.
              </li>
              <li><b>Mejora la precisión del modelo</b>: La normalización de datos puede ayudar a mejorar la precisión del modelo. En algunos casos, la normalización de datos puede ayudar a reducir la cantidad de ruido en los datos
                y puede hacer que los patrones en los datos sean más visibles.
              </li>
              <li><b>Mejora la generalización del model</b>: La normalización de datos puede ayudar a reducir la varianza y mejorar la generalización del modelo. Al normalizar los datos, se puede hacer que el modelo sea más
                resistente a la presencia de valores atípicos y variaciones en los datos.
              </li>
            </ol>
            <p>En resumen, normalizar los datos es una buena práctica en el procesamiento de datos para redes neuronales, ya que puede mejorar la estabilidad numérica, la velocidad de entrenamiento, la precisión del modelo y
              la generalización del modelo.</p>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </>}
  </>
}