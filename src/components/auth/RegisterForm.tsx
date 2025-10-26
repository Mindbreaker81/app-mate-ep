import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AvatarPicker, DEFAULT_AVATAR } from './AvatarPicker';

interface RegisterFormProps {
  onSwitch: () => void;
}

export function RegisterForm({ onSwitch }: RegisterFormProps) {
  const { signUp, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [avatar, setAvatar] = useState<string>(DEFAULT_AVATAR);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    if (pin !== confirmPin) {
      setLocalError('El PIN y su confirmación deben coincidir.');
      return;
    }
    setSubmitting(true);
    await signUp({ username, pin, avatar });
    setSubmitting(false);
  };

  const displayError = localError ?? error;

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Elige un nombre de usuario</span>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(event) => {
              if (displayError) {
                clearError();
                setLocalError(null);
              }
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
              if (displayError) {
                clearError();
                setLocalError(null);
              }
              setPin(event.target.value.replace(/\D/g, '').slice(0, 6));
            }}
            inputMode="numeric"
            pattern="\d{6}"
            autoComplete="new-password"
            maxLength={6}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Confirma tu PIN</span>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={confirmPin}
            onChange={(event) => {
              if (displayError) {
                clearError();
                setLocalError(null);
              }
              setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 6));
            }}
            inputMode="numeric"
            pattern="\d{6}"
            autoComplete="new-password"
            maxLength={6}
            required
          />
        </label>
      </div>

      <div className="space-y-3">
        <span className="text-sm font-semibold text-gray-700 block">Elige tu avatar</span>
        <AvatarPicker value={avatar} onChange={(value) => setAvatar(value)} />
      </div>

      {displayError && <p className="text-sm text-red-600">{displayError}</p>}

      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:bg-blue-700 transition disabled:opacity-50"
        disabled={submitting}
      >
        {submitting ? 'Creando perfil...' : 'Crear mi perfil'}
      </button>

      <div className="text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <button type="button" className="text-blue-600 font-semibold" onClick={onSwitch}>
          Inicia sesión
        </button>
      </div>
    </form>
  );
}
