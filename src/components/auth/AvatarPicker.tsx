const AVATAR_OPTIONS = ['🦊', '🐼', '🐵', '🐯', '🐸', '🐶', '🐱', '🦁', '🐰', '🐨'] as const;

interface AvatarPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {AVATAR_OPTIONS.map((avatar) => {
        const isSelected = value === avatar;
        return (
          <button
            key={avatar}
            type="button"
            onClick={() => onChange(avatar)}
            className={`flex items-center justify-center text-3xl rounded-full h-14 w-14 transition transform ${
              isSelected ? 'scale-110 ring-4 ring-blue-400 bg-blue-50' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            aria-label={`Elegir avatar ${avatar}`}
          >
            {avatar}
          </button>
        );
      })}
    </div>
  );
}

export const DEFAULT_AVATAR = AVATAR_OPTIONS[0];
