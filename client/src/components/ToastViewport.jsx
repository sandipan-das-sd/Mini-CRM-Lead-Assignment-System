import { CheckCircle2, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ToastViewport() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    function receive(event) {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, ...event.detail }]);
      window.setTimeout(
        () => setToasts((current) => current.filter((item) => item.id !== id)),
        4000,
      );
    }
    window.addEventListener('leadflow:toast', receive);
    return () => window.removeEventListener('leadflow:toast', receive);
  }, []);
  return (
    <div className="fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((item) => (
        <div
          key={item.id}
          className={`flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-xl ${item.type === 'error' ? 'border-rose-200' : 'border-emerald-200'}`}
        >
          {item.type === 'error' ? (
            <XCircle className="mt-0.5 shrink-0 text-rose-500" size={20} />
          ) : (
            <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={20} />
          )}
          <p className="flex-1 text-sm font-semibold text-slate-700">{item.message}</p>
          <button
            onClick={() => setToasts((current) => current.filter((toast) => toast.id !== item.id))}
            aria-label="Dismiss notification"
          >
            <X size={17} className="text-slate-400" />
          </button>
        </div>
      ))}
    </div>
  );
}
