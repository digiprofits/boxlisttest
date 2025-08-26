import { Outlet } from 'react-router-dom';
import TopBar from './components/TopBar';

export default function App() {
  return (
    <div className="min-h-screen bg-white text-black">
      <TopBar />
      <main className="mx-auto max-w-6xl px-3 sm:px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
