import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  keyword?: string;
  className?: string;
}

export default function LoadingSpinner({ keyword, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="relative">
        <Loader2 className="h-8 w-8 animate-spin text-pinkAccent-500" />
      </div>
      <div className="mt-4 text-center">
        {keyword && (
          <p className="text-zinc-800 font-medium">
            Searching for &ldquo;{keyword}&rdquo;...
          </p>
        )}
        <p className="text-zinc-500 text-sm mt-1">
          This may take a moment.
        </p>
      </div>
    </div>
  );
}