import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from './firebase';
import LandingPage from './pages/LandingPage';
import TeamPage from './pages/TeamPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
                  <span className="text-sm text-gray-600">{user.email}</span>
                  {user.email === 'noergaard.se@gmail.com' && (
                    <Link to="/admin" className="text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent hover:opacity-80">
                      Indstillinger
                    </Link>
                  )}
                  <button onClick={logout} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Log ud
                  </button>
                </div>
              ) : (
                <button onClick={loginWithGoogle} className="text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent hover:opacity-80">
                  Login
                </button>
              )}
            </div>
          </div>
        </header>

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
