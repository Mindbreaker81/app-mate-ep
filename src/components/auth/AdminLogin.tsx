import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginProps {
  onBack: () => void;
}

export function AdminLogin({ onBack }: AdminLoginProps) {
  const { signInAdmin, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    await signInAdmin({ email, password });
    setSubmitting(false);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Email</span>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(event) => {
              if (error) clearError();
              setEmail(event.target.value);
            }}
            autoComplete="email"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Contraseña</span>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(event) => {
              if (error) clearError();
              setPassword(event.target.value);
            }}
            autoComplete="current-password"
            required
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        className="w-full bg-gray-800 text-white font-semibold py-3 rounded-lg shadow-lg hover:bg-gray-900 transition disabled:opacity-50"
        disabled={submitting}
      >
        {submitting ? 'Ingresando...' : 'Iniciar sesión'}
      </button>

      <div className="text-center text-sm text-gray-600">
        <button type="button" className="text-blue-600 font-semibold" onClick={onBack}>
          Volver al acceso de niños
        </button>
      </div>
    </form>
  );
}
