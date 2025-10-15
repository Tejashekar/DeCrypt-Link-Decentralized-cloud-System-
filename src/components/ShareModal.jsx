import { useState } from 'react';

export default function ShareModal({ file, onClose, onShare }) {
    const [recipientKey, setRecipientKey] = useState('');
    const [isSharing, setIsSharing] = useState(false);

    const handleShareClick = async () => {
        if (!recipientKey) {
            alert("Recipient's public key is required.");
            return;
        }
        setIsSharing(true);
        await onShare(recipientKey);
        setIsSharing(false);
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
            <div className="card bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-md">
                <h3 className="text-lg font-bold mb-4">Share File</h3>
                <p className="text-sm mb-2">To share "<span className="font-semibold">{file.fileName}</span>", paste the recipient's Public Key below.</p>
                <textarea
                    id="recipientPublicKey"
                    rows="4"
                    value={recipientKey}
                    onChange={(e) => setRecipientKey(e.target.value)}
                    className="w-full p-2 border rounded-md font-mono text-xs"
                    placeholder="Paste recipient's Public Key (JSON)..."
                />
                <div className="mt-4 flex justify-end gap-3">
                    <button onClick={onClose} className="btn btn-outline border border-gray-400 text-gray-600 hover:bg-gray-100 py-2 px-4 rounded">
                        Cancel
                    </button>
                    <button
                        onClick={handleShareClick}
                        disabled={isSharing}
                        className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:bg-indigo-400"
                    >
                        {isSharing ? 'Sharing...' : 'Share'}
                    </button>
                </div>
            </div>
        </div>
    );
}
