import { Outlet, useNavigate, useParams } from 'react-router-dom';
import TopBar from './components/TopBar';
import { useEffect } from 'react';
import { useUI } from './store';

export default function App(){
  const nav = useNavigate();
  const { currentMoveId, setCurrentMove } = useUI();

  useEffect(()=>{
    // stay as-is, route components manage currentMoveId
  }, [currentMoveId]);

  return (
    <div className="min-h-dvh bg-neutral-50">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}