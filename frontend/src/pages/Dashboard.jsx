import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const [boards, setBoards] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Завантаження дошок (спрацьовує при відкритті сторінки)
  useEffect(() => {
    // Якщо немає юзера або це гість — викидаємо на сторінку входу
    if (!user || user.isGuest) {
      logout();
      navigate('/login');
      return;
    }

    const fetchMyBoards = async () => {
      try {
        const res = await api.get('/boards/my');
        setBoards(res.data.data.boards);
      } catch (err) {
        console.error("Помилка завантаження дошок:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyBoards();
  }, [user, navigate, logout]);

  // 2. Створення нової дошки
  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const res = await api.post('/boards', { title: newTitle });
      setBoards([res.data.data.board, ...boards]);
      setNewTitle('');
    } catch (err) {
      alert(err.response?.data?.message || 'Помилка створення дошки');
    } finally {
      setIsCreating(false);
    }
  };

  // 3. Зміна статусу дошки
  const handleChangeStatus = async (id, status) => {
    try {
      await api.patch(`/boards/${id}/status`, { status });
      setBoards(boards.map(b => b.id === id ? { ...b, status } : b));
    } catch (err) {
      alert('Помилка оновлення статусу');
    }
  };

  // 4. Видалення дошки
  const handleDelete = async (id) => {
    if (!window.confirm('Видалити цю сесію назавжди? Усі питання та коментарі будуть втрачені!')) return;
    try {
      await api.delete(`/boards/${id}`);
      setBoards(boards.filter(b => b.id !== id));
    } catch (err) {
      alert('Помилка видалення');
    }
  };

  // Екран завантаження
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-xl font-bold text-slate-500">Завантажуємо ваші сесії...</div>
      </div>
    );
  }

  // Основний інтерфейс
  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-4 flex flex-col gap-8 py-10">
      
      {/* Шапка адмінки: Заголовок і Форма створення */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-surface-light dark:bg-surface-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Мої Сесії</h1>
        
        <form onSubmit={handleCreateBoard} className="flex items-center gap-3 w-full md:w-auto">
          <input 
            type="text" 
            value={newTitle} 
            onChange={(e) => setNewTitle(e.target.value)} 
            placeholder="Назва нової сесії..." 
            className="flex-1 md:w-72 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand/50 transition-all placeholder:text-slate-400"
          />
          <button 
            type="submit" 
            disabled={isCreating || !newTitle.trim()} 
            className="bg-brand text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-hover flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-brand/20"
          >
            <Plus className="w-5 h-5" /> Створити
          </button>
        </form>
      </div>

      {/* Список дошок */}
      {boards.length === 0 ? (
        <div className="text-center p-16 bg-surface-light dark:bg-surface-dark rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center shadow-sm">
          <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">У вас ще немає створених сесій</p>
          <p className="text-slate-500">Використайте форму вище, щоб створити свою першу Q&A дошку.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {boards.map(board => (
            <div key={board.id} className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col relative group transition-all hover:shadow-md">
              
              {/* Кнопка видалення (з'являється при наведенні) */}
              <button 
                onClick={() => handleDelete(board.id)} 
                className="absolute top-5 right-5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Видалити сесію"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold mb-2 pr-10 text-slate-900 dark:text-white truncate" title={board.title}>
                {board.title}
              </h3>
              
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm text-slate-500">Код:</span>
                <span className="text-brand font-mono font-bold text-lg bg-brand/10 px-2 py-0.5 rounded-md">
                  {board.code}
                </span>
              </div>

              <div className="flex-1"></div>

              {/* Управління дошкою */}
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <select 
                  value={board.status} 
                  onChange={(e) => handleChangeStatus(board.id, e.target.value)}
                  className={`w-full p-3 rounded-xl text-sm font-bold outline-none cursor-pointer border-none transition-colors appearance-none text-center
                    ${board.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                      board.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}
                >
                  <option value="ACTIVE"> Активна (Прийом питань)</option>
                  <option value="PAUSED"> Пауза (Тільки читання)</option>
                  <option value="CLOSED"> Завершена (Архів)</option>
                </select>

                <Link 
                  to={`/board/${board.id}`} 
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors"
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