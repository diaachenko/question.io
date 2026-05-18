import { useState } from 'react';
import { Send, Image as ImageIcon } from 'lucide-react';

export default function QuestionForm({ onSubmit, isSubmitting }) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    await onSubmit(content, file);
    setContent('');
    setFile(null);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-light dark:bg-surface-dark p-4 rounded-3xl shadow-sm flex flex-col gap-3 border border-slate-100 dark:border-slate-800">
      <textarea 
        value={content} 
        onChange={(e) => setContent(e.target.value)} 
        placeholder="Задайте своє питання..." 
        className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 outline-none resize-none min-h-[100px] text-slate-900 dark:text-white" 
      />
      <div className="flex items-center justify-between px-2">
        <label className="cursor-pointer text-slate-500 hover:text-brand transition-colors flex items-center gap-2">
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
          <ImageIcon className="w-6 h-6" />
          <span className="text-sm font-medium">{file ? file.name : 'Додати фото'}</span>
        </label>
        <button type="submit" disabled={isSubmitting || !content.trim()} className="bg-brand text-white px-6 py-2 rounded-xl font-medium hover:bg-brand-hover disabled:opacity-50 flex items-center gap-2">
          Надіслати <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}