import { ec } from 'elliptic';

const EC = new ec('secp256k1');

export function generateXY (pub) {
  const stripped = pub.slice(2)
  const key = EC.keyFromPublic(stripped, 'hex')
  const pubPoint = key.getPublic()
  const x = '0x' + pubPoint.getX().toString(16, 64)
  const y = '0x'+ pubPoint.getY().toString(16, 64)
  return { x, y }
}

export function keyFromXY (X, Y) {
  const x = Buffer.from(X.substring(2), 'hex')
  const y = Buffer.from(Y.substring(2), 'hex')
  const keys = EC.keyFromPublic({ x, y }, 'hex')
  return `0x${keys.getPublic().encode('hex')}`
}
