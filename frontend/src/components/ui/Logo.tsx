'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'auto';
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  imageClassName?: string;
  textClassName?: string;
}

const sizeConfig = {
  xs: { width: 16, height: 16 },
  sm: { width: 24, height: 24 },
  md: { width: 32, height: 32 },
  lg: { width: 48, height: 48 },
  xl: { width: 64, height: 64 },
};

const textSizeConfig = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
};

export function Logo({
  size = 'md',
  variant = 'auto',
  showText = true,
  textSize = 'lg',
  className,
  imageClassName,
  textClassName,
}: LogoProps) {
  const { width, height } = sizeConfig[size];
  
  const getTextColor = () => {
    if (variant === 'light') return 'text-white';
    if (variant === 'dark') return 'text-gray-800';
    return 'text-gray-800 dark:text-white'; // auto variant
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative flex-shrink-0">
        <Image
          src="/channelzap.com_logo_OG.svg"
          alt="ChannelZap"
          width={width}
          height={height}
          className={cn('object-contain', imageClassName)}
          priority
        />
      </div>
      {showText && (
        <span
          className={cn(
            'font-bold tracking-tight',
            textSizeConfig[textSize],
            getTextColor(),
            textClassName
          )}
        >
          ChannelZap
        </span>
      )}
    </div>
  );
}

export default Logo;
