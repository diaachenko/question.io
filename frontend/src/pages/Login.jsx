import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const res = await api.post(endpoint, formData);
      
      setAuth(res.data.data.user, res.data.token);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Сталася помилка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-3xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-slate-900 dark:text-white">
          {isLogin ? 'Вхід для організатора' : 'Реєстрація'}
        </h1>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Ваше ім'я" 
              required 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand" 
            />
          )}
          <input 
            type="email" 
            placeholder="Email" 
            required 
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand" 
          />
          <input 
            type="password" 
            placeholder="Пароль" 
            required 
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand" 
          />
          
          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-brand text-white py-3 rounded-xl font-bold hover:bg-brand-hover transition-colors mt-2 disabled:opacity-50"
          >
            {isLogin ? 'Увійти' : 'Створити акаунт'}
          </button>
        </form>

        <p className="text-center text-slate-500 mt-6 text-sm">
          {isLogin ? 'Немає акаунту? ' : 'Вже є акаунт? '}
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-brand font-bold hover:underline"
          >
            {isLogin ? 'Зареєструватись' : 'Увійти'}
          </button>
        </p>
      </div>
    </div>
  );
}