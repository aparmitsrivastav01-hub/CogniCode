import { useEffect, useState } from 'react';
import { HelpCircle, RefreshCw, Zap } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PageHeader } from '../components/page/PageHeader';
import { Card } from '../components/page/Card';
import { Chip } from '../components/page/Chip';
import { SignInBanner } from '../components/leaderboard/SignInBanner';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import {
  leaderboardRepository,
  type LeaderboardEntry,
  type LeaderboardTimeframe,
} from '../data/leaderboard';

export default function Leaderboard() {
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('all-time');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userHandle, setUserHandle] = useState<string>(() => {
    return leaderboardRepository.getUserHandle();
  });

  useEffect(() => {
    document.title = 'Leaderboard — CogniCode';
  }, []);

  const loadData = async (activeTimeframe: LeaderboardTimeframe) => {
    setLoading(true);
    try {
      const data = await leaderboardRepository.getEntries(activeTimeframe);
      setEntries(data);
    } catch (err) {
      console.error('Failed to load leaderboard entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(timeframe);
  }, [timeframe, userHandle]);

  const handleSaveHandle = (newHandle: string) => {
    leaderboardRepository.setUserHandle(newHandle);
    setUserHandle(newHandle);
  };

  return (
    <div className="page-shell">
      <Header />
      <main className="listing-page leaderboard-page">
        {/* HEADER */}
        <PageHeader
          eyebrow="GLOBAL RANKINGS"
          title="Leaderboard"
          description="Compete on code comprehension speed, diagnostic accuracy, and AI verification independence. Strictly genuine completions only."
        />

        {/* AUTH / HANDLE CALLOUT */}
        <SignInBanner
          userHandle={userHandle}
          onSaveHandle={handleSaveHandle}
          className="leaderboard-auth-callout"
        />

        {/* CONTROLS BAR: TIMEFRAMES & REFRESH */}
        <div className="leaderboard-controls-bar">
          <div className="timeframe-chips">
            <Chip
              label="All-time"
              active={timeframe === 'all-time'}
              onClick={() => setTimeframe('all-time')}
            />
            <Chip
              label="This week"
              active={timeframe === 'this-week'}
              onClick={() => setTimeframe('this-week')}
            />
          </div>

          <div className="leaderboard-meta-strip">
            <span className="live-pulse">
              <span className="pulse-indicator" />
              Verified Board
            </span>
          </div>
        </div>

        {/* TABLE CONTENT */}
        {loading ? (
          <Card className="leaderboard-loading-card">
            <RefreshCw size={24} className="animate-spin text-purple" />
            <p>Loading ranking metrics...</p>
          </Card>
        ) : (
          <LeaderboardTable entries={entries} />
        )}

        {/* HOW SCORING WORKS FOOTNOTE */}
        <section className="leaderboard-scoring-section">
          <Card className="scoring-explainer-card">
            <div className="explainer-header">
              <HelpCircle size={18} className="explainer-icon" />
              <h3>How scoring works</h3>
            </div>
            <div className="explainer-grid">
              <div className="explainer-item">
                <div className="item-title">
                  <Zap size={14} className="item-icon" />
                  <span>Base & Accuracy</span>
                </div>
                <p>
                  1,000 base points per round successfully resolved, scaled by your prediction and verification accuracy.
                </p>
              </div>

              <div className="explainer-item">
                <div className="item-title">
                  <span className="item-badge-symbol">⚡</span>
                  <span>Speed Bonus</span>
                </div>
                <p>
                  Solving within 10 minutes earns up to +250 bonus points per challenge based on completion speed.
                </p>
              </div>

              <div className="explainer-item">
                <div className="item-title">
                  <span className="item-badge-symbol">💡</span>
                  <span>Hint Reliance</span>
                </div>
                <p>
                  Each assistant hint revealed deducts 75 points. Solving without AI guidance maximizes your standing.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}
