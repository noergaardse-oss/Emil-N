import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { logout } from './firebase';
import LandingPage from './pages/LandingPage';
import TeamPage from './pages/TeamPage';
import AdminPage from './pages/AdminPage';

interface CustomUser {
  username: string;
  isAdmin: boolean;
}

export default function App() {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (session === 'Silkeborgvolley_active') {
      setUser({ username: 'Silkeborgvolley', isAdmin: true });
    }
    setLoading(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput === 'Silkeborgvolley' && passwordInput === 'Silkeborgvolley2026') {
      localStorage.setItem('admin_session', 'Silkeborgvolley_active');
      setUser({ username: 'Silkeborgvolley', isAdmin: true });
      setShowLoginModal(false);
      setLoginError('');
      setUsernameInput('');
      setPasswordInput('');
    } else {
      setLoginError('Forkert brugernavn eller kodeord');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Indlæser...</div>;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <header className="bg-white shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link to="/" className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent flex items-center gap-2 leading-normal">
              Silkeborg Volleyball
            </Link>
            <div>
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">{user.username}</span>
                  <Link to="/admin" className="text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent hover:opacity-80">
                    Indstillinger
                  </Link>
                  <button onClick={logout} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Log ud
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowLoginModal(true)} className="text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent hover:opacity-80">
                  Login
                </button>
              )}
            </div>
          </div>
        </header>

        {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
              <h2 className="text-xl font-bold mb-4">Admin Login</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brugernavn</label>
                  <input 
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kodeord</label>
                  <input 
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                {loginError && <p className="text-red-600 text-sm">{loginError}</p>}
                <div className="flex gap-3 pt-2">
                  <button 
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
                  >
                    Log ind
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors"
                  >
                    Annuller
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <main className="max-w-5xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/team/:teamId" element={<TeamPage user={user} />} />
            <Route path="/admin" element={<AdminPage user={user} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
