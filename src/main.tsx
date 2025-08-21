import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './styles/index.css'
import App from './App'
import Moves from './routes/Moves'
import Boxes from './routes/Boxes'
import BoxDetail from './routes/BoxDetail'
import Labels from './routes/Labels'
import Settings from './routes/Settings'

const router = createBrowserRouter([
  { path: '/', element: <App />,
    children: [
      { index: true, element: <Moves /> },
      { path: 'moves/:moveId/boxes', element: <Boxes /> },
      { path: 'moves/:moveId/boxes/:boxId', element: <BoxDetail /> },
      { path: 'moves/:moveId/labels', element: <Labels /> },
      { path: 'moves/:moveId/settings', element: <Settings /> },
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)