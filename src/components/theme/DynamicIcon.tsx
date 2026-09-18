import React from 'react';
import { useTheme } from '../../core/theme/ThemeProvider';

interface DynamicIconProps {
  name: string;
  type?: 'logo' | 'tiles';
  className?: string;
  LucideFallback?: React.ElementType;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({
  name,
  type = 'logo',
  className = '',
  LucideFallback
}) => {
  const { activeTheme } = useTheme();
  const src = activeTheme?.assets?.[type]?.[name];

  if (src) {
    // ATURAN MUTLAK GEOMETRI: object-contain digunakan agar gambar (terutama tile persegi panjang) 
    // ter-render sesuai rasio aslinya tanpa terdistorsi/stretch.
    return <img src={src} alt={name} className={`object-contain ${className}`.trim()} />;
  }

  if (LucideFallback) {
    return <LucideFallback className={className} />;
  }

  // Fallback if it's an emoji or plain string
  return <span className={className}>{name}</span>;
};
