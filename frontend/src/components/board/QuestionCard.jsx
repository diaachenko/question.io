import { ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import CommentSection from './CommentSection';

export default function QuestionCard({ question, comments, boardStatus, currentUserId, baseUrl, onVote, onDeleteQuestion, onSubmitComment, onDeleteComment }) {
  return (
    <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-3xl shadow-sm flex gap-4 border border-slate-100 dark:border-slate-800">

      <div className="flex flex-col items-center gap-2 pt-1">
        <button onClick={() => onVote(question.id, 1)} className={`p-2 rounded-xl transition-colors ${question.myVote === 1 ? 'bg-green-500 text-white shadow-md shadow-green-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30'}`}>
          <ThumbsUp className="w-6 h-6" />
        </button>
        <span className={`font-bold text-lg ${question.rating > 0 ? 'text-green-500' : question.rating < 0 ? 'text-red-500' : 'text-slate-500'}`}>{question.rating}</span>
        <button onClick={() => onVote(question.id, -1)} className={`p-2 rounded-xl transition-colors ${question.myVote === -1 ? 'bg-red-500 text-white shadow-md shadow-red-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'}`}>
          <ThumbsDown className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-brand">{question.author?.name}</span>
            {currentUserId === question.author?.id && (
              <button onClick={() => onDeleteQuestion(question.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1" title="Видалити питання">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <span className="text-xs text-slate-400 font-medium">{new Date(question.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        
        <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap text-[15px] leading-relaxed">{question.content}</p>
        
        {question.imageUrl && (
          <img src={`${baseUrl}${question.imageUrl}`} alt="Прикріплене" className="mt-4 rounded-xl max-h-72 object-contain bg-slate-100 dark:bg-slate-800 w-full" />
        )}

        <CommentSection 
          comments={comments} 
          boardStatus={boardStatus} 
          currentUserId={currentUserId} 
          onSubmit={(text) => onSubmitComment(text, question.id)} 
          onDelete={onDeleteComment} 
        />
      </div>
    </div>
  );
}