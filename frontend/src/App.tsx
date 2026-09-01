import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import TopicPage from './pages/TopicPage'
import Encoding from './pages/Encoding'
import Hashing from './pages/Hashing'
import HashingAlgorithm from './pages/HashingAlgorithm'
import SymmetricEncryption from './pages/SymmetricEncryption'
import BlockCiphers from './pages/BlockCiphers'
import BlockCipherAlgorithm from './pages/BlockCipherAlgorithm'
import StreamCiphers from './pages/StreamCiphers'
import StreamCipherAlgorithm from './pages/StreamCipherAlgorithm'
import PublicKeyEncryption from './pages/PublicKeyEncryption'
import KeyExchange from './pages/KeyExchange'
import DiffieHellman from './pages/DiffieHellman'
import Ecdh from './pages/Ecdh'
import CurvesInPractice from './pages/CurvesInPractice'
import Certificates from './pages/Certificates'
import PostQuantumCryptography from './pages/PostQuantumCryptography'
import MlKem from './pages/MlKem'
import MlDsa from './pages/MlDsa'
import SlhDsa from './pages/SlhDsa'
import Hqc from './pages/Hqc'
import ScrollToTop from './ScrollToTop'
import { topics } from './topics'

const CUSTOM_TOPIC_SLUGS = new Set([
  'encoding',
  'hashing',
  'symmetric-encryption',
  'public-key-encryption',
  'key-exchange',
  'certificates',
  'post-quantum-cryptography',
])

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/encoding" element={<Encoding />} />
        <Route path="/hashing" element={<Hashing />} />
        <Route path="/hashing/:algo" element={<HashingAlgorithm />} />
        <Route path="/symmetric-encryption" element={<SymmetricEncryption />} />
        <Route
          path="/symmetric-encryption/block-ciphers"
          element={<BlockCiphers />}
        />
        <Route
          path="/symmetric-encryption/block-ciphers/:algo"
          element={<BlockCipherAlgorithm />}
        />
        <Route
          path="/symmetric-encryption/stream-ciphers"
          element={<StreamCiphers />}
        />
        <Route
          path="/symmetric-encryption/stream-ciphers/:algo"
          element={<StreamCipherAlgorithm />}
        />
        <Route path="/public-key-encryption" element={<PublicKeyEncryption />} />
        <Route path="/key-exchange" element={<KeyExchange />} />
        <Route path="/key-exchange/diffie-hellman" element={<DiffieHellman />} />
        <Route path="/key-exchange/ecdh" element={<Ecdh />} />
        <Route path="/key-exchange/curves" element={<CurvesInPractice />} />
        <Route path="/certificates" element={<Certificates />} />
        <Route
          path="/post-quantum-cryptography"
          element={<PostQuantumCryptography />}
        />
        <Route path="/post-quantum-cryptography/ml-kem" element={<MlKem />} />
        <Route path="/post-quantum-cryptography/ml-dsa" element={<MlDsa />} />
        <Route path="/post-quantum-cryptography/slh-dsa" element={<SlhDsa />} />
        <Route path="/post-quantum-cryptography/hqc" element={<Hqc />} />
        {topics
          .filter((topic) => !CUSTOM_TOPIC_SLUGS.has(topic.slug))
          .map((topic) => (
            <Route
              key={topic.slug}
              path={`/${topic.slug}`}
              element={<TopicPage topic={topic} />}
            />
          ))}
      </Routes>
    </>
  )
}

export default App
