import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isOnline?: boolean;
  name?: string; // User's name for generating initials
}

/**
 * Generate initials from a name (e.g., "John Doe" -> "JD", "Alice" -> "A")
 */
function getInitials(name?: string): string {
  if (!name) return '?';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    // Single name - return first letter
    return parts[0].charAt(0).toUpperCase();
  } else {
    // Multiple names - return first letter of first and last name
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
}

export function Avatar({ src, alt, size = 'md', className = '', isOnline, name }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // If className contains width/height overrides, use className only (it will override sizeClasses)
  // Otherwise, combine sizeClasses with className
  const hasSizeOverride = className.match(/(w-\[|h-\[|w-\d+|h-\d+|!w-|!h-)/);
  
  // Check if image failed to load
  const [imageError, setImageError] = React.useState(false);
  
  // Reset error state when src changes
  React.useEffect(() => {
    setImageError(false);
  }, [src]);
  
  const displaySrc = src && !imageError ? src : null;
  const initials = getInitials(name || alt);
  
  return (
    <div className="relative">
      <div className={`${hasSizeOverride ? '' : sizeClasses[size]} ${className} rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 flex items-center justify-center text-white font-semibold ${textSizeClasses[size]}`}>
        {displaySrc ? (
          <img 
            src={displaySrc} 
            alt={alt || 'Avatar'} 
            className="w-full h-full object-cover"
            onError={() => {
              // If image fails to load, show initials instead
              setImageError(true);
            }}
          />
        ) : (
          <span className="select-none">{initials}</span>
        )}
      </div>
      {isOnline && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
      )}
    </div>
  );
}