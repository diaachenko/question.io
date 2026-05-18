import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';

export default function CommentSection({ comments = [], boardStatus, currentUserId, onSubmit, onDelete }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text);
    setText('');
  };

  return (
    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
      {comments.length > 0 ? (
        comments.map(comment => (
          <div key={comment.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl flex flex-col group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">{comment.author.name}</span>
                {currentUserId === comment.author?.id && (
                  <button onClick={() => onDelete(comment.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all" title="Видалити коментар">
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
      
      {boardStatus === 'ACTIVE' && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
          <input 
            type="text" 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder="Додати коментар..." 
            className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-brand/50 transition-all placeholder:text-slate-400" 
          />
          <button type="submit" disabled={!text.trim()} className="p-2 bg-brand text-white rounded-xl hover:bg-brand-hover disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}