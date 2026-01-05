import type { Avatar } from '../config/avatars';

/**
 * Componente Avatar React
 */
interface AvatarComponentProps {
  avatar: Avatar;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBorder?: boolean;
  className?: string;
}

export function AvatarComponent({ 
  avatar, 
  size = 'md', 
  showBorder = false,
  className = '' 
}: AvatarComponentProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-20 h-20 text-4xl',
    xl: 'w-24 h-24 text-5xl',
  };
  
  const borderClass = showBorder ? 'ring-4 ring-white/20' : '';
  
  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${borderClass} ${className}`}
      style={{ background: avatar.background }}
      title={avatar.name}
    >
      <span className="select-none">{avatar.emoji}</span>
    </div>
  );
}

export default AvatarComponent;
