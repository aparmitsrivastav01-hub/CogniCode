import { ArrowLeft, Check, CircleHelp, ShieldCheck, Target, Trophy } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { RoundSession } from '../types/round';
import { cartRound } from '../data/rounds';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { resultsCopy } from '../data/results';

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
  const session = (location.state as RoundSession | null) ?? emptySession;
  const exactBug = session.markedBug?.file === cartRound.bug.file && session.markedBug?.line === cartRound.bug.line;
  const sameFile = session.markedBug?.file === cartRound.bug.file;
  const bugScore = exactBug ? 100 : sameFile ? 50 : 0;
  const outputScore = session.outputCorrect && session.outputAttempts
    ? Math.max(1, Math.round(100 / session.outputAttempts))
    : 0;
  const decoyDecision = [...session.interactions].reverse().find(item => item.message === cartRound.decoy.text);
  const answeredOutsideDecoy = Boolean(session.markedBug) && session.markedBug?.file !== cartRound.decoy.pointsTo;
  const answeredDecoy = session.markedBug?.file === cartRound.decoy.pointsTo;
  const aiScore = decoyDecision?.choice === 'verify' && answeredOutsideDecoy
    ? 100
    : decoyDecision?.choice === 'trust' && answeredDecoy ? 0 : 50;
  const cards = [
    { title: 'Output', score: outputScore, icon: Target },
    { title: 'Bug', score: bugScore, icon: Check },
    { title: 'Explanation', score: 'Not graded yet', icon: CircleHelp },
    { title: 'AI verification', score: aiScore, icon: ShieldCheck },
  ];
  return <div className="page-shell"><Header/><main className="results-page">
    <Link to={'/challenge/' + cartRound.id} className="back-link"><ArrowLeft size={15}/> Back to round</Link>
    <div className="results-title"><span className="results-trophy"><Trophy size={22}/></span><div><div className="eyebrow">{session.timedOut ? 'TIME EXPIRED' : 'ROUND COMPLETE'}</div><h1>{resultsCopy.title}</h1></div></div>
    <p className="page-intro">{resultsCopy.summary}</p>
    <div className="score-grid">{cards.map(card => {const Icon=card.icon; return <article className="score-card" key={card.title}><span className="score-icon"><Icon size={18}/></span><span className="score-label">{card.title}</span><strong className={typeof card.score === 'string' ? 'score-ungraded' : ''}>{card.score}{typeof card.score === 'number'&&<small>/100</small>}</strong>{typeof card.score === 'number'&&<div className="score-track"><i style={{width:card.score + '%'}}/></div>}</article>;})}</div>
    <section className="review-panel"><h2>Round review</h2><p>{exactBug ? 'Correct: you marked ' + cartRound.bug.file + ' line ' + cartRound.bug.line + '.' : sameFile ? 'Partial: you found the correct file but marked a different line.' : 'The faulty comparison is in ' + cartRound.bug.file + ' line ' + cartRound.bug.line + '.'}</p><p>{resultsCopy.attempts(session.outputAttempts)} Hints revealed: {session.hintsRevealed.length}. {resultsCopy.explanation}</p>{session.markedBug&&<p>Your final bug answer: {session.markedBug.file} : {session.markedBug.line}</p>}</section>
    <Link to="/challenges" className="button button-primary">Explore challenges <ArrowLeft size={15} className="rotate-icon"/></Link>
  </main><Footer/></div>;
}
