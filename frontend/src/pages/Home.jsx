import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function Home() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError('Код має містити 6 цифр');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const res = await api.get(`/boards/join/${code}`);
      navigate(`/board/${res.data.data.board.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Дошку не знайдено');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-3xl shadow-xl p-8 transition-colors duration-200">
        <h1 className="text-3xl font-bold text-center mb-2 text-slate-900 dark:text-white">
          Приєднатися
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
          Введіть код, щоб приєднатися до сесії Q&A
        </p>

        <form onSubmit={handleJoin} className="relative">
          <div className="relative flex items-center">
            <span className="absolute left-4 text-2xl text-slate-400 font-medium">#</span>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // Дозволяємо лише цифри
              placeholder="123456"
              className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-brand text-slate-900 dark:text-white text-2xl rounded-2xl py-4 pl-10 pr-16 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="absolute right-2 p-3 bg-brand text-white rounded-xl hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          
        </form>
      </div>
    </div>
  );
}