import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = true,
  requireInputMatch = null, // e.g. "DELETE" for high risk danger zone
  onConfirm,
  onCancel,
}) {
  const [matchInput, setMatchInput] = useState('');

  if (!isOpen) return null;

  const isConfirmedDisabled = requireInputMatch && matchInput.trim() !== requireInputMatch;

  const handleConfirm = () => {
    if (isConfirmedDisabled) return;
    onConfirm();
    setMatchInput('');
  };

  const handleCancel = () => {
    setMatchInput('');
    onCancel();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: isDanger ? 'var(--status-blocked)' : 'inherit' }}>
            {isDanger && <AlertTriangle style={{ width: 18, height: 18 }} />}
            {title}
          </h3>
          <button type="button" className="modal-close" onClick={handleCancel}>
            <X />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--ink-600)', margin: '0 0 16px', lineHeight: 1.5 }}>
            {message}
          </p>

          {requireInputMatch && (
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6 }}>
                Please type <strong style={{ color: 'var(--ink-900)' }}>{requireInputMatch}</strong> to confirm:
              </label>
              <input
                type="text"
                className="auth-input"
                autoFocus
                value={matchInput}
                onChange={(e) => setMatchInput(e.target.value)}
                placeholder={requireInputMatch}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={handleCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleConfirm}
            disabled={isConfirmedDisabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
