import React, { useState, useEffect } from 'react';
import { useGame } from '../GameContext';
import { Users, Swords, Trophy, AlertTriangle, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { KineticButton, ProfileComponent } from '../designs/KineticComponents';
import { KineticBottomSheet, KineticDialog, KineticModal, KineticBadge } from '../designs/KineticPopups';
import { useProfile } from '../core/profile/ProfileContext';
import { useMultiplayer } from '../core/hooks/useMultiplayer';
import { DynamicIcon } from '../components/theme/DynamicIcon';
import { generateBoard } from '../core/board';
import { useTheme } from '../core/theme/ThemeProvider';
import { MultiplayerGameplay } from '../game/MultiplayerGameplay';
import { MultiplayerBlockPuzzleGameplay } from '../game/block-puzzle/MultiplayerBlockPuzzleGameplay';

export const MultiplayerScreen = ({ onBack, isEmbedded = false }: { onBack?: () => void, isEmbedded?: boolean }) => {
  const { navigate, user } = useGame();
  const { profile } = useProfile();
  const { activeTheme } = useTheme();
  
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  
  const {
    room, error, isLoading,
    createRoom, joinRoom, leaveRoom, setReady,
    startMatch, readyForGame, completeMatch, reportLoss, reportTimeUp
  } = useMultiplayer();

  const handleStartMatch = () => {
      let board;
      if (room?.gameMode === 'block-puzzle') {
          board = []; // No initial board needed for block puzzle currently
      } else {
          board = generateBoard(activeTheme.id, profile.highestLevel || 1);
      }
      startMatch(board);
  };

  const handleCreate = async (gameMode: string) => {
    try {
      await createRoom(gameMode);
      setShowCreateModal(false);
    } catch (e) {
      alert(e);
    }
  };

  const handleJoin = async () => {
    if (!joinCode) return;
    try {
      await joinRoom(joinCode);
      setShowJoinModal(false);
    } catch (e) {
      alert(e);
    }
  };

  const handleLeave = async () => {
    await leaveRoom();
    if (!isEmbedded) navigate('levels');
  };

  const handleAttemptLeave = () => {
    if (room?.status === 'PLAYING') {
      setShowLeaveWarning(true);
    } else {
      handleLeave();
    }
  };

  useEffect(() => {
    if (room?.status === 'FINISHED') {
      setShowResultModal(true);
    } else {
      setShowResultModal(false);
    }
  }, [room?.status]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (room?.status === 'PLAYING') {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [room?.status]);

  // Derive player states
  const me = room?.players.find(p => p.name === user.name);
  const opponent = room?.players.find(p => p.name !== user.name);
  const isHost = room?.host === user.name;
  const hasPendingWager = room?.wager && !room.wager.memberAgreed;

  // Auto ready for game when starting
  useEffect(() => {
      if (room?.status === 'STARTING' && me && !me.readyForGame) {
          readyForGame();
      }
  }, [room?.status, me?.readyForGame]);

  return (
    <motion.div 
      initial={isEmbedded ? { opacity: 0, scale: 0.95 } : { opacity: 0, y: '100%' }} 
      animate={isEmbedded ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0 }} 
      exit={isEmbedded ? { opacity: 0, scale: 0.95 } : { opacity: 0, y: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={isEmbedded ? "flex-1 w-full flex flex-col font-sans relative pb-28 pt-24" : "absolute inset-0 bg-theme-bg-main bg-[image:var(--asset-bg-global)] z-[100] flex flex-col font-sans"}
    >
      {/* Standalone Header (Only if not embedded) */}
      {!isEmbedded && (
        <div className="flex items-center gap-4 px-5 py-4 z-10 shrink-0 bg-theme-primary-sky-blue border-b-theme-base border-theme-border-main shadow-theme-base">
          <button
              onClick={room ? handleAttemptLeave : (onBack || (() => navigate('levels')))}
              className="p-3 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[1.5rem] shadow-theme-base active:translate-y-1 active:translate-x-0.5 active:shadow-[var(--geometry-shadow-active)] transition-all"
          >
            <DynamicIcon name="back" type="logo" className="w-6 h-6 object-contain text-theme-text-primary" />
          </button>
          <h2 className="text-2xl font-black text-theme-text-primary uppercase tracking-tighter leading-none">
            {room ? `Room: ${room.id}` : 'Multiplayer'}
          </h2>
        </div>
      )}

      {!room ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
           <div className="w-24 h-24 bg-theme-primary-sky-blue border-theme-base border-theme-border-main rounded-[2rem] shadow-theme-base flex items-center justify-center mb-6">
              <Users size={48} className="text-theme-text-primary" />
           </div>
           
           <h3 className="text-3xl font-black text-theme-text-primary mb-2 uppercase tracking-tighter">Bermain Bersama</h3>
           <p className="font-bold text-sm text-theme-text-secondary mb-10">Tantang teman secara real-time.</p>
           
           <div className="w-full max-w-sm flex flex-col gap-4">
              <KineticButton onClick={() => setShowCreateModal(true)} colorClass="bg-theme-primary-sunny-yellow" className="py-4 text-xl" disabled={isLoading}>
                 BUAT ROOM
              </KineticButton>
              <KineticButton onClick={() => setShowJoinModal(true)} colorClass="bg-theme-primary-coral-pink" className="py-4 text-xl" disabled={isLoading}>
                 GABUNG ROOM
              </KineticButton>
           </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-5 overflow-y-auto max-w-lg mx-auto w-full">
           {room.status === 'PLAYING' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                 <Swords size={64} className="text-theme-primary-coral-pink mb-6 animate-pulse" />
                 <h2 className="font-black text-3xl text-theme-text-primary uppercase mb-2">Game Berlangsung!</h2>
                 <p className="font-bold text-theme-text-secondary">Semoga beruntung!</p>
              </div>
           ) : (
             <>
               <div className="flex items-center justify-between mb-6 bg-theme-surface-card-white border-theme-base border-theme-border-main p-4 rounded-2xl shadow-theme-sm">
                  <div>
                    <h2 className="font-black text-xs text-theme-text-muted uppercase tracking-widest mb-1">KODE RUANGAN</h2>
                    <h1 className="font-black text-3xl text-theme-text-primary uppercase tracking-tighter leading-none">{room.id}</h1>
                  </div>
                  <button onClick={handleAttemptLeave} className="p-3 bg-theme-bg-soft-pink border-theme-base border-theme-border-main rounded-xl shadow-theme-sm active:translate-y-1 transition-all">
                     <LogOut size={20} className="text-theme-game-danger" />
                  </button>
               </div>

               <div className="flex items-center justify-between mb-4 px-2">
                  <h2 className="font-black text-sm text-theme-text-secondary uppercase tracking-tighter">
                     {room.mode}
                  </h2>
                  <KineticBadge text={`${room.players.length}/2 Pemain`} colorClass="bg-theme-surface-card-white" />
               </div>

               <div className="flex flex-col gap-3 mb-6">
                  <div className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-xl p-3 flex items-center gap-3 shadow-theme-sm">
                    <div className="w-12 h-12 shrink-0">
                      <ProfileComponent avatarStr={profile?.activeAvatarId} avatarBg={profile?.activeAvatarBackground} className="!w-full !h-full" />
                    </div>
                    <span className="font-black text-sm uppercase flex-1">{me?.name} (Kamu)</span>
                    <span className={`font-black text-[10px] uppercase tracking-widest ${me?.ready ? 'text-theme-primary-tropical-green' : 'text-theme-text-muted'}`}>{me?.ready ? 'Ready' : 'Menunggu'}</span>
                  </div>
                  
                  {opponent ? (
                     <div className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-xl p-3 flex items-center gap-3 shadow-theme-sm">
                       <div className="w-12 h-12 shrink-0">
                         {/* We don't have opponent avatar data yet in the multiplayer system, so fallback */}
                         <ProfileComponent avatarStr="avatar_male" avatarBg="#bde0fe" className="!w-full !h-full" />
                       </div>
                       <span className="font-black text-sm uppercase flex-1">{opponent.name}</span>
                       <span className={`font-black text-[10px] uppercase tracking-widest ${opponent.ready ? 'text-theme-primary-tropical-green' : 'text-theme-text-muted'}`}>{opponent.ready ? 'Ready' : 'Menunggu'}</span>
                     </div>
                  ) : (
                     <div className="bg-white/50 border-theme-sm border-dashed border-gray-400 rounded-xl p-3 flex justify-center items-center h-[76px]">
                       <span className="font-black text-[10px] text-theme-text-muted uppercase tracking-widest">Slot Kosong</span>
                     </div>
                  )}
               </div>

               <div className="flex flex-col gap-3 mt-auto">
                 {room.status === 'STARTING' ? (
                     <div className="text-center p-4">
                        <h3 className="font-black text-2xl text-theme-primary-coral-pink animate-pulse uppercase">Game Segera...</h3>
                     </div>
                 ) : (
                     <>
                        <KineticButton onClick={() => setReady(!me?.ready)} colorClass={me?.ready ? "bg-theme-game-danger" : "bg-theme-primary-tropical-green"} className="w-full py-4 text-xl" disabled={isLoading || (hasPendingWager && !isHost)}>
                           {me?.ready ? 'Batal Ready' : 'Ready'}
                        </KineticButton>
                        {isHost && room.players.length === 2 && room.players.every(p => p.ready) && (
                           <KineticButton onClick={handleStartMatch} colorClass="bg-theme-primary-coral-pink" className="w-full py-4 text-xl mt-2" disabled={hasPendingWager}>
                              Mulai Game
                           </KineticButton>
                        )}
                     </>
                 )}
               </div>
             </>
           )}
        </div>
      )}
      
      <AnimatePresence>
        {(room?.status === 'PLAYING' || room?.status === 'FINISHED') && room?.gameMode === 'onet' && (
           <motion.div 
             key="onet-gameplay" 
             initial={{ y: '100%', opacity: 0.5 }}
             animate={{ y: 0, opacity: 1 }}
             exit={{ y: '100%', opacity: 0 }}
             transition={{ type: 'spring', damping: 25, stiffness: 200 }}
             className="absolute inset-0 z-50"
           >
             <MultiplayerGameplay room={room} user={user} profile={profile} completeMatch={completeMatch} onAttemptLeave={handleAttemptLeave} />
           </motion.div>
        )}
        {(room?.status === 'PLAYING' || room?.status === 'FINISHED') && room?.gameMode === 'block-puzzle' && (
           <motion.div 
             key="block-puzzle-gameplay" 
             initial={{ y: '100%', opacity: 0.5 }}
             animate={{ y: 0, opacity: 1 }}
             exit={{ y: '100%', opacity: 0 }}
             transition={{ type: 'spring', damping: 25, stiffness: 200 }}
             className="absolute inset-0 z-50"
           >
             <MultiplayerBlockPuzzleGameplay room={room} user={user} profile={profile} reportLoss={reportLoss} reportTimeUp={reportTimeUp} onAttemptLeave={handleAttemptLeave} />
           </motion.div>
        )}
      </AnimatePresence>

      <KineticModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} colorClass="bg-theme-bg-soft-blue" widthClass="w-full max-w-sm" className="text-center">
        <div className="flex flex-col items-center">
           <div className="w-16 h-16 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[1.5rem] flex items-center justify-center shadow-theme-sm mb-4">
               <Users size={32} className="text-theme-text-primary" />
           </div>
           <h2 className="font-black text-2xl text-theme-text-primary uppercase tracking-tighter mb-2">Gabung Ruangan</h2>
           <p className="font-bold text-sm text-theme-text-secondary mb-6">Masukkan kode ruangan untuk bergabung bersama teman.</p>
           
           <div className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-xl p-4 shadow-[inset_2px_3px_0px_rgba(0,0,0,0.05)] mb-6 w-full">
              <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="KODE ROOM" className="w-full font-black text-2xl text-center text-theme-text-primary uppercase outline-none placeholder:text-gray-300 bg-transparent" />
           </div>
           
           <div className="flex flex-col gap-3 w-full">
               <KineticButton onClick={handleJoin} colorClass="bg-theme-primary-sky-blue" className="w-full py-4 text-xl" disabled={isLoading || !joinCode}>GABUNG</KineticButton>
               <KineticButton onClick={() => setShowJoinModal(false)} colorClass="bg-gray-200" className="w-full py-4 text-xl">BATAL</KineticButton>
           </div>
        </div>
      </KineticModal>

      <KineticModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        colorClass="bg-theme-bg-soft-blue"
        widthClass="w-full max-w-sm"
      >
        <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[1.5rem] flex items-center justify-center shadow-theme-sm mb-4">
                <Users size={32} className="text-theme-primary-sky-blue" />
            </div>
            <h2 className="font-black text-xl text-theme-text-primary uppercase mb-1">Buat Ruangan</h2>
            <p className="font-bold text-sm text-theme-text-secondary mb-6">Pilih mode permainan.</p>
            
            <div className="flex flex-col gap-3 w-full">
                <KineticButton 
                    onClick={() => handleCreate('onet')} 
                    colorClass="bg-theme-primary-sunny-yellow" 
                    className="w-full py-4 text-xl" 
                    disabled={isLoading}
                >
                    Main Onet
                </KineticButton>
                <KineticButton 
                    onClick={() => handleCreate('block-puzzle')} 
                    colorClass="bg-theme-primary-coral-pink" 
                    className="w-full py-4 text-xl" 
                    disabled={isLoading}
                >
                    Main Block Puzzle
                </KineticButton>
                <KineticButton 
                    onClick={() => setShowCreateModal(false)} 
                    colorClass="bg-gray-200" 
                    className="w-full py-4 text-xl"
                >
                    BATAL
                </KineticButton>
            </div>
        </div>
      </KineticModal>

      <KineticDialog
        isOpen={showLeaveWarning}
        onClose={() => setShowLeaveWarning(false)}
        icon={AlertTriangle}
        title="Keluar Permainan?"
        description="Kamu sedang dalam permainan aktif. Keluar sekarang akan dihitung sebagai kekalahan atau forfeit. Yakin ingin keluar?"
        primaryAction={{ label: 'Ya, Keluar', onClick: () => { setShowLeaveWarning(false); handleLeave(); }, colorClass: 'bg-theme-game-danger' }}
        secondaryAction={{ label: 'Batal', onClick: () => setShowLeaveWarning(false) }}
      />

      <KineticModal isOpen={showResultModal} onClose={() => { setShowResultModal(false); handleLeave(); }} colorClass="bg-theme-primary-sunny-yellow" widthClass="w-full max-w-sm" className="text-center pt-10 border-theme-lg border-theme-border-main">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-theme-surface-card-white border-theme-lg border-theme-border-main rounded-[2rem] flex items-center justify-center shadow-theme-base z-10 ">
           <Trophy size={48} className="text-yellow-500 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" />
        </div>
        
        {room?.winner === 'DRAW' ? (
            <>
               <h2 className="font-black text-3xl text-theme-text-primary uppercase tracking-tighter mt-4 mb-2">Seri!</h2>
               <p className="font-black text-theme-text-primary text-sm mb-6 uppercase tracking-widest">Waktu Habis</p>
            </>
        ) : room?.winner === user.name ? (
            <>
               <h2 className="font-black text-3xl text-theme-text-primary uppercase tracking-tighter mt-4 mb-2">Menang!</h2>
               <p className="font-black text-theme-text-primary text-sm mb-6 uppercase tracking-widest">Juara 1</p>
               {room?.finishReason === 'DISCONNECT' && (
                  <p className="text-xs font-bold text-theme-game-danger mt-[-10px] mb-4 px-2 py-1 bg-theme-game-danger/10 rounded-full">Lawan Menyerah/Keluar</p>
               )}
            </>
        ) : (
            <>
               <h2 className="font-black text-3xl text-theme-text-primary uppercase tracking-tighter mt-4 mb-2">Kalah!</h2>
               <p className="font-black text-theme-text-primary text-sm mb-6 uppercase tracking-widest">Tetap semangat!</p>
            </>
        )}
        
        <KineticButton onClick={() => { setShowResultModal(false); handleLeave(); }} colorClass="bg-theme-surface-card-white" className="w-full py-4 text-xl">Tutup</KineticButton>
      </KineticModal>
    </motion.div>
  );
};
