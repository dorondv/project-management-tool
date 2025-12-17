import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isOnline?: boolean;
}

export function Avatar({ src, alt, size = 'md', className = '', isOnline }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  // If className contains width/height overrides, use className only (it will override sizeClasses)
  // Otherwise, combine sizeClasses with className
  const hasSizeOverride = className.match(/(w-\[|h-\[|w-\d+|h-\d+|!w-|!h-)/);
  
  return (
    <div className="relative">
      <div className={`${hasSizeOverride ? '' : sizeClasses[size]} ${className} rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}>
        {src ? (
          <img 
            src={src} 
            alt={alt || 'Avatar'} 
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-1/2 h-1/2 text-gray-500 dark:text-gray-400" />
        )}
      </div>
      {isOnline && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
      )}
    </div>
  );
}