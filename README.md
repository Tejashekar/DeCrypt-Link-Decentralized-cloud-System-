# DeCrypt-Link-Decentralized-cloud-System-
A Decentral cloud based file sharing system that securely helps in file transfer, it is a functional, serverless decentralized storage application that places the user in complete control of their data. It demonstrates how a combination of modern decentralized technologies and client-side cryptography can provide a truly sovereign and secure alternative to traditional cloud storage.

The Problem with Centralized Cloud Storage
The dominant model for cloud storage (Google Drive, Dropbox, iCloud) forces users to relinquish control of their data and trust a single corporate entity. This custodial model creates three critical issues:

Erosion of Privacy: Providers can and do scan user files for monetization, moderation, and data analysis.

Systemic Security Risks: Centralized "honeypots" of user data are prime targets for large-scale breaches.

Lack of User Sovereignty: Users are subject to censorship, arbitrary account suspension, and potential data loss without recourse.

In this model, you don't truly own your data; you're just renting space on someone else's servers.

Our Solution: A Zero-Knowledge, User-Owned Platform
DeCrypt-Link fixes this by building a system where you are the only one in control.

Zero-Knowledge: All files are encrypted in your browser before they ever leave your machine. The network only stores meaningless, scrambled data.

No Central Server: The application is fully serverless. There is no central point of failure, control, or censorship.

True Ownership: Your identity is a cryptographic key pair that only you hold. You have absolute ownership and control over your data.

Core Features
Secure Client-Side Encryption: Uses the browser's native Web Crypto API for all cryptographic operations (AES-GCM for files, RSA-OAEP for keys).

Decentralized Identity: Users generate and control their own public/private key pairs.

Distributed Storage: Encrypted file content is stored on the InterPlanetary File System (IPFS) for persistent, resilient storage.

Real-Time P2P Database: File metadata is synchronized directly between active users via OrbitDB, a serverless P2P database.

Secure Sharing: Users can securely share files with others via a cryptographic key exchange, without re-uploading the file.

Persistent & Reliable: Leverages a pinning service (Infura) to ensure data remains available even when peers are offline.

How It Works
The application uses a hybrid encryption model and a dual IPFS connection strategy for maximum security and performance.

Initialization: The app starts a lightweight ipfs-core node in the browser for P2P communication and connects to a remote ipfs-http-client (Infura) for reliable uploads. It then initializes an OrbitDB instance on top of the local node.

Encryption: When a user uploads a file, a new symmetric AES key is generated. This key is used to encrypt the file's content.

Key Wrapping: The AES key itself is then encrypted using the user's public RSA key.

IPFS Upload: The encrypted file content is uploaded to IPFS via the http-client, which returns a unique Content ID (CID).

Metadata Publication: A metadata record (containing the filename, CID, and the RSA-wrapped AES key) is published to the peer-to-peer OrbitDB database, which syncs it with all other online users.

Tech Stack:
<img width="942" height="718" alt="image" src="https://github.com/user-attachments/assets/51621da7-6300-4f4d-b631-579aaaba53db" />
Getting Started: Running the Project Locally
To run this project on your local machine, please follow these steps.

Prerequisites
Node.js: You must have Node.js (v16 or higher) and npm installed. You can download it from nodejs.org.

Infura Account: You need a free IPFS project key from Infura.

Installation & Setup
Clone the repository:

git clone [https://github.com/your-username/decrypt-link.git](https://github.com/your-username/decrypt-link.git)
cd decrypt-link

Create an environment file: In the root of the project, create a file named .env.local.

Add your Infura keys: Open .env.local and add your Infura Project ID and Project Secret.

VITE_INFURA_PROJECT_ID=YOUR_PROJECT_ID_HERE
VITE_INFURA_PROJECT_SECRET=YOUR_PROJECT_SECRET_HERE

Install dependencies:
(Note: On Windows, you may need to run this command in a terminal with Administrator privileges to handle symbolic links.)

npm install

Run the development server:

npm run dev
