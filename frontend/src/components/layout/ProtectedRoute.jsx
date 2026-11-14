import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../ui/Spinner';

/** Halaman privat: hanya bisa dibuka bila sesi Supabase valid dan profil siswa ditemukan. */
export default function ProtectedRoute({ children }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner full label="Memeriksa sesi kerajaan..." />;
  if (!session || !profile) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
