// ToastService.jsx
class ToastService {
    constructor() {
        this.toasts = [];
        this.listeners = [];
        this.nextId = 1;
    }


    show(message, type = 'info', duration = 5000) {
        const toast = {
            id: this.nextId++,
            message,
            type,
            duration,
            timestamp: Date.now()
        };

        this.toasts.push(toast);
        this.notifyListeners();


        if (duration > 0) {
            setTimeout(() => {
                this.remove(toast.id);
            }, duration);
        }

        return toast.id;
    }

    remove(id) {
        this.toasts = this.toasts.filter(toast => toast.id !== id);
        this.notifyListeners();
    }

    clear() {
        this.toasts = [];
        this.notifyListeners();
    }


    getToasts() {
        return [...this.toasts];
    }


    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notifyListeners() {
        this.listeners.forEach(listener => {
            listener([...this.toasts]);
        });
    }

    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 7000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 6000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }
}


export const toastService = new ToastService();
export default toastService;