import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Challenges from './pages/Challenges';
import ChallengeWorkspace from './pages/ChallengeWorkspace';
import Results from './pages/Results';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
function ComingSoon({ title }: { title: string }) {
  return <div className="page-shell"><Header/><main className="listing-page soon-page"><span className="eyebrow">CogniCode</span><h1>{title}</h1><p className="page-intro">This section is coming soon. Start with a code comprehension round while it takes shape.</p></main><Footer/></div>;
}
export default function App() {
  return <Routes><Route path="/" element={<Home/>}/><Route path="/challenges" element={<Challenges/>}/><Route path="/challenge/:id" element={<ChallengeWorkspace/>}/><Route path="/results" element={<Results/>}/><Route path="/learn" element={<ComingSoon title="Learn"/>}/><Route path="/leaderboard" element={<ComingSoon title="Leaderboard"/>}/><Route path="/about" element={<ComingSoon title="About"/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>;
}
