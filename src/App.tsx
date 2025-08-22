import { Outlet } from 'react-router-dom';
import TopBar from '@/components/TopBar';
import OpenInBrowserBanner from '@/components/OpenInBrowserBanner';
import InstallBanner from '@/components/InstallBanner';

export default function App() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <OpenInBrowserBanner />   {/* shows only inside in-app browsers */}
      <InstallBanner />         {/* your device-aware installer */}
      <main className="mx-auto max-w-6xl px-3 sm:px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}
