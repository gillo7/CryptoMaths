import { Link } from 'react-router-dom'
import type { Topic } from '../topics'
import './TopicPage.css'

function TopicPage({ topic }: { topic: Topic }) {
  return (
    <main className="topic-page">
      <Link to="/" className="back-link">
        ← Back
      </Link>
      <h1>{topic.name}</h1>
      <p>Content coming soon.</p>
    </main>
  )
}

export default TopicPage
