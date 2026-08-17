import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import TopicPage from './pages/TopicPage'
import Encoding from './pages/Encoding'
import Hashing from './pages/Hashing'
import HashingAlgorithm from './pages/HashingAlgorithm'
import ScrollToTop from './ScrollToTop'
import { topics } from './topics'

const CUSTOM_TOPIC_SLUGS = new Set(['encoding', 'hashing'])

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/encoding" element={<Encoding />} />
        <Route path="/hashing" element={<Hashing />} />
        <Route path="/hashing/:algo" element={<HashingAlgorithm />} />
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
