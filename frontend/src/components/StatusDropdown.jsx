import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function StatusDropdown({ currentStatus, onStatusChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const statuses = {
    ACTIVE: { label: 'Активна (Прийом питань)', color: 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30' },
    PAUSED: { label: 'Пауза (Тільки читання)', color: 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30' },
    CLOSED: { label: 'Завершена (Архів)', color: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30' },
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-3 rounded-xl text-sm font-bold flex items-center justify-between transition-colors ${statuses[currentStatus].color}`}
      >
        {statuses[currentStatus].label}
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
          {Object.entries(statuses).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => {
                onStatusChange(key);
                setIsOpen(false);
              }}
              className={`w-full text-left p-3 text-sm font-semibold transition-colors hover:bg-slate-100 dark:hover:bg-slate-700
                ${currentStatus === key ? 'bg-slate-50 dark:bg-slate-700/50 text-brand' : 'text-slate-700 dark:text-slate-300'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}