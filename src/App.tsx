import { Outlet } from 'react-router-dom';
import TopBar from '@/components/TopBar';
import InstallGate from '@/components/InstallGate';

export default function App() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <InstallGate /> {/* Shown only if not installed & not dismissed */}
      <main className="mx-auto max-w-6xl px-3 sm:px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}
