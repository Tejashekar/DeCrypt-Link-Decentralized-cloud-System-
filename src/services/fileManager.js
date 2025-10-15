import * as Crypto from './crypto';

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

export async function uploadFile(file, userKeyPair, p2p, updateStatus, options = {}) {
    // options: { password?: string }
    updateStatus(`Encrypting "${file.name}"...`, 'loading');

    const fileBuffer = await file.arrayBuffer();

    // Password-protected flow
    if (options.password) {
        const { key, salt } = await Crypto.deriveKeyFromPassword(options.password);
        const { encryptedContent, iv } = await Crypto.encryptData(fileBuffer, key);

        updateStatus(`Uploading encrypted file to IPFS...`, 'loading');
        // Upload encrypted content to IPFS
        const encryptedBlob = new Blob([encryptedContent]);
        const { ipfs } = p2p;
        const result = await ipfs.add(encryptedBlob);
        const cid = result.path;

        updateStatus(`Publishing metadata to OrbitDB...`, 'loading');
        const metadata = {
            fileName: file.name,
            protection: 'password',
            salt: Array.from(salt),
            iv: Array.from(iv),
            cid: cid, // Store IPFS CID instead of content
            timestamp: new Date().toISOString(),
        };

        // Store metadata in OrbitDB
        await p2p.db.add(metadata);
        updateStatus(`Successfully uploaded "${file.name}" (password-protected)!`, 'success');
        return;
    }

    // RSA-based flow
    const symKey = await Crypto.generateAesKey();
    const { encryptedContent, iv } = await Crypto.encryptData(fileBuffer, symKey);

    // Encrypt the symmetric key with the user's public key
    const symKeyExported = await Crypto.exportKey(symKey);
    const encryptedSymKey = await Crypto.encryptKey(symKeyExported, userKeyPair.publicKey);

    updateStatus(`Uploading encrypted file to IPFS...`, 'loading');
    // Upload encrypted content to IPFS
    const encryptedBlob = new Blob([encryptedContent]);
    const { ipfs } = p2p;
    const result = await ipfs.add(encryptedBlob);
    const cid = result.path;

    updateStatus(`Publishing metadata to OrbitDB...`, 'loading');
    const publicKeyJwk = await Crypto.exportKey(userKeyPair.publicKey);

    const metadata = {
        fileName: file.name,
        protection: 'rsa',
        ownerPublicKey: publicKeyJwk,
        encryptedSymKeyB64: arrayBufferToBase64(encryptedSymKey),
        iv: Array.from(iv),
        cid: cid, // Store IPFS CID instead of content
        timestamp: new Date().toISOString(),
        sharedWith: [] // Initialize empty array for tracking shared users
    };

    // Store metadata in OrbitDB
    await p2p.db.add(metadata);
    updateStatus(`Successfully uploaded "${file.name}"!`, 'success');
}

export async function downloadFile(file, userKeyPair, p2p, updateStatus, options = {}) {
    // options: { password?: string, rawEncrypted?: boolean }
    updateStatus(`Downloading ${file.fileName}...`, 'loading');

    // First, retrieve the encrypted content from IPFS
    updateStatus(`Retrieving encrypted file from IPFS (CID: ${file.cid})...`, 'loading');
    const { ipfs } = p2p;
    
    // Get the file from IPFS using its CID
    const chunks = [];
    for await (const chunk of ipfs.cat(file.cid)) {
        chunks.push(chunk);
    }
    
    // Combine chunks into a single buffer
    const encryptedContentBuffer = new Uint8Array(
        chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    );
    
    let offset = 0;
    for (const chunk of chunks) {
        encryptedContentBuffer.set(chunk, offset);
        offset += chunk.length;
    }

    // If rawEncrypted option is true, download the encrypted file directly
    if (options.rawEncrypted) {
        updateStatus(`Downloading encrypted file (cipher text)...`, 'loading');
        const encryptedBlob = new Blob([encryptedContentBuffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(encryptedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.fileName}.encrypted`;
        a.click();
        URL.revokeObjectURL(url);
        updateStatus('Encrypted file download complete!', 'success');
        return;
    }

    let symKey;
    
    if (file.protection === 'password') {
        if (!options.password) throw new Error('Password required for this file');
        const salt = new Uint8Array(file.salt).buffer;
        const { key } = await Crypto.deriveKeyFromPassword(options.password, salt);
        symKey = key;
    } else {
        // Check if this is a shared file for the current user
        if (file.sharedWith && Array.isArray(file.sharedWith)) {
            const currentUserPublicKey = await Crypto.exportKey(userKeyPair.publicKey);
            const currentUserKeyStr = JSON.stringify(currentUserPublicKey);
            
            // Find if there's a shared key for this user
            const sharedKeyEntry = file.sharedWith.find(entry => 
                JSON.stringify(entry.publicKey) === currentUserKeyStr
            );
            
            if (sharedKeyEntry) {
                // This file was shared with the current user
                const encryptedSymKeyBuf = base64ToArrayBuffer(sharedKeyEntry.encryptedSymKeyB64);
                const symKeyJwk = await Crypto.decryptKey(encryptedSymKeyBuf, userKeyPair.privateKey);
                symKey = await Crypto.importSymmetricKey(symKeyJwk);
            } else {
                // Try the regular owner key
                const encryptedSymKeyBuf = base64ToArrayBuffer(file.encryptedSymKeyB64);
                const symKeyJwk = await Crypto.decryptKey(encryptedSymKeyBuf, userKeyPair.privateKey);
                symKey = await Crypto.importSymmetricKey(symKeyJwk);
            }
        } else {
            // Regular file owned by this user
            const encryptedSymKeyBuf = base64ToArrayBuffer(file.encryptedSymKeyB64);
            const symKeyJwk = await Crypto.decryptKey(encryptedSymKeyBuf, userKeyPair.privateKey);
            symKey = await Crypto.importSymmetricKey(symKeyJwk);
        }
    }

    // Decrypt file content
    updateStatus(`Decrypting file...`, 'loading');
    const iv = new Uint8Array(file.iv);
    const decryptedContent = await Crypto.decryptData(encryptedContentBuffer, iv, symKey);

    // Trigger download
    const blob = new Blob([decryptedContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName;
    a.click();
    URL.revokeObjectURL(url);
    updateStatus('Download complete!', 'success');
}

export async function downloadRawFile(file, p2p, updateStatus) {
    updateStatus(`Downloading encrypted version of ${file.fileName}...`, 'loading');

    // Retrieve the encrypted content from IPFS
    updateStatus(`Retrieving encrypted file from IPFS (CID: ${file.cid})...`, 'loading');
    const { ipfs } = p2p;
    
    // Get the file from IPFS using its CID
    const chunks = [];
    for await (const chunk of ipfs.cat(file.cid)) {
        chunks.push(chunk);
    }
    
    // Combine chunks into a single buffer
    const encryptedContentBuffer = new Uint8Array(
        chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    );
    
    let offset = 0;
    for (const chunk of chunks) {
        encryptedContentBuffer.set(chunk, offset);
        offset += chunk.length;
    }

    // Create metadata file with encryption details
    const metadata = {
        fileName: file.fileName,
        protection: file.protection,
        iv: file.iv,
        cid: file.cid,
        timestamp: file.timestamp
    };
    
    // If it's RSA protected, include the encrypted symmetric key
    if (file.protection === 'rsa') {
        metadata.encryptedSymKeyB64 = file.encryptedSymKeyB64;
    }
    
    // If it's password protected, include the salt
    if (file.protection === 'password') {
        metadata.salt = file.salt;
    }
    
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    const metadataUrl = URL.createObjectURL(metadataBlob);
    const metadataLink = document.createElement('a');
    metadataLink.href = metadataUrl;
    metadataLink.download = `${file.fileName}.metadata.json`;
    metadataLink.click();
    URL.revokeObjectURL(metadataUrl);

    // Download the encrypted file
    const encryptedBlob = new Blob([encryptedContentBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(encryptedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.fileName}.encrypted`;
    a.click();
    URL.revokeObjectURL(url);
    
    updateStatus('Encrypted file and metadata download complete!', 'success');
}

export async function shareFile(file, recipientPublicKeyJson, userKeyPair, p2p, updateStatus) {
    try {
        updateStatus(`Preparing to share "${file.fileName}"...`, 'loading');
        
        // Parse the recipient's public key
        let recipientPublicKey;
        try {
            const recipientKeyJwk = JSON.parse(recipientPublicKeyJson);
            recipientPublicKey = await Crypto.importPublicKey(recipientKeyJwk);
        } catch (error) {
            throw new Error('Invalid recipient public key format');
        }
        
        // Get the original file metadata from OrbitDB
        const entries = p2p.db.iterator({ limit: -1 }).collect();
        const originalEntry = entries.find(entry => entry.hash === file.id);
        
        if (!originalEntry) {
            throw new Error('File metadata not found in the database');
        }
        
        const originalMetadata = originalEntry.payload.value;
        
        // Decrypt the symmetric key using the owner's private key
        const encryptedSymKeyBuf = base64ToArrayBuffer(originalMetadata.encryptedSymKeyB64);
        const symKeyJwk = await Crypto.decryptKey(encryptedSymKeyBuf, userKeyPair.privateKey);
        
        // Re-encrypt the symmetric key with the recipient's public key
        const encryptedSymKeyForRecipient = await Crypto.encryptKey(symKeyJwk, recipientPublicKey);
        
        // Create a shared version of the metadata
        const sharedMetadata = {
            ...originalMetadata,
            sharedBy: await Crypto.exportKey(userKeyPair.publicKey),
            sharedWith: [
                ...(originalMetadata.sharedWith || []),
                {
                    publicKey: JSON.parse(recipientPublicKeyJson),
                    encryptedSymKeyB64: arrayBufferToBase64(encryptedSymKeyForRecipient)
                }
            ]
        };
        
        // Add the updated metadata to OrbitDB
        await p2p.db.add(sharedMetadata);
        
        updateStatus(`Successfully shared "${file.fileName}" with recipient!`, 'success');
    } catch (error) {
        console.error('Error sharing file:', error);
        throw error;
    }
}
