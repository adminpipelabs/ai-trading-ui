// Main App - Pipe Labs AI Trading Platform
// This is a complete, self-contained application

import { HashRouter } from 'react-router-dom';
import PipeLabsApp from './pages/AdminDashboard';
import './styles/globals.css';

export default function App() {
  return (
    <HashRouter>
      <PipeLabsApp />
    </HashRouter>
  );
}
