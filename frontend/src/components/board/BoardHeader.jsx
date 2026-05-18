import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';

export default function BoardHeader({ board, boardUrl }) {
  const [isCopied, setIsCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(boardUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-100 dark:border-slate-800">
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{board.title}</h1>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${ board.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : board.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700' }`}>
            {board.status === 'ACTIVE' ? 'Активна' : board.status === 'PAUSED' ? 'Пауза' : 'Завершена'}
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-3">
          <p className="text-slate-500 text-base">Код: <span className="font-mono font-bold text-brand text-lg tracking-widest">{board.code}</span></p>
          <button onClick={copyLink} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
            {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {isCopied ? 'Скопійовано' : 'Копіювати лінк'}
          </button>
        </div>
      </div>
      
      <div className="flex flex-col items-center bg-white p-2 rounded-2xl shadow-sm">
        <QRCodeSVG value={boardUrl} size={100} bgColor={"#ffffff"} fgColor={"#0f172a"} />
      </div>
    </div>
  );
}