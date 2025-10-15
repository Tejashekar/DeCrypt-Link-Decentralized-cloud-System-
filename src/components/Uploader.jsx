import { useState } from 'react';

export default function Uploader({ onUpload, disabled }) {
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUploadClick = () => {
        if (file) {
            onUpload(file, { password: password || undefined });
            setFile(null); 
            document.getElementById('fileInput').value = '';
        } else {
            alert("Please select a file first.");
        }
    };

    return (
        <div className={`card bg-white rounded-lg shadow p-5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="text-xl font-bold mb-3">2. Upload a File</h2>
            <div className="space-y-4">
                <input
                    type="file"
                    id="fileInput"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                <input
                    type="password"
                    placeholder="Optional password (e.g. Hackathon2025!)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full text-sm text-gray-500 p-2 border rounded"
                />
                <button
                    onClick={handleUploadClick}
                    disabled={disabled || !file}
                    className="btn btn-primary w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-2 px-4 rounded"
                >
                    Encrypt & Upload
                </button>
            </div>
        </div>
    );
}
