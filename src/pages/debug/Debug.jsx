import React from 'react'
import { Button, Col, Container, Row } from 'react-bootstrap'
import npyjs from 'npyjs'
import JSZip from 'jszip'
import JSZipUtils from 'jszip-utils'
import { VERBOSE } from '@/CONSTANTS'

export default function Debug () {

  const handleClick_debug_npz = async () => {
    const jsZip = new JSZip()
    const file = process.env.REACT_APP_PATH + '/datasets/03-image-classification/kmnist/kmnist-train-imgs.npz'
    await JSZipUtils.getBinaryContent(file, async (error, data) => {
      if (error) {
        throw error
      }
      const npzFiles = await jsZip.loadAsync(data)
      for (const [npy_filename, npy_data] of Object.entries(npzFiles.files)) {
        if (!npy_filename.endsWith('.npy')) {
          console.error('error .npy')
          return
        }

        const npy_array_buffer = await npzFiles.files[npy_filename].async("arraybuffer")
        console.log({ npy_filename, npy_data, npy_array_buffer: npy_array_buffer })

        const _npyjs_ = new npyjs()
        console.log(await _npyjs_.parse(npy_array_buffer))
      }
    })
  }
  const handleClick_debug = async () => {
    const _npyjs_ = new npyjs()
    const res_npy = await _npyjs_.load(process.env.REACT_APP_PATH + '/datasets/03-image-classification/kmnist/kmnist-train-imgs/arr_0.npy')
    console.log(res_npy)
  }

  if (VERBOSE) console.debug('render Debug')
  return <>
    <Container>
      <Row>
        <Col>
          <h2>Debug</h2>
        </Col>
      </Row>
      <Row>
        <Col>
          <Button className={'me-3'} onClick={handleClick_debug}>Debug npy with npyjs</Button>
          <Button onClick={handleClick_debug_npz}>Debug npz with npyjs and JSZip</Button>
        </Col>
      </Row>
    </Container>
  </>
}
