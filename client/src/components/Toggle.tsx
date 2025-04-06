import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  leftLabel?: string;
  rightLabel?: string;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  leftLabel,
  rightLabel,
  disabled = false,
}) => {
  return (
    <div className="flex items-center space-x-3">
      {leftLabel && (
        <span className={`text-sm font-bold ${disabled ? 'text-gray-400' : checked ? 'text-gray-400' : 'text-gray-800'}`}>
          {leftLabel}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 bg-gray-300
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      {rightLabel && (
        <span className={`text-sm font-bold ${disabled ? 'text-gray-400' : checked ? 'text-gray-800' : 'text-gray-400'}`}>
          {rightLabel}
        </span>
      )}
    </div>
  );
};

export default Toggle;
