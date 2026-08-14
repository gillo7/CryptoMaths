import { Link } from 'react-router-dom'
import { topics } from '../topics'
import './Home.css'

function Home() {
  return (
    <main className="home">
      <h1>CryptoMaths</h1>
      <p className="subtitle">
        Cryptography keeps the web secure, ever asked yourself how it works?
      </p>
      <nav className="topics">
        {topics.map((topic) => (
          <Link key={topic.slug} to={`/${topic.slug}`} className="topic-card">
            {topic.name}
          </Link>
        ))}
      </nav>
    </main>
  )
}

export default Home
