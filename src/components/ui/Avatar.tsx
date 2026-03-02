interface AvatarProps {
  url?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-20 h-20 text-2xl',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ url, name, size = 'md', className = '' }: AvatarProps) {
  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-full overflow-hidden border-2 border-brand-500/40 bg-brand-500/20 flex items-center justify-center shrink-0 ${className}`}
    >
      {url ? (
        <img src={url} alt={name ?? 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        <span className="font-semibold text-brand-400 leading-none select-none">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
