import { Link } from 'react-router-dom';
import { Trash2, ExternalLink } from 'lucide-react';
import StatusDropdown from './StatusDropdown';

export default function BoardCard({ board, onDelete, onStatusChange }) {
  return (
    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col relative group transition-all hover:shadow-md">

      <button 
        onClick={() => onDelete(board.id)} 
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

      <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">

        <StatusDropdown 
          currentStatus={board.status} 
          onStatusChange={(newStatus) => onStatusChange(board.id, newStatus)} 
        />

        <Link 
          to={`/board/${board.id}`} 
          className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors"
        >
          Перейти до дошки <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}