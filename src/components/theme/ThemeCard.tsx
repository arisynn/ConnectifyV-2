import React from 'react';
import { useTheme } from '../../core/theme/ThemeProvider';

interface ThemeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  bgKey?: string;
  fallbackColorClass?: string;
}

export const ThemeCard: React.FC<ThemeCardProps> = ({
  bgKey,
  fallbackColorClass = 'bg-theme-surface-primary',
  className = '',
  children,
  style,
  ...props
}) => {
  const { activeTheme } = useTheme();
  const bgImage = bgKey && activeTheme?.assets?.backgrounds ? activeTheme.assets.backgrounds[bgKey] : null;

  const dynamicStyle = bgImage
    ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', ...style }
    : style;

  const baseClass = bgImage ? '' : fallbackColorClass;

  return (
    <div className={`${baseClass} ${className}`.trim()} style={dynamicStyle} {...props}>
      {children}
    </div>
  );
};
