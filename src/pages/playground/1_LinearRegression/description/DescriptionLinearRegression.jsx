import 'katex/dist/katex.min.css'
import Latex from 'react-latex-next'
import { Card, Col, Container, Row } from 'react-bootstrap'

export default function DescriptionLinearRegression () {

  return <>
    <Container className={'mt-3 mb-3'} data-testid={'Test-DescriptionLinearRegression'}>
      <Row>
        <Col>
          <h1>Regresión lineal</h1>
          <Card className={'mt-3'}>
            <Card.Header>
              <h2>Descripción del problema y los modelos</h2>
            </Card.Header>
            <Card.Body>
              <p>Los problemas en el contexto del análisis de datos se refieren a situaciones en las que se busca predecir o estimar un valor numérico basado en variables de entrada. Los problemas de regresión lineal involucran la
                utilización de un modelo matemático conocido como regresión lineal para realizar esta predicción.</p>

              <p>Un modelo de regresión lineal es una técnica estadística que busca establecer una relación lineal entre una variable de respuesta (o variable dependiente) y una o más variables predictoras (o variables independientes). El
                objetivo del modelo es encontrar la línea recta que mejor se ajuste a los datos observados, de modo que pueda utilizarse para predecir el valor de la variable de respuesta en función de los valores de las variables
                predictoras.</p>

              <p>El modelo de regresión lineal utiliza una función matemática para representar la relación lineal entre las variables. Esta función se basa en la fórmula de una línea recta, donde se estima el valor de la variable de
                respuesta a través de una combinación lineal de los valores de las variables predictoras. Los coeficientes de la ecuación lineal, también conocidos como coeficientes de regresión, se determinan mediante técnicas estadísticas
                que buscan minimizar la diferencia entre los valores observados y los valores predichos por el modelo.</p>

              <p>Una vez que se ha ajustado el modelo de regresión lineal, puede utilizarse para hacer predicciones sobre el valor de la variable de respuesta cuando se conocen los valores de las variables predictoras. También permite
                identificar la contribución relativa de cada variable predictora en la explicación de la variabilidad de la variable de respuesta.</p>

              <p>En resumen, los modelos de regresión lineal son herramientas estadísticas utilizadas para predecir valores numéricos basados en variables predictoras, estableciendo una relación lineal entre ellas. Estos modelos pueden ser
                útiles en diversos campos, como la economía, la ciencia, la ingeniería y la investigación social, entre otros.</p>
              <hr />

              <p>
                <Latex>
                  Supongamos que queremos predecir el precio de una casa (variable de respuesta, denotada por $Y$) basándonos en el tamaño de la casa en metros cuadrados (variable predictora, denotada por $x$). Podemos expresar la relación
                  entre
                  estas dos variables mediante la siguiente ecuación de regresión lineal:
                </Latex>
              </p>
              <Latex>{'$$ Y = \\beta_0 + \\beta_1 * x + \\epsilon $$'}</Latex>

              Donde:

              <ol style={{ listStyleType: 'none' }}>
                <li><Latex>$Y$ representa el precio de la casa.</Latex></li>
                <li><Latex>X representa el tamaño de la casa.</Latex></li>
                <li><Latex>$\beta_0$ es el intercepto, que indica el valor de Y cuando X es igual a cero.</Latex></li>
                <li><Latex>$\beta_1$ es la pendiente de la línea de regresión, que representa el cambio en el precio de la casa asociado a un incremento unitario en el tamaño de la casa.</Latex></li>
                <li><Latex>$\epsilon$ es el término de error, que representa la variabilidad no explicada por el modelo.</Latex></li>
              </ol>
              <p><Latex>El objetivo del modelo de regresión lineal es estimar los valores de los coeficientes $\beta_0$ y $\beta_1$ a partir de los datos observados para obtener una línea recta que mejor se ajuste a los puntos en el gráfico
                de dispersión de las variables.</Latex></p>
              <p><Latex>Una vez que el modelo está ajustado, podemos utilizarlo para predecir el precio de una casa desconocida dada su área en metros cuadrados. Simplemente debemos sustituir el valor de $x$ en la ecuación y calcular el
                valor predicho de $Y$.</Latex></p>
              <p><Latex>Cabe destacar que este ejemplo es un caso simplificado de regresión lineal simple, y en la práctica los modelos pueden involucrar múltiples variables predictoras y considerar interacciones entre ellas.</Latex></p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  </>
}