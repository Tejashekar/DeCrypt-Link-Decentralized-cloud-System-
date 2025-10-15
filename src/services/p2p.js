// Mock implementation for IPFS and OrbitDB
// This file simulates the functionality without requiring the actual dependencies

// In-memory storage for files and metadata
const fileStorage = new Map();
const metadataStorage = [];

let orbitdb = null;
let db = null;
let ipfs = null;

export async function init(updateStatus) {
    updateStatus("1/3: Initializing mock IPFS node...", 'loading');
    
    // Create mock IPFS implementation
    ipfs = {
        add: async (blob) => {
            const cid = 'mock-cid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
            const arrayBuffer = await blob.arrayBuffer();
            fileStorage.set(cid, arrayBuffer);
            return { path: cid };
        },
        cat: async function* (cid) {
            const data = fileStorage.get(cid);
            if (!data) {
                throw new Error(`File with CID ${cid} not found`);
            }
            yield new Uint8Array(data);
        }
    };
    
    updateStatus("2/3: Initializing mock OrbitDB database...", 'loading');
    
    // Create mock OrbitDB implementation
    db = {
        add: async (value) => {
            const hash = 'mock-hash-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
            metadataStorage.push({
                hash,
                payload: { value }
            });
            // Trigger events for subscribers
            if (db.events) {
                setTimeout(() => {
                    db.events.emit('write');
                }, 0);
            }
            return hash;
        },
        iterator: ({ limit }) => {
            return {
                collect: () => {
                    if (limit === -1) {
                        return [...metadataStorage];
                    }
                    return metadataStorage.slice(-limit);
                }
            };
        },
        load: async () => {},
        events: {
            _listeners: {
                'replicated': [],
                'write': []
            },
            on: function(event, callback) {
                if (!this._listeners[event]) {
                    this._listeners[event] = [];
                }
                this._listeners[event].push(callback);
            },
            emit: function(event) {
                if (this._listeners[event]) {
                    this._listeners[event].forEach(callback => callback());
                }
            },
            removeAllListeners: function(event) {
                if (this._listeners[event]) {
                    this._listeners[event] = [];
                }
            }
        }
    };
    
    orbitdb = { db };
    
    // Provide a subscribe helper that callers can use to listen in realtime
    function subscribeToFiles(onChange) {
        // Initial load
        const docs = db.iterator({ limit: -1 })
            .collect()
            .map(entry => ({ id: entry.hash, ...entry.payload.value }));
        onChange(docs);

        // Subscribe to updates
        db.events.on('replicated', () => {
            const updatedDocs = db.iterator({ limit: -1 })
                .collect()
                .map(entry => ({ id: entry.hash, ...entry.payload.value }));
            onChange(updatedDocs);
        });

        db.events.on('write', () => {
            const updatedDocs = db.iterator({ limit: -1 })
                .collect()
                .map(entry => ({ id: entry.hash, ...entry.payload.value }));
            onChange(updatedDocs);
        });

        // Return unsubscribe function
        return () => {
            db.events.removeAllListeners('replicated');
            db.events.removeAllListeners('write');
        };
    }

    updateStatus("3/3: Mock P2P network initialized successfully!", 'success');
    return { ipfs, orbitdb, db, subscribeToFiles };
}

export function getDb() { 
    return db; 
}

export function getIpfs() {
    return ipfs;
}

// Helper function to get all files from OrbitDB
export function getAllFiles() {
    if (!db) return [];
    
    return db.iterator({ limit: -1 })
        .collect()
        .map(entry => ({ id: entry.hash, ...entry.payload.value }));
}

// Helper function to find a specific file by ID
export function getFileById(fileId) {
    if (!db) return null;
    
    const entries = db.iterator({ limit: -1 }).collect();
    const entry = entries.find(entry => entry.hash === fileId);
    
    if (!entry) return null;
    
    return { id: entry.hash, ...entry.payload.value };
}
