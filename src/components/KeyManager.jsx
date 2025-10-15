import { useState } from 'react';
import * as Crypto from '../services/crypto';

const Card = ({ children, title, description }) => (
    <div className="glass rounded-lg shadow-lg shadow-purple-500/20 p-5 border border-purple-500/30 hover:shadow-purple-500/40 transition-all">
        <h2 className="text-xl font-bold mb-2 text-yellow-300 flex items-center">
            <span className="mr-2 animate-float">🔑</span> {title}
        </h2>
        {description && <p className="text-sm text-gray-400 mb-4">{description}</p>}
        {children}
    </div>
);

export default function KeyManager({ onKeypairChange }) {
    const [keyPair, setKeyPair] = useState(null);
    const [publicKeyText, setPublicKeyText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateKeys = async () => {
        setIsGenerating(true);
        try {
            const newKeyPair = await Crypto.generateRsaKeyPair();
            setKeyPair(newKeyPair);
            onKeypairChange(newKeyPair);
            const pubKeyJwk = await Crypto.exportKey(newKeyPair.publicKey);
            setPublicKeyText(JSON.stringify(pubKeyJwk, null, 2));
            // Use a more modern notification instead of alert
            const notification = document.createElement('div');
            notification.className = 'fixed bottom-4 right-4 bg-yellow-600 text-white p-4 rounded-lg shadow-lg z-50 animate-fadeIn';
            notification.innerHTML = `
                <div class="flex items-center">
                    <span class="text-2xl mr-2">🔐</span>
                    <div>
                        <p class="font-bold">New keypair generated!</p>
                        <p class="text-sm">IMPORTANT: Save your private key to access your files later.</p>
                    </div>
                </div>
            `;
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.classList.add('animate-fadeOut');
                setTimeout(() => notification.remove(), 500);
            }, 5000);
        } finally {
            setIsGenerating(false);
        }
    };

    const importKey = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            setIsGenerating(true); // Reuse loading state
            try {
                const text = await file.text();
                const jwk = JSON.parse(text);
                const privateKey = await Crypto.importPrivateKey(jwk);
                const publicKeyJwk = { kty: jwk.kty, n: jwk.n, e: jwk.e };
                const publicKey = await Crypto.importPublicKey(publicKeyJwk);
                const newKeyPair = { privateKey, publicKey };
                setKeyPair(newKeyPair);
                onKeypairChange(newKeyPair);
                setPublicKeyText(JSON.stringify(publicKeyJwk, null, 2));
                
                // Success notification
                const notification = document.createElement('div');
                notification.className = 'fixed bottom-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 animate-fadeIn';
                notification.innerHTML = `
                    <div class="flex items-center">
                        <span class="text-2xl mr-2">✅</span>
                        <div>
                            <p class="font-bold">Key imported successfully!</p>
                            <p class="text-sm">You can now access your encrypted files.</p>
                        </div>
                    </div>
                `;
                document.body.appendChild(notification);
                setTimeout(() => {
                    notification.classList.add('animate-fadeOut');
                    setTimeout(() => notification.remove(), 500);
                }, 5000);
            } catch (err) {
                // Error notification
                const notification = document.createElement('div');
                notification.className = 'fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 animate-fadeIn';
                notification.innerHTML = `
                    <div class="flex items-center">
                        <span class="text-2xl mr-2">❌</span>
                        <div>
                            <p class="font-bold">Invalid private key file</p>
                            <p class="text-sm">Please check your file and try again.</p>
                        </div>
                    </div>
                `;
                document.body.appendChild(notification);
                setTimeout(() => {
                    notification.classList.add('animate-fadeOut');
                    setTimeout(() => notification.remove(), 500);
                }, 5000);
                console.error(err);
            } finally {
                setIsGenerating(false);
            }
        };
        input.click();
    };

    const exportKey = async () => {
        if (!keyPair) return;
        try {
            const privateKeyJwk = await Crypto.exportKey(keyPair.privateKey);
            const blob = new Blob([JSON.stringify(privateKeyJwk, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'decrypt-link-private-key.json';
            a.click();
            URL.revokeObjectURL(url);
            
            // Success notification
            const notification = document.createElement('div');
            notification.className = 'fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 animate-fadeIn';
            notification.innerHTML = `
                <div class="flex items-center">
                    <span class="text-2xl mr-2">💾</span>
                    <div>
                        <p class="font-bold">Private key saved!</p>
                        <p class="text-sm">Keep this file secure - it's your only way to access your files.</p>
                    </div>
                </div>
            `;
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.classList.add('animate-fadeOut');
                setTimeout(() => notification.remove(), 500);
            }, 5000);
        } catch (error) {
            console.error("Failed to export key:", error);
        }
    };

    const copyPublicKey = () => {
        navigator.clipboard.writeText(publicKeyText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <Card title="Your Identity" description="Your keypair is your identity. Keep your Private Key safe and never share it.">
            <div className="space-y-3">
                <button 
                    onClick={generateKeys} 
                    disabled={isGenerating}
                    className="btn btn-primary w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-yellow-500/50 transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <span className="flex items-center justify-center">
                            <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                            Generating...
                        </span>
                    ) : keyPair ? 'Generate New Keypair' : 'Generate Keypair'}
                </button>
                <button 
                    onClick={importKey} 
                    disabled={isGenerating}
                    className="btn btn-outline w-full border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500/20 font-bold py-2 px-4 rounded-lg transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <span className="flex items-center justify-center">
                            <span className="inline-block w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mr-2"></span>
                            Importing...
                        </span>
                    ) : 'Import Private Key'}
                </button>
            </div>
            {keyPair && (
                <div className="mt-4 animate-fadeIn">
                    <h3 className="font-semibold text-md mb-2 text-yellow-300 flex items-center">
                        <span className="mr-2">🔑</span> Your Public Key:
                    </h3>
                    <div className="relative">
                        <textarea 
                            value={publicKeyText} 
                            rows="4" 
                            className="w-full p-2 border border-yellow-500/30 rounded-md text-xs bg-black bg-opacity-50 font-mono text-yellow-100" 
                            readOnly 
                        />
                        <div className="absolute top-2 right-2">
                            <div className="bg-black bg-opacity-70 rounded-full p-1 shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                                    <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="flex space-x-2 mt-2">
                        <button 
                            onClick={copyPublicKey} 
                            className={`flex-1 btn btn-secondary bg-gradient-to-r ${copied ? 'from-green-500 to-green-700' : 'from-gray-600 to-gray-800'} hover:from-gray-700 hover:to-gray-900 text-white text-sm py-2 px-3 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center`}
                        >
                            {copied ? (
                                <>
                                    <span className="mr-1">✓</span> Copied!
                                </>
                            ) : (
                                <>
                                    <span className="mr-1">📋</span> Copy Public Key
                                </>
                            )}
                        </button>
                        <button 
                            onClick={exportKey} 
                            className="flex-1 btn btn-outline border-2 border-blue-500 text-blue-400 hover:bg-blue-500/20 text-sm py-2 px-3 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center"
                        >
                            <span className="mr-1">💾</span> Save Private Key
                        </button>
                    </div>
                    <div className="mt-3 p-2 border border-yellow-500/30 rounded-lg bg-yellow-900/20">
                        <p className="text-xs text-yellow-200 flex items-start">
                            <span className="text-lg mr-2 mt-0">⚠️</span>
                            <span>IMPORTANT: Save your private key in a secure location. If lost, you will permanently lose access to your encrypted files.</span>
                        </p>
                    </div>
                </div>
            )}
        </Card>
    );
}
