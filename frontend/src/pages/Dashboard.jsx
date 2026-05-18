import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import BoardCard from '../components/BoardCard';

export default function Dashboard() {
  // ДОДАЛИ isAuthLoading НАЗАД!
  const { user, logout, isAuthLoading } = useAuthStore(); 
  const navigate = useNavigate();
  
  const [boards, setBoards] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingBoards, setIsLoadingBoards] = useState(true);

  useEffect(() => {
    if (isAuthLoading) return;

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
        setIsLoadingBoards(false);
      }
    };

    fetchMyBoards();
  }, [user, isAuthLoading, navigate, logout]);

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

  const handleChangeStatus = async (id, status) => {
    try {
      await api.patch(`/boards/${id}/status`, { status });
      setBoards(boards.map(b => b.id === id ? { ...b, status } : b));
    } catch (err) {
      alert('Помилка оновлення статусу');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Видалити цю сесію назавжди?')) return;
    try {
      await api.delete(`/boards/${id}`);
      setBoards(boards.filter(b => b.id !== id));
    } catch (err) {
      alert('Помилка видалення');
    }
  };

  if (isAuthLoading || isLoadingBoards) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-xl font-bold text-slate-500 animate-pulse">Завантажуємо ваші сесії...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-4 flex flex-col gap-8 py-10">
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
          <button type="submit" disabled={isCreating || !newTitle.trim()} className="bg-brand text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-hover flex items-center gap-2 disabled:opacity-50">
            <Plus className="w-5 h-5" /> Створити
          </button>
        </form>
      </div>

      {boards.length === 0 ? (
        <div className="text-center p-16 bg-surface-light dark:bg-surface-dark rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">У вас ще немає створених сесій</p>
          <p className="text-slate-500">Використайте форму вище, щоб створити свою першу Q&A дошку.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {boards.map(board => (
            <BoardCard 
              key={board.id} 
              board={board} 
              onDelete={handleDelete} 
              onStatusChange={handleChangeStatus} 
            />
          ))}
        </div>
      )}
    </div>
  );
}