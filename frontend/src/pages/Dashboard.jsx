import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export default function Dashboard() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const [boards, setBoards] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Перевірка доступу (тільки для повноцінних юзерів, не гостей)
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.isGuest) {
      // Якщо це гість, виходимо з акаунту і кидаємо на логін
      logout();
      navigate('/login');
    } else {
      loadBoards();
    }
  }, [isAuthenticated, user, navigate, logout]);

  const loadBoards = async () => {
    try {
      const res = await api.get('/boards/my');
      setBoards(res.data.data.boards);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const res = await api.post('/boards', { title: newTitle });
      setBoards([res.data.data.board, ...boards]); // Додаємо нову дошку наверх
      setNewTitle('');
    } catch (err) {
      alert(err.response?.data?.message || 'Помилка створення');
    } finally {
      setIsCreating(false);
    }
  };

  const handleChangeStatus = async (id, status) => {
    try {
      await api.patch(`/boards/${id}/status`, { status });
      setBoards(boards.map(b => b.id === id ? { ...b, status } : b));
    } catch (err) {
      alert('Помилка оновлення статусу');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Видалити цю сесію назавжди? Усі питання та коментарі будуть втрачені!')) return;
    try {
      await api.delete(`/boards/${id}`);
      setBoards(boards.filter(b => b.id !== id));
    } catch (err) {
      alert('Помилка видалення');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Завантаження...</div>;

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto p-4 flex flex-col gap-8 py-10">
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Мої Сесії</h1>
        
        {/* Форма створення */}
        <form onSubmit={handleCreateBoard} className="flex items-center gap-2 w-full md:w-auto">
          <input 
            type="text" 
            value={newTitle} 
            onChange={(e) => setNewTitle(e.target.value)} 
            placeholder="Назва нової сесії..." 
            className="flex-1 md:w-64 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 outline-none focus:border-brand"
          />
          <button 
            type="submit" 
            disabled={isCreating || !newTitle.trim()} 
            className="bg-brand text-white px-4 py-2.5 rounded-xl font-medium hover:bg-brand-hover flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-5 h-5" /> Створити
          </button>
        </form>
      </div>

      {/* Список дошок */}
      {boards.length === 0 ? (
        <div className="text-center p-12 bg-surface-light dark:bg-surface-dark rounded-3xl border border-slate-100 dark:border-slate-800">
          <p className="text-slate-500 mb-4">У вас ще немає жодної створеної сесії.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map(board => (
            <div key={board.id} className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col relative group">
              
              <button 
                onClick={() => handleDelete(board.id)} 
                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Видалити сесію"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold mb-1 pr-6">{board.title}</h3>
              <p className="text-slate-500 font-mono mb-4 text-lg">#{board.code}</p>

              <div className="flex-1"></div> {/* Розпірка */}

              <div className="flex flex-col gap-3 mt-4">
                <select 
                  value={board.status} 
                  onChange={(e) => handleChangeStatus(board.id, e.target.value)}
                  className={`w-full p-2 rounded-lg text-sm font-bold outline-none cursor-pointer border-none
                    ${board.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                      board.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-red-100 text-red-700'}`}
                >
                  <option value="ACTIVE">Активна (Прийом питань)</option>
                  <option value="PAUSED">Пауза (Тільки читання)</option>
                  <option value="CLOSED">Завершена (Архів)</option>
                </select>

                <Link 
                  to={`/board/${board.id}`} 
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors"
                >
                  Перейти до дошки <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}