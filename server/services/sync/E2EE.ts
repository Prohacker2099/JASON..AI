import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'
import fs from 'fs/promises'
export type KeyMaterial = { key: Buffer }
export async function generateKey(): Promise<KeyMaterial> { return { key: randomBytes(32) } }
export async function encrypt(key: KeyMaterial, data: Buffer | string): Promise<{ iv: Buffer; ciphertext: Buffer }> {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', key.key, iv)
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(String(data))
  const enc = Buffer.concat([c.update(buf), c.final()])
  const tag = c.getAuthTag()
  return { iv: Buffer.concat([iv, tag]), ciphertext: enc }
}
export async function decrypt(key: KeyMaterial, ivWithTag: Buffer, ciphertext: Buffer): Promise<Buffer> {
  const iv = ivWithTag.subarray(0, 12)
  const tag = ivWithTag.subarray(12)
  const d = createDecipheriv('aes-256-gcm', key.key, iv)
  d.setAuthTag(tag)
  return Buffer.concat([d.update(ciphertext), d.final()])
}
export async function saveEncrypted(path: string, key: KeyMaterial, data: any): Promise<void> {
  const payload = Buffer.from(JSON.stringify(data))
  const { iv, ciphertext } = await encrypt(key, payload)
  const out = Buffer.concat([Buffer.from('JAS1'), iv, ciphertext])
  await fs.writeFile(path, out)
}
export async function loadEncrypted(path: string, key: KeyMaterial): Promise<any> {
  const buf = await fs.readFile(path)
  if (buf.subarray(0,4).toString() !== 'JAS1') throw new Error('bad_magic')
  const ivWithTag = buf.subarray(4, 4+28)
  const ct = buf.subarray(4+28)
  const plain = await decrypt(key, ivWithTag, ct)
  return JSON.parse(plain.toString('utf8'))
}
export default { generateKey, encrypt, decrypt, saveEncrypted, loadEncrypted }
