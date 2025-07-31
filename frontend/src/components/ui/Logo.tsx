'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'auto';
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  href?: string;
  clickable?: boolean;
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
  href,
  clickable = false,
}: LogoProps) {
  const { width, height } = sizeConfig[size];
  
  const getTextColor = () => {
    if (variant === 'light') return 'text-white';
    if (variant === 'dark') return 'text-gray-800';
    return 'text-gray-800 dark:text-white'; // auto variant
  };

  const logoContent = (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative flex-shrink-0">
        <Image
          src="/channelzap.com_logo_OG.svg"
          alt="Logo"
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

  if (clickable && href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

export default Logo;
