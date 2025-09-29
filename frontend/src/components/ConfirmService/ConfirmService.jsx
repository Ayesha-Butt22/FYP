
import React, { useState, useCallback } from "react";
import ReactDOM from "react-dom";
import "./ConfirmService.css"
let confirmHandler;

export function ConfirmService() {
    const [options, setOptions] = useState(null);

    const close = (result) => {
        setOptions(null);
        if (options?.resolve) options.resolve(result);
    };

    confirmHandler = useCallback((message) => {
        return new Promise((resolve) => {
            setOptions({ message, resolve });
        });
    }, []);

    if (!options) return null;

    return ReactDOM.createPortal(
        <>
            <div className="confirm-overlay">
                <div className="confirm-modal">
                    <div className="confirm-content">
                        <div className="confirm-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>

                        <p className="confirm-message">
                            {options.message}
                        </p>

                        <div className="confirm-actions">
                            <button
                                className="confirm-btn confirm-btn-yes"
                                onClick={() => close(true)}
                            >
                                Yes
                            </button>
                            <button
                                className="confirm-btn confirm-btn-cancel"
                                onClick={() => close(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}

export function Confirm(message) {
    return confirmHandler?.(message);
}