import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { removeToast } from '../../store/toastSlice';
import { performUndo } from '../../store/undoRedoSlice';

export default function ToastContainer() {
  const dispatch = useDispatch();
  const toasts = useSelector((state) => state.toast?.toasts || []);

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => dispatch(removeToast(toast.id))} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!toast.duration) return;
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const handleActionClick = () => {
    if (toast.action?.label === 'Undo' || toast.action?.actionType === 'undo') {
      dispatch(performUndo());
    } else if (typeof toast.action?.onClick === 'function') {
      toast.action.onClick();
    }
    onClose();
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="toast-icon success" />;
      case 'error':
        return <AlertCircle className="toast-icon error" />;
      case 'warning':
        return <AlertTriangle className="toast-icon warning" />;
      default:
        return <Info className="toast-icon info" />;
    }
  };

  return (
    <div className={`toast-item toast-${toast.type || 'info'}`}>
      <div className="toast-content">
        {getIcon()}
        <span className="toast-message">{toast.message}</span>
      </div>

      <div className="toast-actions-row">
        {toast.action && (
          <button type="button" className="toast-inline-btn" onClick={handleActionClick}>
            {toast.action.label}
          </button>
        )}
        <button type="button" className="toast-close-btn" onClick={onClose} aria-label="Close notification">
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}
