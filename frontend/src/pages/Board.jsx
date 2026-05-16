import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Send, Image as ImageIcon, ThumbsUp, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export default function Board() {
  const { id } = useParams();
  const { isAuthenticated, user, setAuth } = useAuthStore();
  
  const [board, setBoard] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [guestName, setGuestName] = useState('');

  const [newQuestion, setNewQuestion] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const res = await api.get(`/boards/${id}`);
        setBoard(res.data.data.board);
        document.title = `question.io - ${res.data.data.board.title}`;
      } catch (err) {
        console.error(err);
      }
    };
    fetchBoard();

    return () => { document.title = 'question.io - Платформа для Q&A сесій'; };
  }, [id]);

  const handleGuestJoin = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    try {
      const res = await api.post('/auth/guest', { name: guestName });
      setAuth(res.data.data.user, res.data.token);
    } catch (err) {
      alert(err.response?.data?.message || 'Помилка входу');
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !board) return;

    api.get(`/questions/board/${id}`).then((res) => {
      setQuestions(res.data.data.questions);
    }).catch(console.error);

    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    socketRef.current = io(socketUrl);

    socketRef.current.emit('join_board', id);

    socketRef.current.on('new_question', (q) => {
      setQuestions((prev) => [q, ...prev]);
    });

    socketRef.current.on('question_voted', ({ questionId, newRating }) => {
      setQuestions((prev) => prev.map(q => 
        q.id === questionId ? { ...q, rating: newRating } : q
      ).sort((a, b) => b.rating - a.rating));
    });

    socketRef.current.on('board_status_changed', (status) => {
      setBoard((prev) => ({ ...prev, status }));
    });

    socketRef.current.on('question_deleted', (questionId) => {
      setQuestions((prev) => prev.filter(q => q.id !== questionId));
    });

    return () => {
      socketRef.current.emit('leave_board', id);
      socketRef.current.disconnect();
    };
  }, [isAuthenticated, board, id]);

  const submitQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('content', newQuestion);
      formData.append('boardId', id);
      if (selectedFile) formData.append('image', selectedFile);

      await api.post('/questions', formData);
      setNewQuestion('');
      setSelectedFile(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Помилка створення питання');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (questionId, value) => {
    try {
      await api.post(`/questions/${questionId}/vote`, { value });
    } catch (err) {
      console.error(err);
    }
  };

  if (!board) return <div className="p-8 text-center">Завантаження...</div>;

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center mb-2">Приєднатися до сесії</h2>
          <p className="text-center text-brand font-medium mb-6">{board.title}</p>
          <form onSubmit={handleGuestJoin} className="flex flex-col gap-4">
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Ваше ім'я"
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand"
            />
            <button type="submit" className="w-full bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-hover transition-colors">
              Увійти як гість
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto p-4 flex flex-col gap-6">
      <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{board.title}</h1>
          <p className="text-slate-500 text-sm mt-1">Код доступу: <span className="font-mono font-bold text-brand">{board.code}</span></p>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${
          board.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
          board.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {board.status === 'ACTIVE' ? 'Активна' : board.status === 'PAUSED' ? 'Призупинена' : 'Завершена'}
        </div>
      </div>

      {board.status === 'ACTIVE' ? (
        <form onSubmit={submitQuestion} className="bg-surface-light dark:bg-surface-dark p-4 rounded-3xl shadow-sm flex flex-col gap-3">
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Задайте своє питання..."
            className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 outline-none resize-none min-h-[100px]"
          />
          
          <div className="flex items-center justify-between px-2">
            <label className="cursor-pointer text-slate-500 hover:text-brand transition-colors flex items-center gap-2">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setSelectedFile(e.target.files[0])} />
              <ImageIcon className="w-6 h-6" />
              <span className="text-sm font-medium">{selectedFile ? selectedFile.name : 'Додати фото'}</span>
            </label>
            
            <button 
              type="submit" 
              disabled={isSubmitting || !newQuestion.trim()}
              className="bg-brand text-white px-6 py-2 rounded-xl font-medium hover:bg-brand-hover disabled:opacity-50 flex items-center gap-2"
            >
              Надіслати <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-slate-200 dark:bg-slate-800 p-4 rounded-2xl text-center text-slate-500 font-medium">
          {board.status === 'PAUSED' ? 'Прийом питань тимчасово призупинено.' : 'Сесію завершено. Дякуємо за участь!'}
        </div>
      )}

      <div className="flex flex-col gap-4 pb-10">
        {questions.length === 0 ? (
          <p className="text-center text-slate-500 mt-10">Ще немає жодного питання. Будьте першим!</p>
        ) : (
          questions.map((q) => (
            <div key={q.id} className="bg-surface-light dark:bg-surface-dark p-5 rounded-3xl shadow-sm flex gap-4">
              <div className="flex flex-col items-center gap-1">
                <button 
                  onClick={() => handleVote(q.id, 1)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-brand transition-colors"
                >
                  <ThumbsUp className="w-6 h-6" />
                </button>
                <span className="font-bold text-lg">{q.rating}</span>
              </div>

              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-brand">{q.author?.name}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{q.content}</p>
                
                {q.imageUrl && (
                  <img 
                    src={`http://localhost:5000${q.imageUrl}`} 
                    alt="Прикріплене" 
                    className="mt-4 rounded-xl max-h-64 object-contain bg-slate-100 dark:bg-slate-800"
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}