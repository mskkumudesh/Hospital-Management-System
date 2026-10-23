import { useEffect, useState } from 'react';
import type { FormEvent, ReactElement } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { api, session } from './api';
import Resource from './components/Resource';
import { ErrorText, TextField } from './components/ui';
import Account from './pages/Account';
import Alerts from './pages/Alerts';
import Calendar from './pages/Calendar';
import { pages } from './pages/config';
import Dashboard from './pages/Dashboard';
import PatientDetail from './pages/PatientDetail';
import Reports from './pages/Reports';
import type { Session, User } from './types';

const IDLE_LIMIT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ['click', 'keydown', 'mousemove'];

// Pages that are not simple tables
const CUSTOM_PAGES: Record<string, ReactElement> = {
  alerts: <Alerts />,
  calendar: <Calendar />,
  reports: <Reports />,
  account: <Account />,
};

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const result = await api<Session>('/auth/login', { method: 'POST', body: { username, password } });
      session.set(result);
      onLogin(result.user);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <div className="hidden bg-sea p-12 text-white md:flex md:flex-col md:justify-end">
        <h1 className="text-4xl font-semibold leading-tight">Every patient, appointment and bill in one place.</h1>
      </div>
      <form onSubmit={submit} className="m-auto w-full max-w-sm space-y-4 p-8">
        <h2 className="text-2xl font-semibold">Sign in</h2>
        <ErrorText>{error}</ErrorText>
        <TextField label="Username" autoFocus value={username} onChange={setUsername} />
        <TextField label="Password" type="password" value={password} onChange={setPassword} />
        <button className="btn w-full">Sign in</button>
      </form>
    </main>
  );
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm ${isActive ? 'bg-sea' : 'hover:bg-white/10'}`;

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(session.get()?.user);
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = () => {
    session.clear();
    setUser(null);
  };

  // sign out after 15 minutes without activity
  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, IDLE_LIMIT_MS);
    };
    ACTIVITY_EVENTS.forEach((e) => addEventListener(e, reset));
    reset();
    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((e) => removeEventListener(e, reset));
    };
  }, [user]);

  if (!user) return <Login onLogin={setUser} />;

  // pages this role may open (admin sees everything)
  const allowed = Object.entries(pages).filter(([, p]) => user.role === 'admin' || p.roles.includes(user.role));

  return (
    <div className="flex min-h-screen">
      <nav
        aria-label="Main"
        className={`fixed inset-y-0 left-0 z-20 w-56 shrink-0 overflow-auto bg-ink p-4 text-white md:static ${menuOpen ? '' : 'hidden'} md:block`}
      >
        <p className="mb-6 text-lg font-semibold">Hospital HMS</p>
        <ul className="space-y-1" onClick={() => setMenuOpen(false)}>
          <li>
            <NavLink to="/" end className={navClass}>Dashboard</NavLink>
          </li>
          {allowed.map(([key, page]) => (
            <li key={key}>
              <NavLink to={'/' + key} className={navClass}>{page.title}</NavLink>
            </li>
          ))}
        </ul>
        <button onClick={logout} className="mt-8 w-full rounded-md border border-white/30 px-3 py-2 text-sm hover:bg-white/10">
          Sign out ({user.role})
        </button>
      </nav>

      <main className="min-w-0 flex-1 overflow-x-auto p-4 md:p-6">
        <button className="btn-ghost mb-3 md:hidden" onClick={() => setMenuOpen(!menuOpen)}>Menu</button>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          {allowed.map(([key, page]) => (
            <Route key={key} path={'/' + key} element={CUSTOM_PAGES[key] ?? <Resource key={key} cfg={page} role={user.role} />} />
          ))}
          <Route path="/patients/:id" element={<PatientDetail />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
