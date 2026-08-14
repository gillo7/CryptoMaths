import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import TopicPage from './pages/TopicPage'
import Encoding from './pages/Encoding'
import { topics } from './topics'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/encoding" element={<Encoding />} />
      {topics
        .filter((topic) => topic.slug !== 'encoding')
        .map((topic) => (
          <Route
            key={topic.slug}
            path={`/${topic.slug}`}
            element={<TopicPage topic={topic} />}
          />
        ))}
    </Routes>
  )
}

export default App
