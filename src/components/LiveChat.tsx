'use client';

import { useEffect, useRef, useState } from 'react';
import { radioConfig } from '@/lib/radio-config';
import {
  type MessageRecord,
  AGE_RANGES,
  isJoined,
  getNickname,
  getDeviceId,
  joinChat,
  leaveChat,
  loadMessages,
  sendListenerMessage,
  subscribeMessages,
} from '@/lib/pocketbase';
import { track, setInChat } from '@/lib/analytics';

/** Chat público en vivo, embebido (llena el contenedor de la sección). */
export default function LiveChat() {
  const [joined, setJoined] = useState(false);

  useEffect(() => setJoined(isJoined()), []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ChatHeader />
      {joined ? (
        <ChatRoom onLeave={() => setJoined(false)} />
      ) : (
        <QuickJoin onDone={() => setJoined(true)} />
      )}
    </div>
  );
}

function ChatHeader() {
  return (
    <header className="flex items-center gap-3 border-b border-primary/15 bg-gradient-to-r from-primary/12 via-primary/5 to-transparent px-4 py-3">
      <LiveDot />
      <div className="leading-tight">
        <p className="text-sm font-bold text-foreground">Sala en vivo</p>
        <p className="text-[0.65rem] text-muted">Todos ven lo que escribes · saluda al aire 🎧</p>
      </div>
    </header>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_var(--brand-primary)]" />
    </span>
  );
}

/** Entrada rápida: nickname + rango de edad, sin cuentas ni contraseñas. */
function QuickJoin({ onDone }: { onDone: () => void }) {
  const [nick, setNick] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = nick.trim();
    if (n.length < 2) {
      setError('Escribe un nickname (mínimo 2 caracteres).');
      return;
    }
    if (!ageRange) {
      setError('Elige tu rango de edad.');
      return;
    }
    joinChat(n, ageRange);
    onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col justify-center gap-5 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary shadow-[0_0_30px_-8px_var(--brand-primary)] ring-1 ring-primary/30">
          <ChatBubbleIcon />
        </div>
        <div>
          <p className="text-base font-bold text-foreground">Entra al chat en vivo</p>
          <p className="mt-1 text-sm text-muted">Elige un nickname y tu edad. Sin registros.</p>
        </div>
      </div>

      <Field label="Tu nickname (así te verán)">
        <input
          required
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          maxLength={20}
          className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 outline-none transition-colors focus:border-primary"
          placeholder="Ej: ElParcero"
        />
      </Field>

      <Field label="Rango de edad">
        <select
          required
          value={ageRange}
          onChange={(e) => setAgeRange(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 outline-none transition-colors focus:border-primary"
        >
          <option value="" disabled>
            Selecciona…
          </option>
          {AGE_RANGES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Field>

      {error && <p className="text-sm text-live">{error}</p>}

      <button type="submit" className="btn-glow rounded-xl py-3">
        Entrar al chat
      </button>
    </form>
  );
}

function ChatRoom({ onLeave }: { onLeave: () => void }) {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [text, setText] = useState('');
  const me = getNickname();
  const myDevice = getDeviceId();
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Marca presencia "en chat" y registra apertura.
    track('click', 'chat_open');
    setInChat(true);
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const initial = await loadMessages();
        setMessages(initial);
      } catch {
        /* sin historial */
      }
      unsub = await subscribeMessages((rec, action) => {
        setMessages((prev) => {
          if (action === 'delete') return prev.filter((m) => m.id !== rec.id);
          if (prev.some((m) => m.id === rec.id))
            return prev.map((m) => (m.id === rec.id ? rec : m));
          return [...prev, rec];
        });
      });
    })();
    return () => {
      unsub?.();
      setInChat(false);
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText('');
    try {
      await sendListenerMessage(t);
      // Cuenta cada mensaje enviado (métrica de actividad del chat).
      track('chat', 'chat_message');
    } catch {
      setText(t); // restaura si falla
    }
  }

  function handleLeave() {
    leaveChat();
    onLeave();
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2 text-xs">
        <span className="flex items-center gap-1.5 text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
          Estás como <b className="text-primary">{me}</b>
        </span>
        <button onClick={handleLeave} className="text-muted transition-colors hover:text-foreground">
          Cambiar
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="m-auto flex flex-col items-center gap-2 text-center text-muted">
            <span className="text-3xl">🎶</span>
            <p className="text-sm">Sé el primero. Saluda o pide tu canción al aire.</p>
          </div>
        )}
        {messages.map((m) => {
          const isAdmin = m.sender === 'admin';
          const isStation = m.sender === 'station';
          const mine = m.sender === 'listener' && m.device_id === myDevice;
          const label = isAdmin ? `${m.name}_admin` : isStation ? radioConfig.stationName : m.name || 'Oyente';
          const special = isAdmin || isStation;

          if (mine) {
            return (
              <div key={m.id} className="msg-pop flex justify-end">
                <div className="bubble-mine max-w-[80%] rounded-2xl rounded-br-md px-3.5 py-2 text-sm font-medium">
                  {m.text}
                </div>
              </div>
            );
          }

          return (
            <div key={m.id} className="msg-pop flex items-end gap-2">
              <span
                className="chat-avatar"
                style={{ background: special ? undefined : avatarColor(label) }}
                data-special={special}
              >
                {special ? (isAdmin ? '★' : '📻') : initial(label)}
              </span>
              <div
                className={`max-w-[78%] rounded-2xl rounded-bl-md px-3.5 py-2 text-sm ${
                  special
                    ? 'border border-secondary/50 bg-secondary/15'
                    : 'border border-border bg-surface-2'
                }`}
              >
                <p
                  className={`mb-0.5 text-xs font-bold ${special ? 'text-secondary' : ''}`}
                  style={special ? undefined : { color: avatarColor(label) }}
                >
                  {label}
                </p>
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje…"
          className="flex-1 rounded-full border border-border bg-surface-2 px-4 py-2.5 outline-none transition-colors focus:border-primary"
        />
        <button
          type="submit"
          aria-label="Enviar"
          className="btn-glow grid h-11 w-11 place-items-center rounded-full"
        >
          <SendIcon />
        </button>
      </form>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

/** Inicial en mayúscula para el avatar. */
function initial(name: string): string {
  return (name.trim()[0] || '?').toUpperCase();
}

/** Color estable derivado del nombre (para avatar y nick). */
function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h}, 70%, 62%)`;
}

function ChatBubbleIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
    </svg>
  );
}
