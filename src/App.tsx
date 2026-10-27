import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Challenges from './pages/Challenges';
import ChallengeWorkspace from './pages/ChallengeWorkspace';
import Results from './pages/Results';
import About from './pages/About';
import Leaderboard from './pages/Leaderboard';
import Learn from './pages/Learn';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/challenges" element={<Challenges />} />
      <Route path="/challenge/:id" element={<ChallengeWorkspace />} />
      <Route path="/results" element={<Results />} />
      <Route path="/learn" element={<Learn />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/about" element={<About />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
