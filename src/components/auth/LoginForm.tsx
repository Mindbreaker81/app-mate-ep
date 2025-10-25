import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface LoginFormProps {
  onSwitch: () => void;
}

export function LoginForm({ onSwitch }: LoginFormProps) {
  const { signIn, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    await signIn({ username, pin });
    setSubmitting(false);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Nombre de usuario</span>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(event) => {
              if (error) clearError();
              setUsername(event.target.value);
            }}
            autoComplete="username"
            inputMode="text"
            maxLength={15}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">PIN (6 dígitos)</span>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={pin}
            onChange={(event) => {
              if (error) clearError();
              setPin(event.target.value.replace(/\D/g, '').slice(0, 6));
            }}
            inputMode="numeric"
            pattern="\d{6}"
            autoComplete="current-password"
            maxLength={6}
            required
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:bg-blue-700 transition disabled:opacity-50"
        disabled={submitting}
      >
        {submitting ? 'Ingresando...' : 'Iniciar sesión'}
      </button>

      <div className="text-center text-sm text-gray-600">
        ¿Aún no tienes una cuenta?{' '}
        <button type="button" className="text-blue-600 font-semibold" onClick={onSwitch}>
          Regístrate
        </button>
      </div>
    </form>
  );
}
