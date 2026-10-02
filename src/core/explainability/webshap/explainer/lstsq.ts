/**
 * Weighted least square solver
 * @author: Jay Wang
 */

import math from '../utils/math-import';

/**
 * Solves linear least squares problems for given input matrix `x`,
 * target matrix `y`, and weight matrix `w`.
 * The solution is (X'WX)^(-1)X'WY
 *
 * @param x - The input matrix, with shape (m, n)
 * @param y - The target matrix, with shape (m, 1)
 * @param w - The weight matrix, with shape (m, 1) or (m, m)
 * @returns - The matrix with the shape (n, 1), representing the solution of
 * the linear least squares problem.
 * @throws Error - If x and y have different number of samples, y has more
 * than one column, or the size of w is neither (m ,1) nor (m, m).
 */
export const lstsq = (
  x: math.Matrix,
  y: math.Matrix,
  w: math.Matrix
): math.Matrix => {
  // Validate inputs
  if (x.size()[0] !== y.size()[0]) {
    throw Error('x and y have different number of samples.');
  }

  if (x.size()[0] !== w.size()[0]) {
    throw Error('x and w have different number of samples.');
  }

  if (y.size()[1] !== 1) {
    throw Error('y has more than one columns.');
  }

  if (w.size()[1] !== 1 && w.size()[0] !== w.size()[1]) {
    throw Error('The size of w is neither (m ,1) nor (m, m).');
  }

  // Nets4Learning: X'WX y X'WY en JavaScript, sin pasar por tensores. Antes se construía W como matriz diagonal m×m
  // (con 500 muestras, 250 000 elementos), se multiplicaba con TF.js, se leía con arraySync (que detiene el hilo
  // principal hasta que la GPU termina) y no se liberaba ningún tensor. Con W diagonal basta O(m·n²).
  const X = x.toArray() as number[][];
  const Y = y.toArray() as number[][];
  const W = w.toArray() as number[][];
  const m = X.length;
  const n = m > 0 ? X[0].length : 0;
  // Un peso por muestra (W diagonal) o W completa (m×m); con una sola muestra son lo mismo
  const isVector = w.size()[1] === 1;

  const left: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const right: number[] = new Array<number>(n).fill(0);
  if (isVector) {
    for (let k = 0; k < m; k++) {
      const wk = W[k][0];
      if (wk === 0) continue;
      const row = X[k];
      const wy = wk * Y[k][0];
      for (let i = 0; i < n; i++) {
        const wxi = wk * row[i];
        if (wxi === 0) continue;
        right[i] += row[i] * wy;
        for (let j = i; j < n; j++) left[i][j] += wxi * row[j];
      }
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) left[i][j] = left[j][i];
  } else {
    // W completa (m×m): primero X'W (n×m)
    const xtw: number[][] = Array.from({ length: n }, (_, i) =>
      Array.from({ length: m }, (_, k) => {
        let sum = 0;
        for (let l = 0; l < m; l++) sum += X[l][i] * W[l][k];
        return sum;
      })
    );
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < m; k++) {
        right[i] += xtw[i][k] * Y[k][0];
        for (let j = 0; j < n; j++) left[i][j] += xtw[i][k] * X[k][j];
      }
    }
  }

  const leftMat = math.matrix(left);
  const leftDet = math.det(leftMat);

  // Invertible matrix
  let leftInverse: math.Matrix;
  if (leftDet !== 0) {
    leftInverse = math.inv(leftMat);
  } else {
    // Singular matrix => we take pseudo-inverse instead
    console.warn('Matrix x is singular, use pseudo-inverse instead.');
    leftInverse = math.pinv(leftMat);
  }

  const inverse = leftInverse.toArray() as number[][];
  const result = inverse.map((row) => [row.reduce((sum, value, j) => sum + value * right[j], 0)]);
  return math.matrix(result);
};
