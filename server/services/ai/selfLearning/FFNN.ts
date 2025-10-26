export type Matrix = number[][];
export type Vector = number[];

export type ActivationName = 'relu' | 'sigmoid' | 'tanh' | 'linear' | 'softmax';
export type LossName = 'mse' | 'cross_entropy' | 'binary_cross_entropy';

type Cache = {
  Z: Matrix[];
  A: Matrix[];
};

type TrainOptions = {
  epochs?: number;
  batchSize?: number;
  learningRate?: number;
  hiddenActivation?: ActivationName;
  outputActivation?: ActivationName;
  loss?: LossName;
  l2?: number;
  shuffle?: boolean;
};

function zeros(r: number, c: number): Matrix {
  const m: Matrix = new Array(r);
  for (let i = 0; i < r; i++) m[i] = new Array(c).fill(0);
  return m;
}

function randn(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function randomInit(rows: number, cols: number, fanIn: number, activation: ActivationName): Matrix {
  const scale = activation === 'relu' ? Math.sqrt(2 / fanIn) : Math.sqrt(1 / fanIn);
  const W = zeros(rows, cols);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) W[i][j] = randn() * scale;
  }
  return W;
}

function addBias(X: Matrix, b: Vector): Matrix {
  const r = X.length, c = X[0].length;
  const out: Matrix = new Array(r);
  for (let i = 0; i < r; i++) {
    const row = new Array(c);
    for (let j = 0; j < c; j++) row[j] = X[i][j] + b[j];
    out[i] = row;
  }
  return out;
}

function dot(A: Matrix, B: Matrix): Matrix {
  const m = A.length, n = A[0].length, p = B[0].length;
  const out = zeros(m, p);
  for (let i = 0; i < m; i++) {
    for (let k = 0; k < n; k++) {
      const aik = A[i][k];
      for (let j = 0; j < p; j++) out[i][j] += aik * B[k][j];
    }
  }
  return out;
}

function transpose(A: Matrix): Matrix {
  const m = A.length, n = A[0].length;
  const T = zeros(n, m);
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) T[j][i] = A[i][j];
  return T;
}

function apply(A: Matrix, fn: (x: number) => number): Matrix {
  const m = A.length, n = A[0].length;
  const out: Matrix = new Array(m);
  for (let i = 0; i < m; i++) {
    const row = new Array(n);
    for (let j = 0; j < n; j++) row[j] = fn(A[i][j]);
    out[i] = row;
  }
  return out;
}

function hadamard(A: Matrix, B: Matrix): Matrix {
  const m = A.length, n = A[0].length;
  const out: Matrix = new Array(m);
  for (let i = 0; i < m; i++) {
    const row = new Array(n);
    for (let j = 0; j < n; j++) row[j] = A[i][j] * B[i][j];
    out[i] = row;
  }
  return out;
}

function subtract(A: Matrix, B: Matrix): Matrix {
  const m = A.length, n = A[0].length;
  const out: Matrix = new Array(m);
  for (let i = 0; i < m; i++) {
    const row = new Array(n);
    for (let j = 0; j < n; j++) row[j] = A[i][j] - B[i][j];
    out[i] = row;
  }
  return out;
}

function add(A: Matrix, B: Matrix): Matrix {
  const m = A.length, n = A[0].length;
  const out: Matrix = new Array(m);
  for (let i = 0; i < m; i++) {
    const row = new Array(n);
    for (let j = 0; j < n; j++) row[j] = A[i][j] + B[i][j];
    out[i] = row;
  }
  return out;
}

function scale(A: Matrix, s: number): Matrix {
  const m = A.length, n = A[0].length;
  const out: Matrix = new Array(m);
  for (let i = 0; i < m; i++) {
    const row = new Array(n);
    for (let j = 0; j < n; j++) row[j] = A[i][j] * s;
    out[i] = row;
  }
  return out;
}

function colMean(A: Matrix): Vector {
  const m = A.length, n = A[0].length;
  const b = new Array(n).fill(0);
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) b[j] += A[i][j];
  for (let j = 0; j < n; j++) b[j] /= m;
  return b;
}

function sigmoid(x: number): number { return 1 / (1 + Math.exp(-x)); }
function dsigmoid(a: number): number { return a * (1 - a); }
function tanh(x: number): number { return Math.tanh(x); }
function dtanh(a: number): number { return 1 - a * a; }
function relu(x: number): number { return x > 0 ? x : 0; }
function drelu(a: number): number { return a > 0 ? 1 : 0; }
function linear(x: number): number { return x; }
function dlinear(_a: number): number { return 1; }

function softmaxRow(row: number[]): number[] {
  let maxv = -Infinity;
  for (let i = 0; i < row.length; i++) if (row[i] > maxv) maxv = row[i];
  let sum = 0;
  const exps = new Array(row.length);
  for (let i = 0; i < row.length; i++) { const e = Math.exp(row[i] - maxv); exps[i] = e; sum += e; }
  for (let i = 0; i < row.length; i++) exps[i] /= sum;
  return exps as number[];
}

function softmax(A: Matrix): Matrix {
  const out: Matrix = new Array(A.length);
  for (let i = 0; i < A.length; i++) out[i] = softmaxRow(A[i]);
  return out;
}

function applyActivation(Ain: Matrix, name: ActivationName): { A: Matrix; dAct: Matrix } {
  if (name === 'softmax') {
    const A = softmax(Ain);
    const dAct = apply(A, _ => 1);
    return { A, dAct };
  }
  if (name === 'sigmoid') {
    const A = apply(Ain, sigmoid);
    const dAct = apply(A, dsigmoid);
    return { A, dAct };
  }
  if (name === 'tanh') {
    const A = apply(Ain, tanh);
    const dAct = apply(A, dtanh);
    return { A, dAct };
  }
  if (name === 'relu') {
    const A = apply(Ain, relu);
    const dAct = apply(A, drelu);
    return { A, dAct };
  }
  const A = apply(Ain, linear);
  const dAct = apply(A, dlinear);
  return { A, dAct };
}

export class FFNN {
  layers: number[];
  hiddenActivation: ActivationName;
  outputActivation: ActivationName;
  lossName: LossName;
  W: Matrix[];
  b: Vector[];
  lr: number;
  l2: number;

  constructor(layers: number[], opts?: { hiddenActivation?: ActivationName; outputActivation?: ActivationName; loss?: LossName; learningRate?: number; l2?: number; }) {
    if (layers.length < 2) throw new Error('layers must have at least input and output');
    this.layers = layers.slice();
    this.hiddenActivation = opts?.hiddenActivation ?? 'relu';
    this.outputActivation = opts?.outputActivation ?? 'softmax';
    this.lossName = opts?.loss ?? 'cross_entropy';
    this.lr = opts?.learningRate ?? 1e-2;
    this.l2 = opts?.l2 ?? 0;
    this.W = [];
    this.b = [];
    for (let l = 1; l < layers.length; l++) {
      const fanIn = layers[l - 1];
      const act = l === layers.length - 1 ? this.outputActivation : this.hiddenActivation;
      this.W.push(randomInit(layers[l - 1], layers[l], fanIn, act));
      this.b.push(new Array(layers[l]).fill(0));
    }
  }

  forward(X: Matrix): { out: Matrix; cache: Cache } {
    const A: Matrix[] = [X];
    const Z: Matrix[] = [];
    for (let l = 0; l < this.W.length; l++) {
      const W = this.W[l];
      const b = this.b[l];
      const z = addBias(dot(A[l], W), b);
      const actName = l === this.W.length - 1 ? this.outputActivation : this.hiddenActivation;
      const { A: a } = applyActivation(z, actName);
      Z.push(z);
      A.push(a);
    }
    return { out: A[A.length - 1], cache: { Z, A } };
  }

  private lossAndGrad(Aout: Matrix, Y: Matrix): { loss: number; dA: Matrix } {
    const m = Aout.length;
    if (this.lossName === 'cross_entropy' && this.outputActivation === 'softmax') {
      let loss = 0;
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < Aout[0].length; j++) {
          const y = Y[i][j];
          if (y > 0) loss += -Math.log(Math.max(1e-12, Aout[i][j]));
        }
      }
      loss /= m;
      const dA = subtract(Aout, Y);
      return { loss, dA: scale(dA, 1 / m) };
    }
    if (this.lossName === 'binary_cross_entropy' && this.outputActivation === 'sigmoid') {
      let loss = 0;
      for (let i = 0; i < m; i++) {
        const y = Y[i][0];
        const p = Math.min(1 - 1e-12, Math.max(1e-12, Aout[i][0]));
        loss += -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
      }
      loss /= m;
      const dA = subtract(Aout, Y);
      return { loss, dA: scale(dA, 1 / m) };
    }
    let loss = 0;
    const diff = subtract(Aout, Y);
    for (let i = 0; i < m; i++) for (let j = 0; j < diff[0].length; j++) loss += diff[i][j] * diff[i][j];
    loss /= m;
    const dA = scale(diff, 2 / m);
    return { loss, dA };
  }

  private backprop(cache: Cache, dA_last: Matrix): { dW: Matrix[]; db: Vector[] } {
    const L = this.W.length;
    const dW: Matrix[] = new Array(L);
    const db: Vector[] = new Array(L);
    let dA = dA_last;
    for (let l = L - 1; l >= 0; l--) {
      const actName = l === L - 1 ? this.outputActivation : this.hiddenActivation;
      const Zl = cache.Z[l];
      const Al_prev = cache.A[l];
      const Wl = this.W[l];
      const { A: Al } = applyActivation(Zl, actName);
      let dZ: Matrix;
      if ((this.lossName === 'cross_entropy' && actName === 'softmax') || (this.lossName === 'binary_cross_entropy' && actName === 'sigmoid')) {
        dZ = dA;
      } else {
        const dAct = apply(Al, x => {
          if (actName === 'sigmoid') return dsigmoid(x);
          if (actName === 'tanh') return dtanh(x);
          if (actName === 'relu') return drelu(x);
          return dlinear(x);
        });
        dZ = hadamard(dA, dAct);
      }
      const dWl = dot(transpose(Al_prev), dZ);
      const dbl = colMean(dZ);
      dW[l] = dWl;
      db[l] = dbl;
      if (l > 0) dA = dot(dZ, transpose(Wl));
    }
    return { dW, db };
  }

  private applyGradients(dW: Matrix[], db: Vector[]) {
    for (let l = 0; l < this.W.length; l++) {
      const W = this.W[l];
      const rows = W.length, cols = W[0].length;
      const decay = this.l2;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const g = dW[l][i][j] ?? 0;
          const reg = decay > 0 ? decay * W[i][j] : 0;
          W[i][j] -= this.lr * (g + reg);
        }
      }
      const b = this.b[l];
      for (let j = 0; j < b.length; j++) b[j] -= this.lr * db[l][j];
    }
  }

  fit(X: Matrix, Y: Matrix, options?: TrainOptions): { losses: number[] } {
    const epochs = options?.epochs ?? 1000;
    const batchSize = options?.batchSize ?? Math.min(32, X.length);
    this.lr = options?.learningRate ?? this.lr;
    this.hiddenActivation = options?.hiddenActivation ?? this.hiddenActivation;
    this.outputActivation = options?.outputActivation ?? this.outputActivation;
    this.lossName = options?.loss ?? this.lossName;
    this.l2 = options?.l2 ?? this.l2;
    const losses: number[] = [];
    for (let e = 0; e < epochs; e++) {
      const indices = Array.from({ length: X.length }, (_, i) => i);
      if (options?.shuffle ?? true) {
        for (let i = indices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = indices[i]; indices[i] = indices[j]; indices[j] = t; }
      }
      let epochLoss = 0;
      for (let start = 0; start < X.length; start += batchSize) {
        const end = Math.min(start + batchSize, X.length);
        const Xi: Matrix = new Array(end - start);
        const Yi: Matrix = new Array(end - start);
        for (let k = start, r = 0; k < end; k++, r++) { Xi[r] = X[indices[k]]; Yi[r] = Y[indices[k]]; }
        const { out, cache } = this.forward(Xi);
        const { loss, dA } = this.lossAndGrad(out, Yi);
        epochLoss += loss * (end - start);
        const grads = this.backprop(cache, dA);
        this.applyGradients(grads.dW, grads.db);
      }
      losses.push(epochLoss / X.length);
    }
    return { losses };
  }

  predict(X: Matrix): Matrix {
    return this.forward(X).out;
  }

  predictClass(X: Matrix): number[] {
    const out = this.predict(X);
    const res: number[] = new Array(out.length);
    for (let i = 0; i < out.length; i++) {
      let best = 0;
      for (let j = 1; j < out[0].length; j++) if (out[i][j] > out[i][best]) best = j;
      res[i] = best;
    }
    return res;
  }
}

export function toOneHot(y: number[], numClasses: number): Matrix {
  const m: Matrix = new Array(y.length);
  for (let i = 0; i < y.length; i++) {
    const row = new Array(numClasses).fill(0);
    row[y[i]] = 1;
    m[i] = row;
  }
  return m;
}

export function fromVector(v: Vector[]): Matrix { return v as Matrix; }
export function toVectorColumn(v: number[]): Matrix { return v.map(x => [x]); }
