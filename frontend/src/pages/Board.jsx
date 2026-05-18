import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Send, Image as ImageIcon, ThumbsUp, ThumbsDown, Trash2, Check, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export default function Board() {
  const { id } = useParams();
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const { isAuthenticated, setAuth, user, setUser } = useAuthStore();
  
  const [board, setBoard] = useState(null);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [comments, setComments] = useState({});
  
  const [isCopied, setIsCopied] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentInputs, setCommentInputs] = useState({}); 
  
  const socketRef = useRef(null);

  const sortQuestions = (qs) => {
    return [...qs].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); // Повертаємо іконку назад через 2 секунди
  };

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const res = await api.get(`/boards/${id}`);
        setBoard(res.data.data.board);
        document.title = `question.io - ${res.data.data.board.title}`;
      } catch (err) {
        setError(err.response?.data?.message || 'Помилка завантаження дошки');
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

    const loadData = async () => {
      try {
        const res = await api.get(`/questions/board/${id}`);
        const mappedQuestions = res.data.data.questions.map(q => ({
          ...q,
          myVote: q.votes && q.votes.length > 0 ? q.votes[0].value : 0
        }));
        setQuestions(sortQuestions(mappedQuestions));

        mappedQuestions.forEach(async (q) => {
          try {
            const cRes = await api.get(`/comments/question/${q.id}`);
            setComments(prev => ({ ...prev, [q.id]: cRes.data.data.comments }));
          } catch (e) { console.error(e); }
        });

      } catch (err) { console.error(err); }
    };
    loadData();

    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    socketRef.current = io(socketUrl);
    socketRef.current.emit('join_board', id);

    socketRef.current.on('new_question', (q) => {
      const newQ = { ...q, myVote: 0 };
      setQuestions((prev) => sortQuestions([newQ, ...prev]));
      setComments((prev) => ({ ...prev, [q.id]: [] }));
    });

    socketRef.current.on('question_voted', ({ questionId, newRating }) => {
      setQuestions((prev) => sortQuestions(
        prev.map(q => q.id === questionId ? { ...q, rating: newRating } : q)
      ));
    });

    socketRef.current.on('question_deleted', (questionId) => {
      setQuestions((prev) => prev.filter(q => q.id !== questionId));
    });

    socketRef.current.on('new_comment', (comment) => {
      setComments((prev) => ({
        ...prev,
        [comment.questionId]: [...(prev[comment.questionId] || []), comment]
      }));
    });

    socketRef.current.on('comment_deleted', ({ commentId, questionId }) => {
      setComments((prev) => ({
        ...prev,
        [questionId]: prev[questionId]?.filter(c => c.id !== commentId) || []
      }));
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
      alert(err.response?.data?.message || 'Помилка');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (questionId, value) => {
    try {
      await api.post(`/questions/${questionId}/vote`, { value });
      setQuestions(prev => prev.map(q => {
        if (q.id === questionId) {
          const newMyVote = q.myVote === value ? 0 : value;
          return { ...q, myVote: newMyVote };
        }
        return q;
      }));
    } catch (err) { console.error(err); }
  };

  const submitComment = async (e, questionId) => {
    e.preventDefault();
    const text = commentInputs[questionId];
    if (!text || !text.trim()) return;
    try {
      await api.post('/comments', { content: text, questionId });
      setCommentInputs(prev => ({ ...prev, [questionId]: '' }));
    } catch (err) {
      alert('Помилка відправки коментаря');
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm('Ви впевнені, що хочете видалити це питання?')) return;
    try {
      await api.delete(`/questions/${questionId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Помилка видалення');
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Видалити цей коментар?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Помилка видалення');
    }
  };

  if (error) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;
  if (!board) return <div className="p-8 text-center text-slate-500">Завантаження...</div>;

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center mb-2">Приєднатися до сесії</h2>
          <p className="text-center text-brand font-medium mb-6">{board.title}</p>
          <form onSubmit={handleGuestJoin} className="flex flex-col gap-4">
            <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Ваше ім'я" className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand" />
            <button type="submit" className="w-full bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-hover">Увійти</button>
          </form>
        </div>
      </div>
    );
  }

  const boardUrl = window.location.href;

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-6">
      
      <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{board.title}</h1>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${ board.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : board.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700' }`}>
              {board.status === 'ACTIVE' ? 'Активна' : board.status === 'PAUSED' ? 'Пауза' : 'Завершена'}
            </div>
          </div>
          <p className="text-slate-500 text-base">Код доступу: <span className="font-mono font-bold text-brand text-lg tracking-widest">{board.code}</span></p>
          <button 
              onClick={copyLink} 
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {isCopied ? 'Скопійовано!' : 'Копіювати лінк'}
            </button>
        </div>
        
        <div className="flex flex-col items-center bg-white p-2 rounded-2xl shadow-sm">
          <QRCodeSVG value={boardUrl} size={100} bgColor={"#ffffff"} fgColor={"#0f172a"} />
        </div>
      </div>

      {board.status === 'ACTIVE' && (
        <form onSubmit={submitQuestion} className="bg-surface-light dark:bg-surface-dark p-4 rounded-3xl shadow-sm flex flex-col gap-3 border border-slate-100 dark:border-slate-800">
          <textarea value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="Задайте своє питання..." className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 outline-none resize-none min-h-[100px] text-slate-900 dark:text-white" />
          <div className="flex items-center justify-between px-2">
            <label className="cursor-pointer text-slate-500 hover:text-brand transition-colors flex items-center gap-2">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setSelectedFile(e.target.files[0])} />
              <ImageIcon className="w-6 h-6" />
              <span className="text-sm font-medium">{selectedFile ? selectedFile.name : 'Додати фото'}</span>
            </label>
            <button type="submit" disabled={isSubmitting || !newQuestion.trim()} className="bg-brand text-white px-6 py-2 rounded-xl font-medium hover:bg-brand-hover disabled:opacity-50 flex items-center gap-2">
              Надіслати <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-6 pb-10">
        {questions.map((q) => (
          <div key={q.id} className="bg-surface-light dark:bg-surface-dark p-5 rounded-3xl shadow-sm flex gap-4 border border-slate-100 dark:border-slate-800">
            
            <div className="flex flex-col items-center gap-2 pt-1">
              <button onClick={() => handleVote(q.id, 1)} className={`p-2 rounded-xl transition-colors ${q.myVote === 1 ? 'bg-green-500 text-white shadow-md shadow-green-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30'}`}>
                <ThumbsUp className="w-6 h-6" />
              </button>
              <span className={`font-bold text-lg ${q.rating > 0 ? 'text-green-500' : q.rating < 0 ? 'text-red-500' : 'text-slate-500'}`}>{q.rating}</span>
              <button onClick={() => handleVote(q.id, -1)} className={`p-2 rounded-xl transition-colors ${q.myVote === -1 ? 'bg-red-500 text-white shadow-md shadow-red-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'}`}>
                <ThumbsDown className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col">
              
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-brand">{q.author?.name}</span>

                  {user?.id === q.author?.id && (
                    <button onClick={() => deleteQuestion(q.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1" title="Видалити питання">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap text-[15px] leading-relaxed">{q.content}</p>
              
              {q.imageUrl && (
                <img src={`${baseUrl}${q.imageUrl}`} ... />
              )}
              
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                {(comments[q.id] || []).length > 0 ? (
                  (comments[q.id] || []).map(comment => (
                    <div key={comment.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl flex flex-col group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">{comment.author.name}</span>

                          {user?.id === comment.author?.id && (
                            <button onClick={() => deleteComment(comment.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all" title="Видалити коментар">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic px-2">Поки немає коментарів. Будьте першим!</p>
                )}
                
                {board.status === 'ACTIVE' && (
                  <form onSubmit={(e) => submitComment(e, q.id)} className="flex items-center gap-2 mt-1">
                    <input type="text" value={commentInputs[q.id] || ''} onChange={(e) => setCommentInputs(prev => ({ ...prev, [q.id]: e.target.value }))} placeholder="Додати коментар..." className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-brand/50 transition-all placeholder:text-slate-400" />
                    <button type="submit" disabled={!commentInputs[q.id]?.trim()} className="p-2 bg-brand text-white rounded-xl hover:bg-brand-hover disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors"><Send className="w-4 h-4" /></button>
                  </form>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}