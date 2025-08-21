import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './styles/index.css'
import App from './App'
import Moves from './routes/Moves'
import Boxes from './routes/Boxes'
import BoxDetail from './routes/BoxDetail'
import Items from './routes/Items'       // NEW
import Search from './routes/Search'     // NEW
import Settings from './routes/Settings'
import Labels from './routes/Labels'

const router = createBrowserRouter([
  { path: '/', element: <App />,
    children: [
      { index: true, element: <Moves /> },
      { path: 'moves/:moveId/boxes', element: <Boxes /> },
      { path: 'moves/:moveId/boxes/:boxId', element: <BoxDetail /> },
      { path: 'moves/:moveId/items', element: <Items /> },     // NEW
      { path: 'moves/:moveId/search', element: <Search /> },   // NEW
      { path: 'moves/:moveId/settings', element: <Settings /> },
      { path: 'moves/:moveId/labels', element: <Labels /> },
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
