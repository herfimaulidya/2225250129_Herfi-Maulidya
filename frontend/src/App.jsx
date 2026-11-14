import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Spinner from './components/ui/Spinner';
import Landing from './pages/Landing';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

const Admin = lazy(() => import('./pages/Admin'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const KingdomMap = lazy(() => import('./pages/KingdomMap'));
const Lesson = lazy(() => import('./pages/Lesson'));
const MathLab = lazy(() => import('./pages/MathLab'));
const Training = lazy(() => import('./pages/Training'));
const TrainingSession = lazy(() => import('./pages/TrainingSession'));
const Playground = lazy(() => import('./pages/Playground'));
const GamePage = lazy(() => import('./pages/games/GamePage'));
const FinalQuest = lazy(() => import('./pages/FinalQuest'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Profile = lazy(() => import('./pages/Profile'));
const History = lazy(() => import('./pages/History'));

export default function App() {
  return (
    <Suspense fallback={<Spinner full label="Membuka gerbang kerajaan..." />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="map" element={<KingdomMap />} />
          <Route path="lessons/:lessonId" element={<Lesson />} />
          <Route path="lab" element={<MathLab />} />
          <Route path="training" element={<Training />} />
          <Route path="training/:level" element={<TrainingSession />} />
          <Route path="games" element={<Playground />} />
          <Route path="games/:gameId" element={<GamePage />} />
          <Route path="final" element={<FinalQuest />} />
          <Route path="achievements" element={<Achievements />} />
          <Route path="profile" element={<Profile />} />
          <Route path="history" element={<History />} />
          <Route path="*" element={<NotFound inApp />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
