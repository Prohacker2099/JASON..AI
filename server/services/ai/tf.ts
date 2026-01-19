import path from 'path'
import { createRequire } from 'module'

const req = createRequire(path.join(process.cwd(), 'package.json'))

let tf: any

const shouldSuppress = (args: any[]) => {
  try {
    return args.some((a) => typeof a === 'string' && a.includes('Hi, looks like you are running TensorFlow.js in Node.js'))
  } catch {
    return false
  }
}

const SUPPRESS_KEY = '__JASON_TFJS_BANNER_SUPPRESS_INSTALLED__'
const installSuppressor = () => {
  const anyConsole = console as any
  if (anyConsole[SUPPRESS_KEY]) return
  anyConsole[SUPPRESS_KEY] = true

  const wrap = (method: 'log' | 'warn') => {
    const original = (console as any)[method]
    if (typeof original !== 'function') return
    ;(console as any)[method] = (...args: any[]) => {
      if (shouldSuppress(args)) return
      return original.apply(console, args)
    }
  }

  wrap('log')
  wrap('warn')
}

installSuppressor()

try {
  tf = req('@tensorflow/tfjs-node')
} catch {
  tf = req('@tensorflow/tfjs')
}

export default tf as typeof import('@tensorflow/tfjs')
