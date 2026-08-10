/**
 * Signologos — App Root with Router.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LobbyPage from './pages/LobbyPage';
import CallPage from './pages/CallPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/lobby" element={<LobbyPage />} />
                <Route path="/call/:roomCode" element={<CallPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
