import { useEffect } from 'react';
import { ArrowLeft, Check, CircleHelp, ShieldCheck, Target, Trophy } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { RoundSession } from '../types/round';
import { cartRound } from '../data/rounds';
import { getChallengeBySlug } from '../data/challenges';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { resultsCopy } from '../data/results';
import { leaderboardRepository } from '../data/leaderboard';

const emptySession: RoundSession = {
  outputAttempts: 0,
  outputCorrect: false,
  markedBug: null,
  interactions: [],
  hintsRevealed: [],
  submitted: false,
  timedOut: false,
  explanation: '',
};

export default function Results() {
  const location = useLocation();
  const state = location.state as (RoundSession & { roundId?: string }) | null;
  const session = state ?? emptySession;
  const currentRound = (state?.roundId ? getChallengeBySlug(state.roundId) : null) ?? cartRound;

  const exactBug = session.markedBug?.file === currentRound.bug.file && session.markedBug?.line === currentRound.bug.line;
  const sameFile = session.markedBug?.file === currentRound.bug.file;
  const bugScore = exactBug ? 100 : sameFile ? 50 : 0;
  const outputScore = session.outputCorrect && session.outputAttempts
    ? Math.max(1, Math.round(100 / session.outputAttempts))
    : 0;
  const decoyDecision = [...session.interactions].reverse().find(item => item.message === currentRound.decoy.text);
  const answeredOutsideDecoy = Boolean(session.markedBug) && session.markedBug?.file !== currentRound.decoy.pointsTo;
  const answeredDecoy = session.markedBug?.file === currentRound.decoy.pointsTo;
  const aiScore = decoyDecision?.choice === 'verify' && answeredOutsideDecoy
    ? 100
    : decoyDecision?.choice === 'trust' && answeredDecoy ? 0 : 50;

  useEffect(() => {
    if (session.submitted) {
      const totalAccuracy = Math.round((outputScore + bugScore + aiScore) / 3);
      const isSolved = exactBug && session.outputCorrect;
      const dedupeKey = `cognicode_rec_${currentRound.id}_${session.outputAttempts}_${session.markedBug?.line ?? 0}`;

      if (!sessionStorage.getItem(dedupeKey)) {
        sessionStorage.setItem(dedupeKey, '1');
        leaderboardRepository.recordCompletion({
          roundId: currentRound.id,
          userHandle: leaderboardRepository.getUserHandle() || 'You',
          solved: isSolved,
          timeSpentSeconds: session.timedOut ? 600 : 240,
          hintsRevealedCount: session.hintsRevealed.length,
          accuracy: totalAccuracy,
        });
      }
    }
  }, [session.submitted]);

  const cards = [
    { title: 'Output', score: outputScore, icon: Target },
    { title: 'Bug', score: bugScore, icon: Check },
    { title: 'Explanation', score: 'Not graded yet', icon: CircleHelp },
    { title: 'AI verification', score: aiScore, icon: ShieldCheck },
  ];

  return (
    <div className="page-shell">
      <Header />
      <main className="results-page">
        <Link to={'/challenge/' + currentRound.id} className="back-link">
          <ArrowLeft size={15} /> Back to round
        </Link>
        <div className="results-title">
          <span className="results-trophy">
            <Trophy size={22} />
          </span>
          <div>
            <div className="eyebrow">{session.timedOut ? 'TIME EXPIRED' : 'ROUND COMPLETE'}</div>
            <h1>{currentRound.title || resultsCopy.title}</h1>
          </div>
        </div>
        <p className="page-intro">{resultsCopy.summary}</p>
        <div className="score-grid">
          {cards.map(card => {
            const Icon = card.icon;
            return (
              <article className="score-card" key={card.title}>
                <span className="score-icon">
                  <Icon size={18} />
                </span>
                <span className="score-label">{card.title}</span>
                <strong className={typeof card.score === 'string' ? 'score-ungraded' : ''}>
                  {card.score}
                  {typeof card.score === 'number' && <small>/100</small>}
                </strong>
                {typeof card.score === 'number' && (
                  <div className="score-track">
                    <i style={{ width: card.score + '%' }} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
        <section className="review-panel">
          <h2>Round review</h2>
          <p>
            {exactBug
              ? 'Correct: you marked ' + currentRound.bug.file + ' line ' + currentRound.bug.line + '.'
              : sameFile
              ? 'Partial: you found the correct file but marked a different line.'
              : 'The faulty comparison is in ' + currentRound.bug.file + ' line ' + currentRound.bug.line + '.'}
          </p>
          <p>
            {resultsCopy.attempts(session.outputAttempts)} Hints revealed:{' '}
            {session.hintsRevealed.length}. {resultsCopy.explanation}
          </p>
          {session.markedBug && (
            <p>
              Your final bug answer: {session.markedBug.file} : {session.markedBug.line}
            </p>
          )}
        </section>
        <Link to="/challenges" className="button button-primary">
          Explore challenges <ArrowLeft size={15} className="rotate-icon" />
        </Link>
      </main>
      <Footer />
    </div>
  );
}
