import { Bell, CheckCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { apiRequest } from '../lib/api';
import { notify } from '../lib/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL.replace(/\/api\/v1\/?$/, '');

function playSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 740;
    gain.gain.setValueAtTime(0.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.25);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.25);
  } catch {
    // Browsers may block sound until the user interacts with the page.
  }
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const unread = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  useEffect(() => {
    apiRequest('/notifications')
      .then((response) => setItems(response.data.notifications))
      .catch(() => {});
    const socket = io(SOCKET_URL, { auth: { token: localStorage.getItem('leadflow_token') } });
    socket.on('notification:new', (item) => {
      setItems((current) => [item, ...current].slice(0, 50));
      playSound();
      notify(item.title);
    });
    return () => socket.disconnect();
  }, []);

  async function read(item) {
    if (!item.isRead) {
      await apiRequest(`/notifications/${item.id}/read`, { method: 'PATCH' });
      setItems((current) =>
        current.map((value) => (value.id === item.id ? { ...value, isRead: true } : value)),
      );
    }
    setOpen(false);
    if (item.leadId) navigate(`/leads/${item.leadId}`);
  }

  async function readAll() {
    await apiRequest('/notifications/read-all', { method: 'PATCH' });
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
  }

  return (
    <div className="relative">
      <button
        className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <h2 className="font-display font-bold">Notifications</h2>
            <button
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600"
              onClick={readAll}
            >
              <CheckCheck size={15} /> Mark all read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => read(item)}
                className={`block w-full border-b border-slate-100 p-4 text-left hover:bg-slate-50 ${item.isRead ? 'opacity-65' : 'bg-indigo-50/40'}`}
              >
                <div className="flex gap-2">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.isRead ? 'bg-transparent' : 'bg-indigo-500'}`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.message}</p>
                    <time className="mt-2 block text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </time>
                  </div>
                </div>
              </button>
            ))}
            {!items.length && (
              <p className="p-8 text-center text-sm text-slate-500">No notifications yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
