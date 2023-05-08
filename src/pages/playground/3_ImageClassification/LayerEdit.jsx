import { Form, Row } from 'react-bootstrap'
import { TYPE_ACTIVATION } from "../../../core/nn-utils/ArchitectureTypesHelper";

export default function LayerEdit(props) {
  const {
    index,
    item,
    handleChange_Kernel,
    handleChange_Activation,
    handleChange_Filters,
    handleChange_Strides,
    handleChange_PoolSize,
    handleChange_StridesMax,
  } = props

  return (
    <>
      {item.class === 'Conv2D' ? (
        <>
          <Row className={"mt-3"}>
            {/* KERNEL SIZE */}
            <Form.Group className="mb-3" controlId={'formKernelLayer' + index}>
              <Form.Label>Tamaño del Kernel</Form.Label>
              <Form.Control type="number"
                            placeholder="Introduce el tamaño del kernel de la capa"
                            defaultValue={item.kernelSize}
                            onChange={(e) => handleChange_Kernel(index, e)} />
            </Form.Group>

            {/* FILTERS */}
            <Form.Group className="mb-3" controlId={'formFiltersLayer' + index}>
              <Form.Label>Tamaño del filters</Form.Label>
              <Form.Control type="number"
                            placeholder="Introduce el filtro de la capa"
                            defaultValue={item.filters}
                            onChange={(e) => handleChange_Filters(index, e)} />
            </Form.Group>

            {/* STRIDES */}
            <Form.Group className="mb-3" controlId={'formStridesLayer' + index}>
              <Form.Label>Strides</Form.Label>
              <Form.Control type="number"
                            placeholder="Introduce el strides de la capa"
                            defaultValue={item.strides}
                            onChange={(e) => handleChange_Strides(index, e)} />
            </Form.Group>

            {/* ACTIVATION FUNCTION */}
            <Form.Group className="mb-3" controlId={'formActivationLayer' + index}>
              <Form.Label>Selecciona la función de activación</Form.Label>
              <Form.Select aria-label="Selecciona la función de activación"
                           defaultValue={item.activation}
                           onChange={(e) => handleChange_Activation(index, e)}>
                {TYPE_ACTIVATION.map(({ key, label }, indexAct) => {
                  return (<option key={indexAct} value={key}>{label}</option>)
                })}
              </Form.Select>
              <Form.Text className="text-muted">
                Será la función de activación
              </Form.Text>
            </Form.Group>
          </Row>
        </>
      ) : (
        <>
          <Row className={"mt-3"}>
            {/* POOL_SIZE */}
            <Form.Group className="mb-3"
                        controlId={'formPoolSize0Layer' + index}>
              <Form.Label>POOL SIZE de la capa</Form.Label>
              <Form.Control type="number"
                            placeholder="Introduce el número de POOLSIZE de la capa"
                            defaultValue={item.poolSize[0]}
                            onChange={(e) => handleChange_PoolSize(index, 0, e)} />
            </Form.Group>

            {/* POOL SIZE 2 */}
            <Form.Group className="mb-3" controlId={'formPoolSize1Layer' + index}>
              <Form.Label>POOL SIZE de la capa</Form.Label>
              <Form.Control type="number"
                            placeholder="Introduce el número de POOLSIZE2 de la capa"
                            defaultValue={item.poolSize[1]}
                            onChange={(e) => handleChange_PoolSize(index, 1, e)} />
            </Form.Group>
          </Row>
          <Row className={"mt-3"}>
            {/* strides max 1 */}
            <Form.Group className="mb-3" controlId={'formStrides0Layer' + index}>
              <Form.Label>strides de la capa</Form.Label>
              <Form.Control type="number"
                            placeholder="Introduce el número de strides de la capa"
                            defaultValue={item.strides2[0]}
                            onChange={(e) => handleChange_StridesMax(index, 0, e)} />
            </Form.Group>

            {/* strides max 2 */}
            <Form.Group className="mb-3" controlId={'formStrides1Layer' + index}>
              <Form.Label>strides de la capa</Form.Label>
              <Form.Control type="number"
                            placeholder="Introduce el número de strides 2 de la capa"
                            defaultValue={item.strides2[1]}
                            onChange={(e) => handleChange_StridesMax(index, 1, e)} />
            </Form.Group>
          </Row>
        </>
      )}
    </>
  )
}
