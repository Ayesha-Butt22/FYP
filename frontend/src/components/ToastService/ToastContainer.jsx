import React, { useState, useEffect } from 'react';
import { toastService } from './toastService';
import './Toast.css';

const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const unsubscribe = toastService.subscribe(setToasts);
        return unsubscribe;
    }, []);

    const handleClose = (id) => {
        toastService.remove(id);
    };

    const getToastIcon = (type) => {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    };

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`toast toast-${toast.type}`}
                    role="alert"
                    aria-live="polite"
                >
                    <div className="toast-content">
            <span className="toast-icon" role="img" aria-label={toast.type}>
              {getToastIcon(toast.type)}
            </span>
                        <span className="toast-message">{toast.message}</span>
                    </div>
                    <button
                        className="toast-close"
                        onClick={() => handleClose(toast.id)}
                        aria-label="Close notification"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;