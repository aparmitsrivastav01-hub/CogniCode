import { useEffect } from 'react';
import { ArrowRight, BookOpen, Bug, Code2, ShieldCheck, Workflow } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { CodeFlowVisualization } from '../components/CodeFlowVisualization';
import { HowItWorks } from '../components/HowItWorks';
import { RoundTimeline } from '../components/home/roundTimeline/RoundTimeline';
import { brand, homeCopy, pillars, whyNow } from '../data/site';

const icons = { BookOpen, Workflow, Bug, ShieldCheck };

export default function Home() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#how-it-works' || window.location.hash === '#how-it-works') {
      const el = document.getElementById('how-it-works');
      if (el) {
        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        setTimeout(() => {
          el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        }, 60);
      }
    }
  }, [location.hash]);

  const scrollToDemo = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      window.history.replaceState(null, '', '#how-it-works');
    }
  };

  return (
    <div className="page-shell">
      <Header />
      <main className="home-main">
        {/* HERO SECTION */}
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              CODE COMPREHENSION PRACTICE
            </div>
            <h1>
              {brand.headlineStart}
              <br />
              {brand.headlinePrefix}
              <span className="serif-accent">{brand.headlineAccent}</span>
              {brand.headlineSuffix}
            </h1>
            <p className="hero-subtext">{brand.subtext}</p>
            <div className="hero-actions">
              <Link to="/challenges" className="button button-primary">
                {homeCopy.start}
                <ArrowRight size={17} />
              </Link>
              <button
                className="button button-outline"
                onClick={scrollToDemo}
                title="Watch walkthrough demo"
              >
                <span className="play-icon">▶</span>
                {homeCopy.demo}
              </button>
            </div>
            <div className="hero-note">
              <span className="runtime-chip">
                <Code2 size={13} />
                {homeCopy.runtime}
              </span>
              <span>No setup · Start with one round</span>
            </div>
          </div>
          <div className="hero-scene-wrap">
            <CodeFlowVisualization />
          </div>
        </section>

        {/* HOW COGNICODE WORKS (DEMO PLAYER + 4 STAGES) */}
        <HowItWorks />

        {/* PILLARS PRACTICE */}
        <section className="pillars-section">
          <div className="section-heading">
            <span className="eyebrow">THE PRACTICE</span>
            <h2>
              Think like a reader.
              <br />
              <span>Not just a writer.</span>
            </h2>
          </div>
          <div className="pillar-grid">
            {pillars.map((pillar) => {
              const Icon = icons[pillar.icon as keyof typeof icons];
              return (
                <article className="pillar-card" key={pillar.title}>
                  <span className="pillar-icon">
                    <Icon size={19} />
                  </span>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* HOW A ROUND WORKS TIMELINE */}
        <RoundTimeline />

        {/* WHY NOW STRIP */}
        <section className="why-strip">
          <div className="why-icon">
            <Code2 size={17} />
          </div>
          <div>
            <span className="eyebrow">{whyNow.title}</span>
            <p>{whyNow.text}</p>
            <small>{whyNow.source}</small>
          </div>
          <span className="runtime-stamp">
            LOCAL PYTHON <b>RUNTIME</b>
          </span>
        </section>
      </main>
      <Footer />
    </div>
  );
}
