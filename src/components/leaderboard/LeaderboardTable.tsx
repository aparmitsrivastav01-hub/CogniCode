import { Award, Clock, Code2, Lightbulb, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LeaderboardEntry } from '../../data/leaderboard';
import { formatTime } from '../../lib/scoring';
import { Badge } from '../page/Badge';

export interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  className?: string;
}

export function LeaderboardTable({ entries, className = '' }: LeaderboardTableProps) {
  const getRankBadge = (rank?: number) => {
    if (rank === 1) {
      return (
        <span className="rank-badge rank-1" title="1st Place (Gold)">
          <Trophy size={14} className="rank-icon gold" />
          <span>1</span>
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="rank-badge rank-2" title="2nd Place (Silver)">
          <Award size={14} className="rank-icon silver" />
          <span>2</span>
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="rank-badge rank-3" title="3rd Place (Bronze)">
          <Award size={14} className="rank-icon bronze" />
          <span>3</span>
        </span>
      );
    }
    return <span className="rank-badge rank-other">{rank ?? '-'}</span>;
  };

  if (entries.length === 0) {
    return (
      <div className={`leaderboard-empty-container ${className}`}>
        <div className="empty-icon-circle">
          <Trophy size={28} className="empty-trophy-icon" />
        </div>
        <h3 className="empty-title">No verified completions recorded yet</h3>
        <p className="empty-desc">
          CogniCode tracks real Python code comprehension scores without simulated or dummy data.
          Solve your first challenge to claim the top position on the board.
        </p>
        <Link to="/challenges" className="empty-action-link">
          <Code2 size={15} />
          <span>Start solving challenges →</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={`leaderboard-table-wrapper ${className}`}>
      {/* DESKTOP TABLE */}
      <div className="table-responsive-container">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th className="col-rank">Rank</th>
              <th className="col-user">Engineer</th>
              <th className="col-score">Score</th>
              <th className="col-solved">Solved</th>
              <th className="col-time">Avg Time</th>
              <th className="col-hints">Hints</th>
              <th className="col-accuracy">Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => {
              const isTop3 = entry.rank !== undefined && entry.rank <= 3;
              const isCurrent = Boolean(entry.isCurrentUser);

              return (
                <tr
                  key={entry.id}
                  className={`leaderboard-row ${isTop3 ? `top-${entry.rank}` : ''} ${
                    isCurrent ? 'current-user-row' : ''
                  }`}
                >
                  <td className="col-rank">{getRankBadge(entry.rank)}</td>
                  <td className="col-user">
                    <div className="user-cell">
                      <div className="avatar-placeholder">
                        {entry.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <span className="user-name">
                          {entry.name}
                          {isCurrent && (
                            <Badge label="You" variant="purple" className="inline-you-badge" />
                          )}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="col-score">
                    <span className="score-value">{entry.score.toLocaleString()}</span>
                  </td>
                  <td className="col-solved">
                    <span className="metric-pill">{entry.solved}</span>
                  </td>
                  <td className="col-time">
                    <div className="time-cell">
                      <Clock size={13} className="cell-icon" />
                      <span>{formatTime(entry.avgTimeSeconds)}</span>
                    </div>
                  </td>
                  <td className="col-hints">
                    <div className="hints-cell">
                      <Lightbulb size={13} className="cell-icon" />
                      <span>{entry.hintsUsed}</span>
                    </div>
                  </td>
                  <td className="col-accuracy">
                    <span className="accuracy-cell">{entry.accuracy}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS (Visible on <= 640px) */}
      <div className="leaderboard-mobile-list">
        {entries.map(entry => {
          const isTop3 = entry.rank !== undefined && entry.rank <= 3;
          const isCurrent = Boolean(entry.isCurrentUser);

          return (
            <div
              key={`mob-${entry.id}`}
              className={`mobile-leaderboard-card ${isTop3 ? `top-${entry.rank}` : ''} ${
                isCurrent ? 'current-user-card' : ''
              }`}
            >
              <div className="card-top-row">
                <div className="card-rank-user">
                  {getRankBadge(entry.rank)}
                  <span className="mobile-user-name">
                    {entry.name}
                    {isCurrent && (
                      <Badge label="You" variant="purple" className="inline-you-badge" />
                    )}
                  </span>
                </div>
                <span className="mobile-score-pill">{entry.score.toLocaleString()} pts</span>
              </div>
              <div className="card-bottom-row">
                <div className="stat-item">
                  <span className="stat-label">Solved</span>
                  <span className="stat-val">{entry.solved}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg Time</span>
                  <span className="stat-val">{formatTime(entry.avgTimeSeconds)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Hints</span>
                  <span className="stat-val">{entry.hintsUsed}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Accuracy</span>
                  <span className="stat-val">{entry.accuracy}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
