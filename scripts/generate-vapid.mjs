import { generateKeyPairSync } from 'node:crypto';

const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const publicJwk = publicKey.export({ format: 'jwk' });
const privateJwk = privateKey.export({ format: 'jwk' });

function base64UrlToBuffer(value) {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

const uncompressedPublicKey = Buffer.concat([
  Buffer.from([4]),
  base64UrlToBuffer(publicJwk.x),
  base64UrlToBuffer(publicJwk.y),
]);

console.log('VAPID_PUBLIC_KEY=' + uncompressedPublicKey.toString('base64url'));
console.log('VAPID_PRIVATE_KEY=' + privateJwk.d);
