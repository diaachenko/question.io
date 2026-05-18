import { useState } from 'react';

export default function GuestLoginForm({ boardTitle, onJoin }) {
  const [guestName, setGuestName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (guestName.trim()) onJoin(guestName);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-3xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-center mb-2">Приєднатися до сесії</h2>
        <p className="text-center text-brand font-medium mb-6">{boardTitle}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            type="text" 
            value={guestName} 
            onChange={(e) => setGuestName(e.target.value)} 
            placeholder="Ваше ім'я" 
            className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand" 
          />
          <button type="submit" disabled={!guestName.trim()} className="w-full bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-hover disabled:opacity-50">
            Увійти
          </button>
        </form>
      </div>
    </div>
  );
}