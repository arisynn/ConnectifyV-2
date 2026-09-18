import { useState } from 'react';
import { useProfile } from '../../../core/profile/ProfileContext';
import { useCDE } from '../../../core/cde';

// All power-ups are consumed through the CDE `USE_ITEM` operation so the
// server stays authoritative (counts are protected fields on the profile).
export const usePowerups = () => {
  const { profile } = useProfile();
  const cde = useCDE();
  const shuffles = profile?.shuffles ?? 0;
  const hammers = profile?.hammers ?? 0;
  const bombs = profile?.bombs ?? 0;
  
  const [activePowerup, setActivePowerup] = useState<'hammer' | 'bomb' | null>(null);

  const requestShuffle = () => {
    if (shuffles > 0) {
      cde.queueMutation('USE_ITEM', { itemId: 'shuffle' });
      setActivePowerup(null);
      return true;
    }
    return false;
  };

  const toggleHammer = () => {
    if (hammers > 0) {
      setActivePowerup(prev => prev === 'hammer' ? null : 'hammer');
    }
  };

  const consumeHammer = () => {
    if (hammers > 0 && activePowerup === 'hammer') {
      cde.queueMutation('USE_ITEM', { itemId: 'hammer' });
      setActivePowerup(null);
      return true;
    }
    return false;
  };

  const toggleBomb = () => {
    if (bombs > 0) {
      setActivePowerup(prev => prev === 'bomb' ? null : 'bomb');
    }
  };

  const consumeBomb = () => {
    if (bombs > 0 && activePowerup === 'bomb') {
      cde.queueMutation('USE_ITEM', { itemId: 'bomb' });
      setActivePowerup(null);
      return true;
    }
    return false;
  };

  const cancelPowerup = () => setActivePowerup(null);
  const reset = () => setActivePowerup(null);

  return {
    shuffles,
    hammers,
    bombs,
    activePowerup,
    requestShuffle,
    toggleHammer,
    consumeHammer,
    toggleBomb,
    consumeBomb,
    cancelPowerup,
    reset
  };
};
