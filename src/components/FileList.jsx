import { useMemo, useState, useEffect } from 'react';
import * as Crypto from '../services/crypto';
import * as FileManager from '../services/fileManager';

// File type icons mapping
const fileTypeIcons = {
  pdf: '📄',
  doc: '📝',
  docx: '📝',
  xls: '📊',
  xlsx: '📊',
  ppt: '📑',
  pptx: '📑',
  jpg: '🖼️',
  jpeg: '🖼️',
  png: '🖼️',
  gif: '🖼️',
  mp3: '🎵',
  mp4: '🎬',
  zip: '📦',
  rar: '📦',
  txt: '📃',
  default: '📁'
};

// Get icon based on file extension
const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  return fileTypeIcons[extension] || fileTypeIcons.default;
};

function FileItem({ file, isOwner, onDownload, onShare, p2p, updateStatus }) {
    const [showOptions, setShowOptions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [animateCard, setAnimateCard] = useState(false);
    
    const fileIcon = getFileIcon(file.fileName);
    
    // Format date to be more readable
    const formattedDate = new Date(file.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    const handleDownload = async (options = {}) => {
        setIsLoading(true);
        try {
            if (file.protection === 'password' && !options.rawEncrypted && !options.password) {
                const pwd = prompt('Enter password to decrypt this file:');
                if (pwd === null) {
                    setIsLoading(false);
                    return; // cancelled
                }
                options.password = pwd;
            }
            await onDownload(file, options);
        } catch (error) {
            console.error("Download failed:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownloadRaw = async () => {
        setIsLoading(true);
        try {
            await FileManager.downloadRawFile(file, p2p, updateStatus);
        } catch (error) {
            console.error("Raw download failed:", error);
            updateStatus('Raw file download failed. See console for details.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Add animation when hovering
    const handleMouseEnter = () => {
        setAnimateCard(true);
    };
    
    const handleMouseLeave = () => {
        setAnimateCard(false);
    };
    
    return (
        <div 
            className={`file-card glass rounded-lg p-4 transition-all duration-300 ${animateCard ? 'transform scale-102 shadow-lg shadow-purple-500/30' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-grow min-w-0">
                    <div className="text-3xl animate-float">{fileIcon}</div>
                    <div className="flex-grow min-w-0">
                        <p className="font-semibold truncate text-white" title={file.fileName}>{file.fileName}</p>
                        <p className="text-xs text-gray-400 truncate" title={file.id}>ID: {file.id.substring(0, 10)}...</p>
                        <p className="text-xs text-gray-400">{formattedDate}</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${isOwner ? 'bg-indigo-900 bg-opacity-50 text-indigo-300 border border-indigo-500' : 'bg-gray-800 bg-opacity-50 text-gray-300 border border-gray-600'}`}>
                        {isOwner ? "My File" : "Shared"}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                        file.protection === 'password' 
                            ? 'bg-yellow-900 bg-opacity-50 text-yellow-300 border border-yellow-600' 
                            : 'bg-green-900 bg-opacity-50 text-green-300 border border-green-600'
                    }`}>
                        {file.protection === 'password' ? '🔒 Password' : '🔑 RSA'}
                    </span>
                </div>
            </div>
            
            <div className="flex flex-wrap justify-end gap-2 mt-3">
                <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="btn btn-sm px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-all hover:shadow-md hover:shadow-blue-500/50 hover:scale-105"
                >
                    {showOptions ? 'Hide Options ▲' : 'Show Options ▼'}
                </button>
                <button
                    onClick={() => onShare(file)}
                    disabled={!isOwner || isLoading}
                    title={!isOwner ? 'You can only share your own files' : 'Share file with another user'}
                    className="btn btn-sm px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-all hover:shadow-md hover:shadow-purple-500/50 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                >
                    {isLoading ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                    ) : '🔗'} Share
                </button>
            </div>
            
            {showOptions && (
                <div className="mt-3 p-3 glass rounded-lg flex flex-wrap gap-2 animate-fadeIn">
                    <button
                        onClick={() => handleDownload()}
                        disabled={(!isOwner && file.protection !== 'password') || isLoading}
                        title={(!isOwner && file.protection !== 'password') ? 'You do not have the key for this file' : 'Download and decrypt file'}
                        className="btn btn-sm px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-800 text-white text-xs font-medium transition-all hover:shadow-md hover:shadow-gray-500/50 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                    >
                        {isLoading ? (
                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                        ) : '📥'} Download Decrypted
                    </button>
                    <button
                        onClick={() => handleDownload({ rawEncrypted: true })}
                        disabled={isLoading}
                        title="Download the encrypted file in cipher text format"
                        className="btn btn-sm px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-medium transition-all hover:shadow-md hover:shadow-purple-500/50 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                    >
                        {isLoading ? (
                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                        ) : '🔒'} Download Encrypted
                    </button>
                    <button
                        onClick={handleDownloadRaw}
                        disabled={isLoading}
                        title="Download the encrypted file with metadata"
                        className="btn btn-sm px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-800 text-white text-xs font-medium transition-all hover:shadow-md hover:shadow-green-500/50 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                    >
                        {isLoading ? (
                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                        ) : '📋'} Download with Metadata
                    </button>
                </div>
            )}
        </div>
    );
}

export default function FileList({ files, userKeyPair, onDownload, onShare, p2p, updateStatus }) {
    const [publicKeyJwk, setPublicKeyJwk] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (userKeyPair) {
                const jwk = await Crypto.exportKey(userKeyPair.publicKey);
                if (mounted) setPublicKeyJwk(JSON.stringify(jwk));
            } else {
                if (mounted) setPublicKeyJwk(null);
            }
        })();
        
        // Simulate loading for better UX
        setTimeout(() => {
            if (mounted) setIsLoading(false);
        }, 800);

        return () => { mounted = false; };
    }, [userKeyPair]);
    
    // Sort files by timestamp, newest first
    const sortedFiles = useMemo(() => {
        return [...files].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [files]);
    
    const filteredFiles = useMemo(() => {
        if (!searchTerm.trim()) return sortedFiles;
        const term = searchTerm.toLowerCase();
        return sortedFiles.filter(file => 
            file.fileName.toLowerCase().includes(term) || 
            file.id.toLowerCase().includes(term)
        );
    }, [sortedFiles, searchTerm]);

    if (isLoading) {
        return (
            <div className="card bg-white rounded-lg shadow p-5">
                <h2 className="text-xl font-bold mb-3">3. Network Files</h2>
                <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-white rounded-lg shadow p-5">
            <h2 className="text-xl font-bold mb-3">3. Network Files</h2>
            
            <div className="mb-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search files by name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="absolute left-3 top-2.5 text-gray-400">
                        🔍
                    </div>
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
            
            <div className="space-y-3 animate-fadeIn">
                {filteredFiles.length > 0 ? (
                    filteredFiles.map(file => (
                        <FileItem
                            key={file.id}
                            file={file}
                            isOwner={publicKeyJwk && file.ownerPublicKey && JSON.stringify(file.ownerPublicKey) === publicKeyJwk}
                            onDownload={onDownload}
                            onShare={onShare}
                            p2p={p2p}
                            updateStatus={updateStatus}
                        />
                    ))
                ) : (
                    <div className="text-center py-8 border border-gray-200 rounded-lg">
                        <div className="text-4xl mb-2 animate-bounce">🔍</div>
                        <p className="text-gray-500">No files {searchTerm ? 'match your search' : 'found on the network yet'}.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
