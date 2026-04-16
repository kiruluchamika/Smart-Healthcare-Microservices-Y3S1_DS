import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

type ConfirmationModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger' | 'success';
  isLoading?: boolean;
  details?: ReactNode;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

function getToneClasses(tone: ConfirmationModalProps['tone']) {
  if (tone === 'danger') {
    return {
      accent: 'border-red-200 bg-red-50 text-red-700',
      button: 'bg-red-600 hover:bg-red-700',
      icon: 'text-red-500',
    };
  }

  if (tone === 'success') {
    return {
      accent: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      button: 'bg-emerald-600 hover:bg-emerald-700',
      icon: 'text-emerald-500',
    };
  }

  return {
    accent: 'border-blue-200 bg-blue-50 text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700',
    icon: 'text-blue-500',
  };
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  isLoading = false,
  details,
  onConfirm,
  onClose,
}: ConfirmationModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLoading, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const toneClasses = getToneClasses(tone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className={`inline-flex rounded-2xl border p-3 ${toneClasses.accent}`}>
          <AlertTriangle className={`h-5 w-5 ${toneClasses.icon}`} />
        </div>

        <h3 className="mt-4 text-xl font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>

        {details && <div className="mt-4">{details}</div>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void onConfirm()}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClasses.button}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
