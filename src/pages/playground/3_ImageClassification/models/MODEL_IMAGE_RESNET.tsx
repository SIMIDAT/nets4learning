import I_MODEL_IMAGE_CLASSIFICATION from './_model'

// TODO
export default class MODEL_IMAGE_RESNET extends I_MODEL_IMAGE_CLASSIFICATION {
  static KEY = 'IMAGE-RESNET'
  TITLE = ''
  i18n_TITLE = ''

  DESCRIPTION () {
    return <>
      <p>
        ResNet V2 es una familiar de redes de arquitecturas para la clasificación de imágenes con un número variable de capas.
      </p>
      <p>
        Están basadas en la arquitectura ResNet original publicada por Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun:
        <a href="https://arxiv.org/abs/1512.03385" target={'_blank'} rel="noreferrer">"Deep Residual Learning for Image Recognition"</a>, 2015.
      </p>
      <p>
        La variación "V2" utilizada en el modelo que vamos a usar fue realizada por Kaiming He, Xiangyu Zhang,
        Shaoqing Ren, Jian Sun:{' '}
        <a href="https://arxiv.org/abs/1603.05027" target={'_blank'} rel="noreferrer">"Identity Mappings in Deep Residual Networks"</a>, 2016.
      </p>
      <p>
        La diferencia con ResNet V1 es el uso de la normalización por lotes antes de cada capa de peso. El modelo
        cargado usa un total de 50 capas.
      </p>

      <details>
        <summary>Datos de entrada</summary>
        <ol>
          <li>Imagen con valores de color entre [0,1] de <b> 224 x 224</b> píxeles.</li>
        </ol>
      </details>
      <details>
        <summary>Datos de salida</summary>
        <ol>
          <li>Un número de 0 a 1001 que son cada una de las categorías de esta{' '}
            <a rel="noreferrer" target="_blank"
               href="https://storage.googleapis.com/download.tensorflow.org/data/ImageNetLabels.txt">lista</a>
          </li>
        </ol>
      </details>
    </>
  }
}
