# The Cryptography Lab

*From ancient ciphers to post-quantum*

Learning cryptography by using it: read about the history, the concepts and the theory, see how it works, build it, break it, then make it stronger.

A book project, written with Prof Bill Buchanan and built on the Applied Cryptography MSc module, our own CryptoMaths.org and our other projects and current research. 

## The idea

Every chapter provides a historical and theoretical background, interspersed with practical exercises and examples of implementations, with the reader running real cryptography on a computer they own, with a final challenge to solve alone.

All you need is a laptop/desktop computer (Windows, Linux or macOS) and this book. Every lab runs in the same Ubuntu Server virtual machine, so it works the same for everyone, whatever their laptop. 

Almost everything happens on the command line: you connect to your VM and keep your work in your own GitHub repo. 

Only break what you own: every attack in this book runs on your own kit or on targets built for testing.

## Chapters

Prelude: setting up the lab
- Create a GitHub account
- Install VS Code and git, and sign in to GitHub
- Clone the book's repo onto your laptop, to read it in VS Code
- Install VirtualBox (Windows, Linux, Intel Mac) or UTM (Apple Silicon Mac)
- Install Ubuntu Server 26.04 LTS in a VM, ticking "Install OpenSSH server"
- Set up the VM's two networks: NAT to reach the internet (apt, curl), and a host-only network for SSH, the exercises and tcpdump captures
- Open VS Code's terminal and ssh into your VM
- Install the book's tools in the VM, with the one command supplied
- Write "hello world" in python with nano, run it and cat it. Setup done!

1. Ciphers and encoding
- Theory
  - Historical ciphers
  - Binary, Hex, Base64, ASCII
- Practical
  - use python to create a Caesar cipher
  - use python to decode encode between ASCII, hex, base64 and binary.
- Advanced
  - use python to break ciphers examples
- Challenge
  - given a cipher, and using all techniques used in the lab, can you break it? 

2. Hashing and passwords
- Theory
  - Hashing the why and the how
  - Different hashing methods
  - Hashing attacks and defences
  - Passwords and Key entropy
- Practical
  - Use OpenSSL to create hashes (different methods)
  - Find the shadow file and its hashes
  - Given a supplied shadow file example using an older hash type, use John to try and crack the user password using a dictionary attack, then see how much slower your own system's yescrypt hashes are
  - Use md5 library to perform a rainbow table attack, see how salt makes that useless
  - Calculate key entropy using python
- Advanced
  - Explore password complexity and its relationship to key entropy with python
  - Create a md5 collision
- Challenge
  - Given a set of password rules and some information about a user, crack their shadow file credentials using a grepped dictionary.

3. Randomness, keys and symmetric encryption
- Theory
  - DES/3DES, short keys export
  - AES and block modes (ECB penguin anyone?)
  - Stream symmetric encryption schemes
  - Other symmetric encryption schemes
  - On the matter of randomness and IVs
  - Key derivation (HKDF, PBKDF2)
  - MACs and HMAC
  - AES GCM and the future?
- Practical
  - Encrypt/decrypt a text using different Symmetric encryption schemes and modes using OpenSSL
  - Compare /dev/urandom with a badly seeded generator
  - Set up a gocryptfs vault to protect your keys
- Advanced
  - Benchmark different symmetric block and stream modes for efficiency
  - Reuse a nonce with a stream cipher and recover the plaintext
  - Given most of the key, break DES by searching the rest
- Challenge
  - You found a key! You have a cipher. But no clue on which encryption method was used..

4. Asymmetric encryption and key exchange
- Theory
  - RSA
  - Diffie Hellman
  - Elliptic Curves
  - Forward secrecy
- Practical
  - Create your own RSA keys using python and use it to encrypt a message
  - Exchange your keys using Diffie Hellman
  - Create your own EC keys using python 
- Advanced
  - Given p, break RSA
  - On a tiny toy curve, brute-force the secret from the public point and break ECDH
- Challenge
  - Using python, break a weak RSA key

5. Signatures, certificates and Merkle trees
- Theory
  - Why sign stuff?
  - Why certificates?
  - Why Merkle Trees?
- Practical
  - Signing methods in practice using OpenSSL
  - Explore certificates
  - Create a Merkle Tree
- Advanced
  - Perform an Eve-in-the-Middle signing attack, given Alice's private key.
  - Create certificates and your own small CA (OpenSSL)
- Challenge
  - Given a poorly made weak certificate... break the RSA and spoof it!

6. TLS
- Theory
  - History (The past, SSL, TLS 1.0, TLS 1.3)
  - The handshake, clienthello serverhello etc.
  - The selectable algorithms
  - The backbone of the internet
- Practical
  - Capture http traffic with tcpdump, analyse it in wireshark
  - Capture https traffic with tcpdump, analyse it in wireshark
  - Analyse websites
- Advanced
  - Create small webserver
  - Use a certificate from your own CA to make it https (apache/nginx), tls1.3 in action
  - Optional: if you have a domain name, use let's encrypt instead
- Challenge
  - Given two captures and the server's private key, decrypt the old RSA key exchange in wireshark, then find out why the ECDHE one stays locked

7. Post-quantum cryptography
- Theory
  - Why PQC needed? CRQC and the Q-day
  - ML-KEM, ML-DSA, Hybrids
  - SLH, HQC, and candidates
  - Horror stories
- Practical
  - Using OpenSSL 3.5+, create and explore keys and signatures, encapsulation and decapsulation
- Advanced
  - Change the current setup of the webserver config to hybrid key exchange, and prove it with an OpenSSL client and a capture
  - Go fully post-quantum with an ML-DSA certificate from your own CA, and see why browsers would refuse it while an OpenSSL client connects
  - Look at the different packet sizes between EC and PQC methods
  - Quick speed and latency comparison between EC and PQC methods
- Challenge
  - Write a python program to break a toy LWE scheme with tiny parameters, then raise them and see why the attack stops working

8. Blockchain
- Theory
  - Why a blockchain? Trust without a central authority
  - Hash chains, and Merkle Trees put to work
  - Proof of work and consensus
  - Signed transactions, secp256k1 and addresses
  - Smart contracts
  - What a blockchain does not protect, and the quantum threat to its signatures
- Practical
  - Build a small blockchain using python
  - Mine blocks, and see how difficulty changes the time taken
  - Sign and verify transactions
- Advanced
  - Run a private test network in your VM (no real coins!)
  - Tamper with a block, and watch validation fail
  - Given two signatures which reused a nonce, recover the ECDSA private key
- Challenge
  - Forge a block in a deliberately weak chain, then fix the flaw

9. Homomorphic encryption and zero-knowledge proofs
- Theory
  - Why compute on encrypted data?
  - RSA's hidden trick: multiply two ciphertexts, and you multiply the messages
  - Paillier: add numbers while they stay encrypted
  - Zero-knowledge proofs: prove you know a secret without revealing it
  - Schnorr proofs, built on the Diffie Hellman maths of chapter 4
  - Where this is going: fully homomorphic encryption and SNARKs, in short
- Practical
  - Using python and small numbers, multiply two RSA ciphertexts and check the result by hand
  - Create a toy Paillier scheme using python, add two numbers while they stay encrypted
  - Create a Schnorr proof using python: prove you know a secret without showing it
- Advanced
  - Cheat the Schnorr proof when the verifier's challenge is predictable
- Challenge
  - Total a set of encrypted votes without decrypting any single one

10. Measure it, migrate it
- Theory
  - Benchmarking properly: medians, noise and outliers
  - Time, memory and energy
  - Side channels: when timing gives away secrets
  - Mosca's inequality and the QARS risk score
  - CBOMs: knowing what crypto you actually run
  - Migration plans and government timelines
- Practical
  - Benchmark classical against PQC methods on your own laptop, and compare with your classmates' results
  - Run a benchmark once, then many times, and see why one number can't be trusted
  - Create a CBOM of your own VM
- Advanced
  - Perform a timing attack against a naive password check, then fix it
- Challenge
  - Audit your own VM, score its risk and write its migration plan. Then carry it out!

11. Cryptography on tiny devices
- Theory
  - IoT: billions of small devices, in service for years, all needing crypto
  - Tiny computers and microcontrollers: a Pi Zero W runs Linux on very little, a Pico has no operating system and kilobytes of memory
  - Where does randomness come from with no operating system?
  - Keeping keys safe: separate devices, secure elements, secure boot
  - Side channels: when timing gives away secrets
  - wolfSSL: a TLS library built for small devices, compared to OpenSSL
  - PQC on microcontrollers: what fits, and what does not
- Practical
  - Set up your Pi Zero W and Pico 2 W, flash your first program on the Pico
  - Build wolfSSL on the Pi Zero W, and compare it with OpenSSL
  - Generate keys from a badly seeded generator, then use the Pico 2's true random number generator instead
  - Turn the Pico into a signing device: it signs what your Pi Zero W sends it, and never reveals its key
  - Make a TLS 1.3 connection from the Pico to a server on your Pi Zero W, using wolfSSL
- Advanced
  - Perform a timing attack against a naive password check on the Pico, then fix it
  - Push the Pico until it runs out of memory, and find which PQC algorithms fit
  - Run chapter 10's benchmark on the Pi Zero W and the Pico, measure their energy with a USB power meter (optional kit), and compare them with your laptop
- Challenge
  - Find the strongest TLS setup the Pico can run, and prove it with a packet capture

