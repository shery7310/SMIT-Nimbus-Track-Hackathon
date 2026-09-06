import { X } from 'lucide-react';

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Cmd/Ctrl + K', description: 'Open Command Palette' },
    { key: 'C', description: 'Create a new task' },
    { key: '1', description: 'Switch to List view' },
    { key: '2', description: 'Switch to Kanban board view' },
    { key: '3', description: 'Switch to Calendar view' },
    { key: 'Cmd/Ctrl + Z', description: 'Undo last task edit, move, or delete' },
    { key: 'Cmd/Ctrl + Y', description: 'Redo previously undone action' },
    { key: '?', description: 'Show keyboard shortcuts guide' },
    { key: 'Esc', description: 'Close any open modal or dropdown' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Keyboard Shortcuts</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <div className="modal-body">
          <div className="shortcuts-list">
            {shortcuts.map(({ key, description }) => (
              <div key={key} className="shortcut-row">
                <span className="shortcut-desc">{description}</span>
                <kbd className="shortcut-key">{key}</kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
