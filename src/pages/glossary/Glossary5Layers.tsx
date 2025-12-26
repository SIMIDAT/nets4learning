import Markdown from "react-markdown"
import { Accordion } from "react-bootstrap"
import { Trans } from "react-i18next"
import N4LDivider from "@components/divider/N4LDivider"

export default function Glossary5Layers() {
  return (
    <>
      {import.meta.env.VITE_ENVIRONMENT === "development" && (
        <>
          <N4LDivider i18nKey={"hr.layers"} />
          <Accordion defaultValue={""} defaultActiveKey={""}>
            <Accordion.Item eventKey={"layers"}>
              <Accordion.Header>
                <h2>
                  <Trans>Types of layers</Trans>
                </h2>
              </Accordion.Header>
              <Accordion.Body>
                <Markdown>{`
### Advanced Activation

  tf.layers.elu
  tf.layers.leakyReLU
  tf.layers.prelu
  tf.layers.reLU
  tf.layers.softmax
  tf.layers.thresholdedReLU

### Basic

  tf.layers.activation
  tf.layers.dense
  tf.layers.dropout
  tf.layers.embedding
  tf.layers.flatten
  tf.layers.permute
  tf.layers.repeatVector
  tf.layers.reshape
  tf.layers.spatialDropout1d

### Convolutional

  tf.layers.conv1d
  tf.layers.conv2d
  tf.layers.conv2dTranspose
  tf.layers.conv3d
  tf.layers.cropping2D
  tf.layers.depthwiseConv2d
  tf.layers.separableConv2d
  tf.layers.upSampling2d

### Merge

  tf.layers.add
  tf.layers.average
  tf.layers.concatenate
  tf.layers.dot
  tf.layers.maximum
  tf.layers.minimum
  tf.layers.multiply

### Normalization
  
  tf.layers.batchNormalization
  tf.layers.layerNormalization

### Pooling

  tf.layers.averagePooling1d
  tf.layers.averagePooling2d
  tf.layers.averagePooling3d
  tf.layers.globalAveragePooling1d
  tf.layers.globalAveragePooling2d
  tf.layers.globalMaxPooling1d
  tf.layers.globalMaxPooling2d
  tf.layers.maxPooling1d
  tf.layers.maxPooling2d
  tf.layers.maxPooling3d

### Recurrent

  tf.layers.convLstm2d
  tf.layers.convLstm2dCell
  tf.layers.gru
  tf.layers.gruCell
  tf.layers.lstm
  tf.layers.lstmCell
  tf.layers.rnn
  tf.layers.simpleRNN
  tf.layers.simpleRNNCell
  tf.layers.stackedRNNCells

### Wrapper

  tf.layers.bidirectional
  tf.layers.timeDistributed
            `}</Markdown>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </>
      )}
    </>
  )
}
