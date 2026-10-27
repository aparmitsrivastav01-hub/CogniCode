import { useEffect } from 'react';
import { ArrowRight, Code2, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PageHeader } from '../components/page/PageHeader';
import { SectionHeading } from '../components/page/SectionHeading';
import { Card } from '../components/page/Card';
import { Badge } from '../components/page/Badge';
import { HowItWorksCard } from '../components/about/HowItWorksCard';
import { FaqAccordion } from '../components/about/FaqAccordion';
import {
  howItWorksSteps,
  builtWithTechnologies,
  aboutFaqs,
  GITHUB_REPO_URL,
} from '../data/about';

export default function About() {
  useEffect(() => {
    document.title = 'About — CogniCode';
  }, []);

  return (
    <div className="page-shell">
      <Header />
      <main className="listing-page about-page">
        {/* HERO */}
        <PageHeader
          eyebrow="CogniCode"
          title="About"
          description="Practice understanding code, one round at a time."
        />

        {/* HOW IT WORKS */}
        <section className="about-section">
          <SectionHeading
            eyebrow="METHODOLOGY"
            title="How it works"
            subtitle="Three deliberate stages designed to develop code literacy and critical verification."
          />
          <div className="how-it-works-grid">
            {howItWorksSteps.map(step => (
              <HowItWorksCard key={step.step} step={step} />
            ))}
          </div>
        </section>

        {/* WHY CODE COMPREHENSION */}
        <section className="about-section">
          <SectionHeading
            eyebrow="THE SHIFT"
            title="Why code comprehension?"
          />
          <Card className="about-manifesto-card">
            <div className="manifesto-content">
              <p>
                In the era of automated code generation, writing code is no longer the bottleneck. The defining skill of senior software engineers is <strong>reading, auditing, and verifying</strong> code produced by peers and AI systems.
              </p>
              <p>
                When an AI assistant produces confident solutions, subtle defects—such as off-by-one errors, invalid type assumptions, and race conditions—frequently pass unexamined. This is why CogniCode introduces <strong>Trust vs. Verify</strong> choices and realistic assistant decoys: to build the muscle of questioning recommendations against the ground-truth implementation.
              </p>
            </div>
            <div className="manifesto-callout">
              <ShieldCheck size={28} className="manifesto-icon" />
              <div>
                <strong>Verify, don’t blindly trust.</strong>
                <p>Never accept an assistant's explanation without verifying the data invariants in the codebase.</p>
              </div>
            </div>
          </Card>
        </section>

        {/* BUILT WITH */}
        <section className="about-section">
          <SectionHeading
            eyebrow="TECHNOLOGY"
            title="Built with"
            subtitle="Modern open-source technologies powering browser-based code comprehension."
          />
          <div className="built-with-grid">
            {builtWithTechnologies.map(tech => (
              <Card key={tech.name} className="tech-badge-card">
                <Code2 size={16} className="tech-icon" />
                <div className="tech-text">
                  <span className="tech-name">{tech.name}</span>
                  <span className="tech-note">{tech.note}</span>
                </div>
                <Badge label="Active" variant="success" />
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="about-section">
          <SectionHeading
            eyebrow="QUESTIONS"
            title="Frequently asked questions"
          />
          <FaqAccordion items={aboutFaqs} />
        </section>

        {/* CTA ROW */}
        <section className="about-cta-section">
          <Card className="about-cta-card">
            <div className="cta-copy">
              <h2>Ready to practice your reasoning?</h2>
              <p>Jump directly into realistic multi-file challenges and verify code without relying on guess-work.</p>
            </div>
            <div className="cta-actions">
              <Link to="/challenges" className="button button-primary">
                <span>Start a challenge</span>
                <ArrowRight size={15} />
              </Link>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="button button-quiet"
              >
                <span>View on GitHub</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}
