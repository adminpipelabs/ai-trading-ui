// Main App - Pipe Labs AI Trading Platform
// This is a complete, self-contained application

import { HashRouter } from 'react-router-dom';
import PipeLabsApp from './pages/AdminDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/globals.css';

export default function App() {
  return (
    <ErrorBoundary title="Application Error" message="The application encountered an error. Please refresh the page or contact support if the issue persists.">
      <HashRouter>
        <PipeLabsApp />
      </HashRouter>
    </ErrorBoundary>
  );
}
