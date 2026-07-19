import { useState } from 'react';
import { resetChildPin } from '../../services/adminService';

interface PinResetDialogProps {
  username: string;
  onClose: () => void;
}

function randomPin(): string {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
}

export function PinResetDialog({ username, onClose }: PinResetDialogProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [appliedPin, setAppliedPin] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await resetChildPin(username, pin);
    setSubmitting(false);
    if (result.ok) {
      setAppliedPin(pin);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-xl font-bold text-gray-800">
          Nuevo PIN para <span className="text-blue-600">{username}</span>
        </h3>

        {appliedPin ? (
          <div className="space-y-4">
            <p className="text-gray-700">
              PIN actualizado. Comunícale al niño su nuevo PIN:
            </p>
            <p className="text-center text-3xl font-bold tracking-widest bg-green-50 text-green-700 rounded-lg py-3">
              {appliedPin}
            </p>
            <button
              type="button"
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">PIN nuevo (6 dígitos)</span>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={pin}
                onChange={(event) => {
                  setError(null);
                  setPin(event.target.value.replace(/\D/g, '').slice(0, 6));
                }}
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
              />
            </label>

            <button
              type="button"
              className="text-sm text-blue-600 font-semibold"
              onClick={() => {
                setError(null);
                setPin(randomPin());
              }}
            >
              🎲 Generar aleatorio
            </button>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-200 transition"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                disabled={submitting || pin.length !== 6}
              >
                {submitting ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
