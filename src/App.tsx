import { Outlet } from 'react-router-dom';
import TopBar from '@/components/TopBar';
import InstallBanner from '@/components/InstallBanner';

export default function App() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <InstallBanner />
      <main className="mx-auto max-w-6xl px-3 sm:px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}
