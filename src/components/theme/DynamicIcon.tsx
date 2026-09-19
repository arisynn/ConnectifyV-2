import React from 'react';
import { useTheme } from '../../core/theme/ThemeProvider';
import { useProfile } from '../../core/profile/ProfileContext';
import { cosmeticAsset, BASE_TILE_IDS } from '../../core/cosmetics';
import { TileArtwork } from './TileArtwork';

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
  const { profile } = useProfile();
  if (type === 'tiles' && name === 'crab' && profile.activeSingleTile === 'tile_gold_crab') return <img alt="Kepiting Emas" src={cosmeticAsset('tile_gold_crab')} className={`object-contain ${className}`} />;
  if (type === 'tiles' && ['garden','space'].includes(profile.activeTilePack) && BASE_TILE_IDS.includes(name)) return <TileArtwork name={name} pack={profile.activeTilePack} className={className} />;
  const src = (type === 'logo' ? cosmeticAsset(name) : null) || activeTheme?.assets?.[type]?.[name];

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
