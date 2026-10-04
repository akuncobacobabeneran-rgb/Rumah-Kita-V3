import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}: ResponsiveModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full ${maxWidth} bg-[#FAF7F2] sm:rounded-3xl rounded-t-3xl border border-[#E8E2D5] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden transition-transform duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile bottom sheet drag handle */}
        <div className="sm:hidden w-10 h-1.5 bg-[#D8D0C5] rounded-full mx-auto mt-3 mb-1 shrink-0" />

        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E2D5] bg-white shrink-0">
          <div className="min-w-0 pr-3">
            <h2 className="text-base font-bold text-[#1E2D24] truncate">{title}</h2>
            {subtitle && (
              <p className="text-xs text-[#5C6B62] mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-[#5C6B62] hover:text-[#1E2D24] hover:bg-[#F4EFE6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Hapus',
}: ConfirmDialogProps) {
  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-[#5C6B62] leading-relaxed">{description}</p>
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-sm font-medium text-[#1E2D24] hover:bg-[#F4EFE6] transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C84B31] text-white text-sm font-semibold hover:bg-[#B03E26] transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
