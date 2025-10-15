const RSA_ALGO = { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' };
const AES_ALGO = { name: 'AES-GCM', length: 256 };

export async function generateRsaKeyPair() {
    return await crypto.subtle.generateKey(RSA_ALGO, true, ['encrypt', 'decrypt']);
}

export async function exportKey(key) {
    return await crypto.subtle.exportKey('jwk', key);
}

export async function importSymmetricKey(jwk) {
    // import an AES-GCM key exported as JWK
    return await crypto.subtle.importKey('jwk', jwk, AES_ALGO, true, ['encrypt', 'decrypt']);
}

export async function deriveKeyFromPassword(password, saltIn = null) {
    // Derive an AES-GCM key from a password using PBKDF2
    const salt = saltIn ? new Uint8Array(saltIn) : crypto.getRandomValues(new Uint8Array(16));
    const encoder = new TextEncoder();
    const passKey = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
        passKey,
        AES_ALGO,
        true,
        ['encrypt', 'decrypt']
    );
    return { key, salt };
}

export async function importPrivateKey(jwk) {
    return await crypto.subtle.importKey('jwk', jwk, RSA_ALGO, true, ['decrypt']);
}

export async function importPublicKey(jwk) {
    return await crypto.subtle.importKey('jwk', jwk, RSA_ALGO, true, ['encrypt']);
}

export async function generateAesKey() {
    return await crypto.subtle.generateKey(AES_ALGO, true, ['encrypt', 'decrypt']);
}

export async function encryptData(dataBuffer, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedContent = await crypto.subtle.encrypt({ name: AES_ALGO.name, iv }, key, dataBuffer);
    return { encryptedContent, iv };
}

export async function decryptData(encryptedContent, iv, key) {
    return await crypto.subtle.decrypt({ name: AES_ALGO.name, iv }, key, encryptedContent);
}

export async function encryptKey(keyData, publicKey) {
    // keyData is a JWK object for the symmetric AES key
    const keyBuffer = new TextEncoder().encode(JSON.stringify(keyData));
    return await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, keyBuffer);
}

export async function decryptKey(encryptedKeyBuffer, privateKey) {
    const decryptedBuffer = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, encryptedKeyBuffer);
    return JSON.parse(new TextDecoder().decode(decryptedBuffer));
}
