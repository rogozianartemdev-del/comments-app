import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function AuthBar() {
  const { user, login, register, logout } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return (
      <div className="auth-bar">
        <span>Вы вошли как {user.username}</span>
        <button onClick={logout}>Выйти</button>
      </div>
    );
  }

  const handleSubmit = async () => {
    setError(null);
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, email, password);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Ошибка авторизации');
    }
  };

  return (
    <div className="auth-bar">
      <input
        placeholder={mode === 'login' ? 'Username или email' : 'Username'}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      {mode === 'register' && (
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      )}
      <input
        placeholder="Пароль"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleSubmit}>{mode === 'login' ? 'Войти' : 'Регистрация'}</button>
      <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
      </button>
      {error && <span className="auth-bar__error">{error}</span>}
    </div>
  );
}