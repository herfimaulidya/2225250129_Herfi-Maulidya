import { Link } from 'react-router-dom';
import Princess from '../components/art/Princess';

export default function NotFound({ inApp = false }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Princess who="lumina" mood="think" size={96} />
      <h1 className="text-2xl">Wah, jalan ini tidak ada di peta kerajaan.</h1>
      <p className="text-royal-plum/70">Halaman yang kamu cari tidak ditemukan.</p>
      <Link to={inApp ? '/app' : '/'} className="btn-primary">Kembali ke {inApp ? 'Dashboard' : 'Beranda'}</Link>
    </div>
  );
}
