/**
 * Signologos — App Root with Router.
 *
 * Wraps the entire app in:
 * - ErrorBoundary: catches unhandled render errors
 * - ToastContainer: global notification system
 * - BrowserRouter: SPA navigation
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LobbyPage from './pages/LobbyPage';
import CallPage from './pages/CallPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './components/common/Toast';

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/lobby" element={<LobbyPage />} />
                    <Route path="/call/:roomCode" element={<CallPage />} />
                </Routes>
            </BrowserRouter>
            {/* Global toast notifications rendered in a portal */}
            <ToastContainer />
        </ErrorBoundary>
    );
}

export default App;
