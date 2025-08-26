import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles/index.css';
import App from './App';
import Moves from './routes/Moves';
import Rooms from './routes/Rooms';
import Boxes from './routes/Boxes';
import BoxDetail from './routes/BoxDetail';
import Search from './routes/Search';
import Settings from './routes/Settings';
import Labels from './routes/Labels';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Moves /> },
      { path: 'moves/:moveId/rooms', element: <Rooms /> },
      // RoomBoxes REMOVED — Boxes page handles room filtering
      { path: 'moves/:moveId/boxes', element: <Boxes /> },
      { path: 'moves/:moveId/boxes/:boxId', element: <BoxDetail /> },
      { path: 'moves/:moveId/search', element: <Search /> },
      { path: 'moves/:moveId/settings', element: <Settings /> },
      { path: 'moves/:moveId/labels', element: <Labels /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
