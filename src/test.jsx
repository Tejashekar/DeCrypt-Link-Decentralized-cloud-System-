import { useState, useEffect } from 'react';
import * as P2P from './services/p2p';
import * as Crypto from './services/crypto';

function TestBackend() {
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState(null);
  const [p2p, setP2p] = useState(null);
  const [keyPair, setKeyPair] = useState(null);

  useEffect(() => {
    async function testBackend() {
      try {
        // Test P2P initialization
        setStatus('Testing P2P initialization...');
        const p2pServices = await P2P.init((msg) => console.log(msg));
        setP2p(p2pServices);
        setStatus('P2P initialized successfully!');
        
        // Test crypto functionality
        setStatus('Testing crypto functionality...');
        const keyPair = await Crypto.generateRsaKeyPair();
        setKeyPair(keyPair);
        setStatus('Crypto functionality working!');
        
        // Final status
        setStatus('Backend services are working correctly!');
      } catch (err) {
        console.error('Backend test failed:', err);
        setError(err.message || 'Unknown error');
        setStatus('Backend test failed');
      }
    }
    
    testBackend();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Backend Test</h1>
      <div style={{ marginBottom: '20px' }}>
        <h2>Status: {status}</h2>
        {error && (
          <div style={{ color: 'red', padding: '10px', border: '1px solid red', borderRadius: '5px' }}>
            <h3>Error:</h3>
            <p>{error}</p>
          </div>
        )}
      </div>
      
      <div>
        <h2>P2P Service:</h2>
        <pre>{p2p ? 'Initialized' : 'Not initialized'}</pre>
      </div>
      
      <div>
        <h2>Crypto Service:</h2>
        <pre>{keyPair ? 'Key pair generated successfully' : 'No key pair generated'}</pre>
      </div>
    </div>
  );
}

export default TestBackend;