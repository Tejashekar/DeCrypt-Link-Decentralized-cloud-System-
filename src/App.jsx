import { useState, useEffect, useCallback } from 'react';
import KeyManager from './components/KeyManager';
import Uploader from './components/Uploader';
import FileList from './components/FileList';
import StatusBar from './components/StatusBar';
import ShareModal from './components/ShareModal';

import * as P2P from './services/p2p';
import * as Crypto from './services/crypto';
import * as FileManager from './services/fileManager';

// Cloud animation component
const CloudParticles = () => {
    useEffect(() => {
        const container = document.querySelector('.particles-container');
        if (!container) return;
        
        // Create particles
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            createParticle(container);
        }
        
        return () => {
            // Cleanup
            const particles = document.querySelectorAll('.particle');
            particles.forEach(p => p.remove());
        };
    }, []);
    
    const createParticle = (container) => {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random size between 20px and 80px
        const size = Math.random() * 60 + 20;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random position
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Random opacity and color
        particle.style.opacity = Math.random() * 0.2 + 0.1;
        
        // Random cloud color
        const colors = ['#8b5cf6', '#3b82f6', '#06b6d4'];
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Random animation duration
        const duration = Math.random() * 60 + 30;
        particle.style.animation = `float ${duration}s ease-in-out infinite`;
        
        // Random delay
        particle.style.animationDelay = `${Math.random() * 10}s`;
        
        container.appendChild(particle);
        
        // Remove and recreate after some time for variety
        setTimeout(() => {
            particle.remove();
            createParticle(container);
        }, duration * 1000);
    };
    
    return <div className="particles-container"></div>;
};

function App() {
    const [status, setStatus] = useState({ message: 'Initializing...', type: 'info' });
    const [p2p, setP2p] = useState(null);
    const [userKeyPair, setUserKeyPair] = useState(null);
    const [files, setFiles] = useState([]);
    const [isSharing, setIsSharing] = useState(null); // Stores file metadata for sharing
    const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'files', 'keys', 'sharing'

    const updateStatus = (message, type = 'info') => setStatus({ message, type });

    const handleFileUpdate = useCallback((docs) => {
        // docs come from Firestore via p2p.subscribeToFiles
        if (Array.isArray(docs)) setFiles(docs);
    }, []);

    useEffect(() => {
        let unsubscribe;
        (async () => {
            try {
                const p2pServices = await P2P.init(updateStatus);
                setP2p(p2pServices);
                updateStatus('Ready! Please generate or import a key.', 'info');

                // subscribe to realtime updates
                unsubscribe = p2pServices.subscribeToFiles(handleFileUpdate);
            } catch (error) {
                console.error("Initialization failed:", error);
                updateStatus('Error connecting to the P2P network.', 'error');
            }
        })();

        return () => {
            try { if (unsubscribe) unsubscribe(); } catch (e) {}
        };
    }, [handleFileUpdate]);

    const handleUpload = async (file, options = {}) => {
        if (!file || !p2p) return;
        try {
            await FileManager.uploadFile(file, userKeyPair, p2p, updateStatus, options);
            handleFileUpdate();
        } catch (error) {
            console.error("Upload failed:", error);
            updateStatus('File upload failed. See console for details.', 'error');
        }
    };
    
    const handleDownload = async (file, options = {}) => {
        if (!file || !p2p) return;
        try {
            await FileManager.downloadFile(file, userKeyPair, p2p, updateStatus, options);
        } catch (error) {
            console.error("Download failed:", error);
            updateStatus('Download failed. Incorrect key/password or network issue.', 'error');
        }
    };

    const handleShare = async (recipientPubKey) => {
        if (!isSharing || !recipientPubKey || !userKeyPair || !p2p) return;
        try {
            await FileManager.shareFile(isSharing, recipientPubKey, userKeyPair, p2p, updateStatus);
            handleFileUpdate();
        } catch (error) {
            console.error("Sharing failed:", error);
            updateStatus('Sharing failed. Invalid public key.', 'error');
        } finally {
            setIsSharing(null);
        }
    };

    // Tab button with glow effect
    const TabButton = ({ id, label, icon, color }) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 ${
                activeTab === id 
                ? `bg-opacity-20 bg-${color}-500 shadow-lg shadow-${color}-500/50 border border-${color}-400 text-white animate-pulse-glow` 
                : 'bg-black bg-opacity-40 text-gray-300 hover:bg-opacity-60 hover:scale-105'
            }`}
        >
            <span className={`text-${color}-400 text-xl`}>{icon}</span>
            <span className="font-medium">{label}</span>
        </button>
    );

    return (
        <div className="bg-[#0b0c10] text-white min-h-screen font-['Poppins'] cloud-bg">
            <CloudParticles />
            <div className="container mx-auto p-4 md:p-6 max-w-6xl relative z-10">
                <header className="text-center mb-8 animate-float">
                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400">
                        DeCrypt-Link
                    </h1>
                    <p className="mt-2 text-md text-gray-400">
                        True Decentralized Storage with Client-Side Encryption
                    </p>
                    <div className="mt-2">
                        <StatusBar status={status} />
                    </div>
                </header>

                {/* Navigation Tabs */}
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                    <TabButton 
                        id="upload" 
                        label="File Upload" 
                        icon="📤" 
                        color="purple" 
                    />
                    <TabButton 
                        id="files" 
                        label="Network Files" 
                        icon="📁" 
                        color="blue" 
                    />
                    <TabButton 
                        id="keys" 
                        label="Key Management" 
                        icon="🔑" 
                        color="yellow" 
                    />
                    <TabButton 
                        id="sharing" 
                        label="Sharing Center" 
                        icon="🔄" 
                        color="green" 
                    />
                </div>

                {/* Content Area with Glassmorphism */}
                <div className="glass rounded-xl shadow-xl p-6 mb-8 animate-fadeIn">
                    {/* File Upload Tab */}
                    {activeTab === 'upload' && (
                        <div className="animate-fadeIn">
                            <h2 className="text-2xl font-bold mb-4 text-purple-400 flex items-center">
                                <span className="mr-2">📤</span> Encrypt & Upload Files
                            </h2>
                            <div className="border border-purple-500/30 rounded-lg p-4 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all">
                                <Uploader onUpload={handleUpload} />
                            </div>
                        </div>
                    )}

                    {/* Network Files Tab */}
                    {activeTab === 'files' && (
                        <div className="animate-fadeIn">
                            <h2 className="text-2xl font-bold mb-4 text-blue-400 flex items-center">
                                <span className="mr-2">📁</span> Decentralized Network Files
                            </h2>
                            <div className="border border-blue-500/30 rounded-lg p-4 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all">
                                <FileList
                                    files={files}
                                    userKeyPair={userKeyPair}
                                    onDownload={handleDownload}
                                    onShare={setIsSharing}
                                    p2p={p2p}
                                    updateStatus={updateStatus}
                                />
                            </div>
                        </div>
                    )}

                    {/* Key Management Tab */}
                    {activeTab === 'keys' && (
                        <div className="animate-fadeIn">
                            <h2 className="text-2xl font-bold mb-4 text-yellow-400 flex items-center">
                                <span className="mr-2">🔑</span> Cryptographic Key Management
                            </h2>
                            <div className="border border-yellow-500/30 rounded-lg p-4 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 transition-all">
                                <KeyManager onKeypairChange={setUserKeyPair} />
                            </div>
                        </div>
                    )}

                    {/* Sharing Center Tab */}
                    {activeTab === 'sharing' && (
                        <div className="animate-fadeIn">
                            <h2 className="text-2xl font-bold mb-4 text-green-400 flex items-center">
                                <span className="mr-2">🔄</span> Secure File Sharing
                            </h2>
                            <div className="border border-green-500/30 rounded-lg p-4 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all">
                                <p className="text-gray-300 mb-4">
                                    Select a file from the Network Files tab and click "Share" to securely share it with another user.
                                </p>
                                
                                {/* Display shared files metadata */}
                                <div className="mt-6">
                                    <h3 className="text-xl font-semibold text-green-300 mb-3 flex items-center">
                                        <span className="mr-2">🔗</span> Shared Files
                                    </h3>
                                    <div className="space-y-3">
                                        {files.filter(file => file.sharedWith && file.sharedWith.length > 0).length > 0 ? (
                                            files.filter(file => file.sharedWith && file.sharedWith.length > 0).map(file => (
                                                <div key={file.id} className="border border-green-500/20 rounded-lg p-3 bg-black bg-opacity-30 hover:bg-opacity-40 transition-all">
                                                    <p className="font-semibold text-white">{file.fileName}</p>
                                                    <p className="text-xs text-gray-400">ID: {file.id}</p>
                                                    <p className="text-xs text-gray-400">Shared with: {file.sharedWith.length} user(s)</p>
                                                    <p className="text-xs text-gray-400">Protection: {file.protection}</p>
                                                    <p className="text-xs text-gray-400">Timestamp: {new Date(file.timestamp).toLocaleString()}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-gray-500 py-4">No shared files found.</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex justify-center mt-6">
                                    <button 
                                        onClick={() => setActiveTab('files')}
                                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-green-500/50 transition-all hover:scale-105"
                                    >
                                        Go to Network Files
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer with neon line */}
                <footer className="text-center text-gray-500 text-sm">
                    <div className="h-px bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 mb-4 animate-pulse-glow"></div>
                    <p>Decentralized Cloud Storage System © {new Date().getFullYear()}</p>
                </footer>
            </div>

            {isSharing && (
                <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="glass rounded-xl shadow-2xl shadow-purple-500/30 p-6 max-w-md w-full animate-fadeIn">
                        <ShareModal
                            file={isSharing}
                            onClose={() => setIsSharing(null)}
                            onShare={handleShare}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
