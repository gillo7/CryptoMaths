import { Link } from 'react-router-dom'
import './About.css'
import './Hashing.css'

function About() {
  return (
    <main className="about-page">
      <Link to="/" className="back-link">
        ← Back
      </Link>

      <h1>About</h1>

      <section>
        <p>
          My name is Olivier Gillot, I am a Belgian long settled in
          Scotland. After travelling the world working in hospitality
          through my twenties and teaching my native language in
          Edinburgh throughout my thirties, a keen interest for IT and
          robotics found during the Covid lockdowns snowballed into an
          IT degree with the Open University in 2025, then an on-going
          Master in Cybersecurity with the Edinburgh Napier University.
        </p>

        <img
          src="/images/olivier-gillot.jpg"
          alt="Olivier Gillot"
          className="about-photo"
        />

        <p>
          There, I had the chance to discover the universe of Applied
          Cryptography through the teachings of Prof. Buchanan.
          Discovering the inner workings of RSA for the first time,
          with its elegant and simple math, triggered an interest that
          verged on obsession for all things cryptographic. Having
          built multiple robots on old Raspberry pis, it became my
          goal to see how and if cryptography could and would run on
          these, and this in turn became a published paper and my
          dissertation subject.
        </p>
        <p>
          This web-app came to be when I realised that if I was going
          to spend the summer revising my own notes from the course,
          why not turn that revision into something everyone could
          use? This is how this started, and hopefully I will
          keep adding things as time goes by. The contents are all
          strongly inspired by Prof. Buchanan’s ideas found on his own
          site asecuritysite.com, whilst the frontend and backend
          crypto exercises and benchmarks are all mine, I just
          followed his examples and try to learn more by creating my
          own implementation.
        </p>
        <a
          href="https://asecuritysite.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="article-preview"
        >
          <span className="article-kicker">Official site</span>
          <p className="article-title">ASecuritySite.com</p>
          <p className="article-byline">Prof Bill Buchanan OBE</p>
        </a>
        <p>
          If you would like to use any of the contents found on this
          site, be my guest! Whilst I have done my best to keep
          everything as accurate and relevant as possible, I cannot
          guarantee that everything is perfect and this is a
          fast-moving area and some information that might have been
          correct when I wrote it may be out-of-date when you find it.
          If you find any of these inaccuracies, I would greatly
          appreciate it if you’d let me know via{' '}
          <a href="mailto:gillot.olivier6@gmail.com">email</a> so I
          can check these.
        </p>
      </section>
    </main>
  )
}

export default About
