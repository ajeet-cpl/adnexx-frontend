import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

// --------------------------------------------------------------------------
// Toast Context
// --------------------------------------------------------------------------
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((toast) => {
    const newToast = {
      ...toast,
      id: `${Date.now()}-${Math.random()}`,
      duration: toast.duration ?? 5000,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, add, remove, clear }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// --------------------------------------------------------------------------
// Helper functions (singleton for non-hook usage)
// --------------------------------------------------------------------------
let globalToastAdd = null;

export function setGlobalToastAdd(add) {
  globalToastAdd = add;
}

export const toast = {
  success: (title, message, duration) => {
    if (globalToastAdd) {
      globalToastAdd({ type: 'success', title, message, duration });
    }
  },
  error: (title, message, duration) => {
    if (globalToastAdd) {
      globalToastAdd({ type: 'error', title, message, duration: duration ?? 7000 });
    }
  },
  warning: (title, message, duration) => {
    if (globalToastAdd) {
      globalToastAdd({ type: 'warning', title, message, duration });
    }
  },
  info: (title, message, duration) => {
    if (globalToastAdd) {
      globalToastAdd({ type: 'info', title, message, duration });
    }
  },
};

function ToastContainer() {
  const { toasts, remove, add } = useToast();

  // Register global toast add function
  useEffect(() => {
    setGlobalToastAdd(add);
    return () => setGlobalToastAdd(null);
  }, [add]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 420,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(onClose, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  const iconMap = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colorMap = {
    success: { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)', text: '#22c55e', icon: '#22c55e' },
    error: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444', icon: '#ef4444' },
    warning: { bg: 'rgba(251, 146, 60, 0.1)', border: 'rgba(251, 146, 60, 0.3)', text: '#fb923c', icon: '#fb923c' },
    info: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: '#3b82f6', icon: '#3b82f6' },
  };

  const Icon = iconMap[toast.type];
  const colors = colorMap[toast.type];

  return (
    <div
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        pointerEvents: 'all',
        backdropFilter: 'blur(8px)',
        minWidth: 320,
        animation: 'slideInRight 0.3s ease-out',
      }}
    >
      <Icon size={18} style={{ color: colors.icon, flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-1)',
            marginBottom: toast.message ? 4 : 0,
          }}
        >
          {toast.title}
        </div>
        {toast.message && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: '1.4' }}>
            {toast.message}
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-3)',
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

