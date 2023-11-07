import './Glossary.css'
import { Accordion, Col, Row, Table } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import Latex from 'react-latex-next'
import React from 'react'
import IMGLinear from './assets/Linear.png'
import IMGLeakyReLU from './assets/LeakyReLU.png'
import IMGHardSigmoid from './assets/Hardsigmoid.png'
import IMGRelU from './assets/ReLU.png'
import IMGRelU6 from './assets/ReLU6.png'
import IMGSELU from './assets/SELU.png'
import IMGELU from './assets/ELU.png'
import IMGSigmoid from './assets/Sigmoid.png'
import IMGTanh from './assets/Tanh.png'
import IMGMish from './assets/Mish.png'
import IMGSoftPlus from './assets/Softplus.png'

export default function Glossary2ActivationFunctions () {

  const { t } = useTranslation()

  const activationsFunctions = [
    // Linear Layers
    {
      i18n_title_section: 'pages.glossary.activation-functions.sub-title-1',
      layers            : [
        { i18n_title: 'Linear', img: IMGLinear, latex: '$$ \\begin{split} R(z,m) = \\begin{Bmatrix} z*m \\end{Bmatrix} \\end{split} $$' },
      ]
    },
    // Non-linear Activations (weighted sum, non-linearity)
    {
      i18n_title_section: 'pages.glossary.activation-functions.sub-title-2',
      layers            : [
        {
          i18n_title: 'Sigmoid',
          img       : IMGSigmoid,
          latex     : '$$ Sigmoid(x) =\\alpha(x) = \\frac{1} {1 + e^{-x}} $$',
          ref       : 'https://pytorch.org/docs/stable/generated/torch.nn.Sigmoid.html'
        },
        {
          i18n_title: 'Hardsigmoid',
          img       : IMGHardSigmoid,
          latex     : '$$ \\begin{split} Hardsigmoid(x) = \\begin{Bmatrix} 0 & x \\leq -3 \\\\ 1 & x \\leq +3 \\\\ x/6 + 1/2 & otherwise \\end{Bmatrix}\\end{split} $$',
          ref       : 'https://pytorch.org/docs/stable/generated/torch.nn.Hardsigmoid.html'
        },
        {
          i18n_title: 'ReLU',
          img       : IMGRelU,
          latex     : '$$ ReLU(x) = (x)^+ = max(0, x) $$',
          ref       : 'https://pytorch.org/docs/stable/generated/torch.nn.ReLU.html'
        },
        {
          i18n_title: 'ReLU6',
          img       : IMGRelU6,
          latex     : '$$ ReLU6(x) = min(max(0,x),6) $$',
          ref       : 'https://pytorch.org/docs/stable/generated/torch.nn.ReLU6.html'
        },
        {
          i18n_title: 'LeakyReLU',
          img       : IMGLeakyReLU,
          latex     : '$$ \\begin{split} LeakyReLU(x) = \\begin{Bmatrix} x & x > 0 \\\\ negative\\_slope * x & x \\leq 0 \\end{Bmatrix}\\end{split} $$',
          ref       : 'https://pytorch.org/docs/stable/generated/torch.nn.LeakyReLU.html'
        },
        {
          i18n_title: 'ELU',
          img       : IMGELU,
          latex     : '$$ \\begin{split} ELU(x) = \\begin{Bmatrix} x & x > 0 \\\\ \\alpha * (exp(x) - 1) & x \\leq 0 \\end{Bmatrix}\\end{split} $$',
          ref       : 'https://pytorch.org/docs/stable/generated/torch.nn.ELU.html'
        },
        {
          i18n_title: 'Tanh',
          img       : IMGTanh,
          latex     : '$$ Tanh(x) = tanh(x) = \\frac{e^{x} - e^{-x}}{e^{x} + e^{-x}} $$',
          ref       : 'https://pytorch.org/docs/stable/generated/torch.nn.Tanh.html'
        },
        {
          i18n_title: 'SoftPlus',
          img       : IMGSoftPlus,
          latex     : '$$ Softplus(x) = \\frac{1}{\\beta} \\log(1 + e^{(\\beta * x)}) $$',
          ref       : 'https://pytorch.org/docs/stable/generated/torch.nn.Softplus.html'
        },
        {
          i18n_title: 'Mish',
          img       : IMGMish,
          latex     : '$$ Mish(x) = x * Tanh(Softplus(x)) $$',
          ref       : 'https://pytorch.org/docs/stable/generated/torch.nn.Mish.html'
        },
        {
          i18n_title: 'SELU',
          img       : IMGSELU,
          latex     : '$$ \\begin{split}  \\begin{Bmatrix} SELU(x) = scale * (max(0, x) + min(0, \\alpha * (e^x - 1))) \\\\ \\alpha = 1.6732632423543772848170429916717 \\\\ scale = 1.0507009873554804934193349852946. \\end{Bmatrix}\\end{split}$$',
          ref       : 'https://pytorch.org/docs/stable/generated/torch.nn.SELU.html'
        },
      ]
    },
    // Non-linear Activations
    {
      i18n_title_section: 'pages.glossary.activation-functions.sub-title-3',
      layers            : [
        {
          i18n_title: 'Softmax',
          img       : false,
          latex     : '$$ \\sigma(z_i) = \\frac{e^{z_{i}}}{\\sum_{j=1}^K e^{z_{j}}} \\ \\ \\ for\\ i=1,2,\\dots,K $$',
          ref       : 'https://pytorch.org/docs/stable/generated/torch.nn.Softmax.html'
        },
      ]
    }
  ]

  /** @typedef {Object} TableStruct_t */
  /** @property {string} title */
  /** @property {string} description */
  /** @property {Object} characteristics */

  return <>
    <Accordion defaultValue={''} defaultActiveKey={''}>
      <Accordion.Item eventKey={'functions-activations'}>
        <Accordion.Header><h2>{t('pages.glossary.activation-functions.title')}</h2></Accordion.Header>
        <Accordion.Body>
          <p>{t('pages.glossary.activation-functions.text-1')}</p>
          <Table striped bordered hover responsive={true}>
            <thead>
            <tr>
              <th>{t('pages.glossary.table-head.name')}</th>
              <th>{t('pages.glossary.table-head.description')}</th>
              <th>{t('pages.glossary.table-head.characteristics')}</th>
            </tr>
            </thead>
            <tbody>
            {Object.entries(t('pages.glossary.activation-functions.table', { returnObjects: true }))
              .map(([_function_key, function_info], index) => {

                const { title, description, characteristics } = /** @type TableStruct_t */ function_info
                return <tr key={index}>
                  <th>{title}</th>
                  <td>{description}</td>
                  <td>
                    <ol>
                      {Object.entries(characteristics)
                        .map(([_sub_key, value], index_2) => {
                          return <li key={index_2}>{value}</li>
                        })}
                    </ol>
                  </td>
                </tr>
              })}
            </tbody>
          </Table>

          <Trans i18nKey={'references'} />
          <ol>
            <li>
              <a target="_blank"
                 rel="noreferrer"
                 className="link-info"
                 href="https://js.tensorflow.org/api/3.14.0/#Layers-Advanced%20Activation">
                TensorFlow JS. Layers / Advanced Activation
              </a>
            </li>
          </ol>

        </Accordion.Body>
      </Accordion.Item>
      {process.env.REACT_APP_SHOW_NEW_FEATURE === 'true' &&
        <Accordion.Item eventKey={'equations-activation'}>
          <Accordion.Header><h2>{t('equations.title-activation')}</h2></Accordion.Header>
          <Accordion.Body>
            <>
              {activationsFunctions.map((section, index) => {
                return <div key={index}>
                  <h4 className={'text-center text-muted'}>{t(section.i18n_title_section)}</h4>
                  <Row xs={1} sm={1} md={2} lg={3} xl={3} xxl={3} className={'mb-3 justify-content-center'}>
                    <>
                      {section.layers.map((value, index) => {
                        return <Col key={index}>
                          <Row>
                            <Col>
                              <h4 className={'text-lg-center'}>{value.i18n_title}</h4>
                              {value.img &&
                                <div>
                                  {value.ref ?
                                    <a href={value.ref} target="_blank" rel="noreferrer" className="link-info">
                                      <img src={value.img} alt="linear-activation-function" className={'img-n4l-glossary img-thumbnail d-block mx-auto'} />
                                    </a>
                                    :
                                    <img src={value.img} alt="linear-activation-function" className={'img-n4l-glossary img-thumbnail d-block mx-auto'} />
                                  }
                                </div>
                              }
                              {!value.img && <div className="img-n4l-glossary"></div>}

                            </Col>
                          </Row>
                          <Row>
                            <Col><p><Latex>{value.latex}</Latex></p></Col>
                          </Row>
                        </Col>
                      })}
                    </>
                  </Row>
                  {activationsFunctions.length - 1 !== index && <hr />}
                </div>
              })}
            </>
            <Row xs={1} sm={1} md={2} lg={4} xl={4} xxl={4}>

            </Row>

            {/*
            <Row xs={1} sm={1} md={2} lg={4} xl={4} xxl={4}>
              <Col>
                <Row>
                  <Col>
                    <h4 className={"text-lg-center"}>Linear</h4>
                    <div><img src={IMGLinear} alt="linear-activation-function" className={"img-n4l-glossary img-thumbnail d-block mx-auto"} /></div>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <p><Latex>{"$$ \\begin{split} R(z,m) = \\begin{Bmatrix} z*m \\end{Bmatrix} \\end{split} $$"}</Latex></p>
                  </Col>
                </Row>
              </Col>

              <Col>
                <Row>
                  <Col>
                    <h4 className={"text-lg-center"}>Sigmoid</h4>
                    <div><img src={IMGSigmoid} alt="sigmoid-activation-function" className={"img-n4l-glossary img-thumbnail d-block mx-auto"} /></div>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <p><Latex>{"$$ S(z) = \\frac{1} {1 + e^{-z}} $$"}</Latex></p>
                  </Col>
                </Row>
              </Col>

              <Col>
                <Row>
                  <Col>
                    <h4 className={"text-lg-center"}>ReLU</h4>
                    <div><img src={IMGRelU} alt="relu-activation-function" className={"img-n4l-glossary img-thumbnail d-block mx-auto"} /></div>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <p><Latex>{"$$ ReLu(z) = max(0, z) $$"}</Latex></p>
                  </Col>
                </Row>
              </Col>

              <Col>
                <Row>
                  <Col>
                    <h4 className={"text-lg-center"}>ReLU6</h4>
                    <div><img src={IMGRelU6} alt="relu6-activation-function" className={"img-n4l-glossary img-thumbnail d-block mx-auto"} /></div>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <p><Latex>{"$$ ReLU6(x) = min(max(0,x),6) $$"}</Latex></p>
                  </Col>
                </Row>
              </Col>

              <Col>
                <Row>
                  <Col>
                    <h4 className={"text-lg-center"}>LeakyReLU</h4>
                    <div><img src={IMGLeakyReLU} alt="LeakyReLU-activation-function" className={"img-n4l-glossary img-thumbnail d-block mx-auto"} /></div>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <p><Latex>{"$$ \\begin{split}R(z) = \\begin{Bmatrix} z & z > 0 \\\\ \\alpha z & z <= 0 \\end{Bmatrix}\\end{split} $$"}</Latex></p>
                  </Col>
                </Row>
              </Col>

              <Col>
                <Row>
                  <Col>
                    <h4 className={"text-lg-center"}>Tanh</h4>
                    <div><img src={IMGTanh} alt="tanh-activation-function" className={"img-n4l-glossary img-thumbnail d-block mx-auto"} /></div>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <p><Latex>{"$$ tanh(z) = \\frac{e^{z} - e^{-z}}{e^{z} + e^{-z}} $$"}</Latex></p>
                  </Col>
                </Row>
              </Col>

              <Col>
                <Row>
                  <Col>
                    <h4 className={"text-lg-center"}>SoftPlus</h4>
                    <div><img src={IMGSoftPlus} alt="tanh-activation-function" className={"img-n4l-glossary img-thumbnail d-block mx-auto"} /></div>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <p><Latex>{"$$ Softplus(x) = \\frac{1}{\\beta} \\log(1 + \\exp(\\beta * x)) $$"}</Latex></p>
                  </Col>
                </Row>
              </Col>

              <Col>
                <Row>
                  <Col>
                    <h4 className={"text-lg-center"}>Mish</h4>
                    <div><img src={IMGMish} alt="mish-activation-function" className={"img-n4l-glossary img-thumbnail d-block mx-auto"} /></div>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <p><Latex>{"$$ Mish(x) = x ∗ Tanh(Softplus(x)) $$"}</Latex></p>
                  </Col>
                </Row>
              </Col>

              <Col>
                <Row>
                  <Col>
                    <h4 className={"text-lg-center"}>Softmax</h4>
                    <div className="img-n4l-glossary"></div>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <p><Latex>{"$$ \\sigma(z_i) = \\frac{e^{z_{i}}}{\\sum_{j=1}^K e^{z_{j}}} \\ \\ \\ for\\ i=1,2,\\dots,K $$"}</Latex></p>
                  </Col>
                </Row>
              </Col>
            </Row>
            */}
          </Accordion.Body>
        </Accordion.Item>
      }
    </Accordion>
  </>
}
