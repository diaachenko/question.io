import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Board from './pages/Board';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { useAuthStore } from './store/useAuthStore';
import api from './services/api';

function App() {
  const { token, setUser, setAuthFailed, isAuthLoading } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setAuthFailed();
        return;
      }
      
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.data.user);
      } catch (err) {
        console.error('Помилка авторизації:', err);
        setAuthFailed();
      }
    };

    checkAuth();
  }, [token, setUser, setAuthFailed]);

  if (isAuthLoading) {
    return <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center text-brand font-bold text-xl">Завантаження...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="board/:id" element={<Board />} />
          <Route path="admin" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;