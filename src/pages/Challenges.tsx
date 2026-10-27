import { useMemo, useState } from 'react';
import { ArrowRight, Clock, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Chip } from '../components/page/Chip';
import { Badge, type BadgeProps } from '../components/page/Badge';
import { Card } from '../components/page/Card';
import { challenges } from '../data/challenges';
import type { Challenge } from '../types/round';

type DifficultyFilter = 'All' | 'Easy' | 'Medium' | 'Hard';

export default function Challenges() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>('All');

  const filteredChallenges = useMemo(() => {
    const list = selectedDifficulty === 'All'
      ? [...challenges]
      : challenges.filter(c => c.difficulty === selectedDifficulty);

    const difficultyPriority: Record<string, number> = {
      Easy: 1,
      Medium: 2,
      Hard: 3,
    };

    // Sort Easy to Hard by default
    return list.sort((a, b) => {
      const diffA = difficultyPriority[a.difficulty] ?? 2;
      const diffB = difficultyPriority[b.difficulty] ?? 2;
      if (diffA !== diffB) return diffA - diffB;
      return a.title.localeCompare(b.title);
    });
  }, [selectedDifficulty]);

  const getDifficultyVariant = (diff: Challenge['difficulty']): BadgeProps['variant'] => {
    switch (diff) {
      case 'Easy':
        return 'success';
      case 'Medium':
        return 'warn';
      case 'Hard':
        return 'purple';
      default:
        return 'default';
    }
  };

  return (
    <div className="page-shell">
      <Header />
      <main className="listing-page challenges-page">
        {/* HERO / HEADER */}
        <div className="eyebrow">
          <span className="eyebrow-dot" />
          PRACTICE ROUNDS
        </div>
        <h1>
          Choose your next <span className="serif-accent">challenge.</span>
        </h1>
        <p className="page-intro">
          Realistic multi-file codebases with subtle, isolated bugs. Trace execution across layers, test hypotheses, and verify AI recommendations.
        </p>

        {/* CONTROLS: DIFFICULTY FILTER & COUNTER */}
        <div className="challenges-controls-bar">
          <div className="challenges-filter-chips">
            {(['All', 'Easy', 'Medium', 'Hard'] as DifficultyFilter[]).map(diff => (
              <Chip
                key={diff}
                label={diff}
                active={selectedDifficulty === diff}
                onClick={() => setSelectedDifficulty(diff)}
              />
            ))}
          </div>

          <div className="challenges-meta-count">
            <span className="count-label">
              Showing {filteredChallenges.length} of {challenges.length} challenges
            </span>
          </div>
        </div>

        {/* CHALLENGES GRID */}
        <div className="challenges-grid">
          {filteredChallenges.map(challenge => (
            <Card
              key={challenge.slug}
              className="challenge-tile-card"
              hoverable
            >
              <div className="tile-top-row">
                <div className="tile-badges">
                  <span className="category-pill">{challenge.category}</span>
                  <Badge
                    label={challenge.difficulty}
                    variant={getDifficultyVariant(challenge.difficulty)}
                  />
                </div>
                <div className="tile-est-time">
                  <Clock size={12} className="time-icon" />
                  <span>{challenge.estimatedMinutes} min</span>
                </div>
              </div>

              <div className="tile-body">
                <h2 className="tile-title">{challenge.title}</h2>
                <p className="tile-summary">{challenge.summary}</p>
              </div>

              <div className="tile-tag-row">
                {challenge.tags.map(tag => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="tile-bottom-row">
                <div className="tile-meta-files">
                  <Layers size={13} className="files-icon" />
                  <span>{challenge.files.length} files · Python 3</span>
                </div>
                <Link
                  className="button button-primary tile-start-btn"
                  to={`/challenge/${challenge.slug}`}
                >
                  <span>Start round</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
