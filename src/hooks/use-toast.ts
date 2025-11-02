import { toast as sonnerToast } from 'sonner';

type ToastVariant = 'default' | 'destructive';

interface ToastOptions {
  variant?: ToastVariant;
  title?: string;
  description?: string;
}

export function useToast() {
  const toast = ({ variant, title, description }: ToastOptions) => {
    const message = title || description || '';
    const fullMessage = title && description ? `${title}: ${description}` : message;

    if (variant === 'destructive') {
      sonnerToast.error(fullMessage);
    } else {
      sonnerToast.success(fullMessage);
    }
  };

  return { toast };
}
