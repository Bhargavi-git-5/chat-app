'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { cn } from '../utils/cn';

const COLORS = [
  'bg-rose-500',
  'bg-amber-500',
  'bg-emerald-600',
  'bg-sky-600',
  'bg-violet-500',
  'bg-teal-600',
  'bg-fuchsia-600',
];

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
} as const;

function hash(value: string): number {
  let h = 0;
  for (const ch of value) {
    h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return h;
}

interface AvatarProps {
  name: string;
  avatar?: string;
  online?: boolean;
  group?: boolean;
  size?: keyof typeof SIZES;
}

export function Avatar({
  name,
  avatar,
  online,
  group,
  size = 'md',
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const showImage = avatar && !imageError && !group;

  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden rounded-full font-semibold text-white',
          SIZES[size],
          !showImage && COLORS[hash(name) % COLORS.length],
        )}
      >
        {showImage ? (
          <img
            src={avatar}
            alt={`${name} profile`}
            className="h-full w-full rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : group ? (
          <Users className="h-1/2 w-1/2" />
        ) : (
          initials
        )}
      </div>

      {online !== undefined && !group && (
        <span
          title={online ? 'Online' : 'Offline'}
          className={cn(
            'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900',
            online ? 'bg-emerald-500' : 'bg-slate-400',
          )}
        />
      )}
    </div>
  );
}