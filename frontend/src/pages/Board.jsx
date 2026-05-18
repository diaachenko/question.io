import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

import GuestLoginForm from '../components/board/GuestLoginForm';
import BoardHeader from '../components/board/BoardHeader';
import QuestionForm from '../components/board/QuestionForm';
import QuestionCard from '../components/board/QuestionCard';

const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function Board() {
  const { id } = useParams();
  const { isAuthenticated, setAuth, user } = useAuthStore();
  
  const [board, setBoard] = useState(null);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [comments, setComments] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const socketRef = useRef(null);

  const sortQuestions = (qs) => [...qs].sort((a, b) => b.rating !== a.rating ? b.rating - a.rating : new Date(b.createdAt) - new Date(a.createdAt));

  useEffect(() => {
    api.get(`/boards/${id}`).then(res => {
      setBoard(res.data.data.board);
      document.title = `question.io - ${res.data.data.board.title}`;
    }).catch(err => setError(err.response?.data?.message || 'Помилка'));
    return () => { document.title = 'question.io - Платформа для Q&A сесій'; };
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated || !board) return;

    api.get(`/questions/board/${id}`).then(res => {
      const mapped = res.data.data.questions.map(q => ({ ...q, myVote: q.votes?.length ? q.votes[0].value : 0 }));
      setQuestions(sortQuestions(mapped));
      mapped.forEach(q => api.get(`/comments/question/${q.id}`).then(c => setComments(p => ({...p, [q.id]: c.data.data.comments}))));
    });

    socketRef.current = io(baseUrl);
    socketRef.current.emit('join_board', id);

    socketRef.current.on('new_question', q => {
      setQuestions(prev => sortQuestions([{ ...q, myVote: 0 }, ...prev]));
      setComments(prev => ({ ...prev, [q.id]: [] }));
    });
    socketRef.current.on('question_voted', ({ questionId, newRating }) => {
      setQuestions(prev => sortQuestions(prev.map(q => q.id === questionId ? { ...q, rating: newRating } : q)));
    });
    socketRef.current.on('question_deleted', qId => setQuestions(prev => prev.filter(q => q.id !== qId)));
    
    socketRef.current.on('new_comment', c => setComments(prev => ({ ...prev, [c.questionId]: [...(prev[c.questionId] || []), c] })));
    socketRef.current.on('comment_deleted', ({ commentId, questionId }) => {
      setComments(prev => ({ ...prev, [questionId]: prev[questionId]?.filter(c => c.id !== commentId) || [] }));
    });

    return () => socketRef.current.disconnect();
  }, [isAuthenticated, board, id]);

  const handleGuestJoin = async (name) => {
    try {
      const res = await api.post('/auth/guest', { name });
      setAuth(res.data.data.user, res.data.token);
    } catch (err) { alert('Помилка входу'); }
  };

  const submitQuestion = async (content, file) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('boardId', id);
      if (file) formData.append('image', file);
      await api.post('/questions', formData);
    } catch (err) { alert('Помилка'); }
    setIsSubmitting(false);
  };

  const handleVote = async (qId, value) => {
    try {
      await api.post(`/questions/${qId}/vote`, { value });
      setQuestions(prev => prev.map(q => q.id === qId ? { ...q, myVote: q.myVote === value ? 0 : value } : q));
    } catch (e) {}
  };

  const submitComment = async (content, qId) => {
    try { await api.post('/comments', { content, questionId: qId }); } 
    catch (e) { alert('Помилка'); }
  };

  const deleteQuestion = async (qId) => {
    if (window.confirm('Видалити питання?')) api.delete(`/questions/${qId}`);
  };

  const deleteComment = async (cId) => {
    if (window.confirm('Видалити коментар?')) api.delete(`/comments/${cId}`);
  };

  if (error) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;
  if (!board) return <div className="p-8 text-center">Завантаження...</div>;
  if (!isAuthenticated) return <GuestLoginForm boardTitle={board.title} onJoin={handleGuestJoin} />;

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-6">
      <BoardHeader board={board} boardUrl={window.location.href} />
      
      {board.status === 'ACTIVE' && (
        <QuestionForm onSubmit={submitQuestion} isSubmitting={isSubmitting} />
      )}

      <div className="flex flex-col gap-6 pb-10">
        {questions.map(q => (
          <QuestionCard 
            key={q.id} 
            question={q} 
            comments={comments[q.id] || []}
            boardStatus={board.status}
            currentUserId={user?.id}
            baseUrl={baseUrl}
            onVote={handleVote}
            onDeleteQuestion={deleteQuestion}
            onSubmitComment={submitComment}
            onDeleteComment={deleteComment}
          />
        ))}
      </div>
    </div>
  );
}