// Simple toast notification utility
interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

class Toast {
  private container: HTMLElement | null = null;

  private createContainer() {
    if (this.container) return this.container;

    this.container = document.createElement('div');
    this.container.className = 'fixed top-4 right-4 z-50 flex flex-col space-y-2';
    document.body.appendChild(this.container);
    return this.container;
  }

  private createToast(message: string, type: 'success' | 'error' | 'info', options: ToastOptions = {}) {
    const container = this.createContainer();
    const toast = document.createElement('div');
    
    const bgColor = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    }[type];

    toast.className = `${bgColor} text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full opacity-0`;
    toast.textContent = message;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-x-full', 'opacity-0');
    });

    // Auto remove
    const duration = options.duration || 3000;
    setTimeout(() => {
      toast.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast);
        }
        if (container.children.length === 0) {
          document.body.removeChild(container);
          this.container = null;
        }
      }, 300);
    }, duration);
  }

  success(message: string, options?: ToastOptions) {
    this.createToast(message, 'success', options);
  }

  error(message: string, options?: ToastOptions) {
    this.createToast(message, 'error', options);
  }

  info(message: string, options?: ToastOptions) {
    this.createToast(message, 'info', options);
  }
}

export const toast = new Toast();
