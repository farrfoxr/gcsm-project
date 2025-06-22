import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-white rounded-xl shadow-floating p-8 text-center max-w-2xl mx-auto">
      <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-zinc-800 mb-2">
        Something went wrong
      </h3>
      <p className="text-zinc-600 mb-6">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-white border-2 border-zinc-300 text-zinc-800 font-medium py-2 px-6 rounded-lg hover:border-pinkAccent-500 hover:text-pinkAccent-600 focus:outline-none focus:ring-2 focus:ring-pinkAccent-500 focus:ring-offset-2 transition-all"
        >
          Try Again
        </button>
      )}
    </div>
  );
}