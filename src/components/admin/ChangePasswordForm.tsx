import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function ChangePasswordForm() {
  const { changePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    const result = await changePassword(password);
    setSubmitting(false);

    if (result.ok) {
      setSuccess(true);
      setPassword('');
      setConfirmation('');
    } else {
      setError(result.error);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-sm font-semibold text-gray-700">Nueva contraseña</span>
        <input
          type="password"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={(event) => {
            setError(null);
            setSuccess(false);
            setPassword(event.target.value);
          }}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-gray-700">Repite la contraseña</span>
        <input
          type="password"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={confirmation}
          onChange={(event) => {
            setError(null);
            setSuccess(false);
            setConfirmation(event.target.value);
          }}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Contraseña actualizada.</p>}

      <button
        type="submit"
        className="bg-gray-800 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
        disabled={submitting}
      >
        {submitting ? 'Guardando...' : 'Cambiar contraseña'}
      </button>
    </form>
  );
}
