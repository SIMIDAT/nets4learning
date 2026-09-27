// Copia del código fuente de webshap 0.1.4 (MIT, © 2023 Jay Wang y Polo Chau,
// https://github.com/xiaohk/webshap). Ver LICENSE en esta carpeta.
//
// El paquete de npm publica un bundle que incluye su propia copia de TensorFlow.js y mathjs:
// al cargarlo se registraban de nuevo todos los kernels de TF.js ("The kernel '…' for backend
// 'cpu' is already registered"). Usando el código fuente, KernelSHAP importa el
// @tensorflow/tfjs, mathjs y d3-random del proyecto.
export { KernelSHAP } from './explainer/kernel'
