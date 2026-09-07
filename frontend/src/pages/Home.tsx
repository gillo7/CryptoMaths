import { Link } from 'react-router-dom'
import { topics } from '../topics'
import './Home.css'

function Home() {
  return (
    <main className="home">
      <h1 className="logo-lockup">
        <img
          src="/images/cryptomaths_favicon.svg"
          alt=""
          className="logo-mark"
        />
        <picture>
          <source
            srcSet="/images/wordmark_dark.svg"
            media="(prefers-color-scheme: dark)"
          />
          <img
            src="/images/wordmark.svg"
            alt="CryptoMaths"
            className="logo-wordmark"
          />
        </picture>
      </h1>
      <nav className="topics">
        {topics.map((topic) => (
          <Link key={topic.slug} to={`/${topic.slug}`} className="topic-card">
            {topic.name}
          </Link>
        ))}
      </nav>

      <hr className="home-divider" />

      <Link to="/about" className="about-link">
        About this project →
      </Link>
    </main>
  )
}

export default Home
