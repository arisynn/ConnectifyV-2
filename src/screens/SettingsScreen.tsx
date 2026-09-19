import React from 'react';
import { useGame } from '../GameContext';
import { ArrowLeft, Volume2, VolumeX, Music, LogOut, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { KineticButton } from '../designs/KineticComponents';
import { KineticDialog } from '../designs/KineticPopups';
import { useAudio } from '../core/audio/AudioEngine';
import { useProfile } from '../core/profile/ProfileContext';
import { CDEAuth } from '../core/cde/auth/CDEAuth';
import { CDE } from '../core/cde/CDE';
import { useCDE } from '../core/cde';
import { AccountDataPopup } from './AccountDataPopup';
import { Smartphone, Cloud } from 'lucide-react';
import { DynamicIcon } from '../components/theme/DynamicIcon';


export const SettingsScreen = () => {
  const { navigate, resetProgress } = useGame();
  const { settings, updateSettings } = useAudio();
  const { profile, clearProfile, updateProfile } = useProfile();
  const cde = useCDE();

  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
  const [showResetDialog, setShowResetDialog] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [showDataPopup, setShowDataPopup] = React.useState(false);

  const [isGeneratingCode, setIsGeneratingCode] = React.useState(false);
  const [recoveryCode, setRecoveryCode] = React.useState('');
  
  const executeReset = async () => {
       const playerName = CDEAuth.getLoggedInUser();
       if (playerName) {
          localStorage.removeItem(`SC_BACKUP_${playerName}`);
          localStorage.removeItem(`sweet_connect_${playerName}`);
       }
       localStorage.removeItem('sweetConnectSave');
       localStorage.removeItem('sweetConnectAudioSettings');
       if (CDE.getState().initialized) {
          await CDE.logout(); // Will clear state
          // Could also clear indexedDB here
       }
       window.location.reload();
  };

  const handleReset = () => {
      setShowResetDialog(true);
  };

  const executeLogout = async () => {
       if (isLoggingOut) return;
       setIsLoggingOut(true);
       try {
           await CDEAuth.logout();
           clearProfile();
           navigate('login');
       } catch (error) {
           console.error("Logout failed:", error);
           navigate('login');
       }
  };

  const handleLogout = () => {
      setShowLogoutDialog(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute inset-0 bg-blue-50 z-[100] flex flex-col font-sans"
    >
      <div className="flex items-center gap-4 px-5 py-4 z-10 shrink-0 bg-theme-primary-sky-blue border-b-theme-base border-theme-border-main shadow-theme-base">
        <button 
           onClick={() => navigate('home')} 
           className="p-3 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[1.5rem] shadow-theme-base active:translate-y-1 active:translate-x-0.5 active:shadow-[var(--geometry-shadow-active)] transition-all"
        >
          <DynamicIcon name="back" type="logo" LucideFallback={ArrowLeft} className="w-6 h-6 object-contain text-theme-text-primary" />
        </button>
        <h2 className="text-2xl font-black text-theme-text-primary uppercase tracking-tighter leading-none">Pengaturan</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 pt-8 pb-12">
        <section className="game-panel flex items-center justify-between gap-3">
          <div data-testid="dark-mode-label"><h3 className="font-black text-theme-text-primary">Mode gelap</h3><p className="text-xs text-theme-text-muted">Warna nyaman, tampilan tetap familiar.</p></div>
          <button data-testid="dark-mode-toggle" role="switch" aria-checked={!!profile.darkMode} aria-label="Mode gelap" onClick={()=>updateProfile({darkMode:!profile.darkMode})} className="game-action bg-theme-primary-sky-blue text-xs">{profile.darkMode?'Aktif':'Nonaktif'}</button>
        </section>
        <button data-testid="settings-wallet" onClick={()=>navigate('wallet')} className="game-action bg-theme-primary-sunny-yellow">Dompet & riwayat permen</button>
        
        {/* Audio Settings */}
        <section>
          <h3 className="font-black text-lg text-theme-text-primary uppercase tracking-widest mb-3 pl-1">Audio</h3>
          <div className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[2rem] p-5 shadow-theme-lg flex flex-col gap-4">
             
             {/* SFX Toggle */}
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-theme-bg-soft-pink rounded-xl flex items-center justify-center border-theme-sm border-theme-border-main">
                     {settings.muteSfx ? <VolumeX size={20} className="text-theme-text-muted" /> : <Volume2 size={20} className="text-pink-600" />}
                   </div>
                   <span className="font-bold text-theme-text-primary">Efek Suara (SFX)</span>
                </div>
                <button 
                  onClick={() => updateSettings({ muteSfx: !settings.muteSfx })}
                  className={`w-14 h-8 rounded-full border-theme-base border-theme-border-main relative transition-colors ${!settings.muteSfx ? 'bg-theme-primary-tropical-green' : 'bg-theme-divider-main'}`}
                >
                  <motion.div 
                    layout
                    className="w-5 h-5 bg-theme-surface-card-white border-theme-sm border-theme-border-main rounded-full absolute top-0.5"
                    style={{ left: !settings.muteSfx ? 'calc(100% - 1.5rem)' : '0.25rem' }}
                  />
                </button>
             </div>

             <div className="h-0.5 w-full bg-theme-surface-card-soft rounded-full my-1" />

             {/* Music Toggle */}
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-theme-bg-soft-blue rounded-xl flex items-center justify-center border-theme-sm border-theme-border-main">
                     {settings.muteMusic ? <VolumeX size={20} className="text-theme-text-muted" /> : <Music size={20} className="text-blue-600" />}
                   </div>
                   <span className="font-bold text-theme-text-primary">Musik Latar (BGM)</span>
                </div>
                <button 
                  onClick={() => updateSettings({ muteMusic: !settings.muteMusic })}
                  className={`w-14 h-8 rounded-full border-theme-base border-theme-border-main relative transition-colors ${!settings.muteMusic ? 'bg-theme-primary-tropical-green' : 'bg-theme-divider-main'}`}
                >
                  <motion.div 
                    layout
                    className="w-5 h-5 bg-theme-surface-card-white border-theme-sm border-theme-border-main rounded-full absolute top-0.5"
                    style={{ left: !settings.muteMusic ? 'calc(100% - 1.5rem)' : '0.25rem' }}
                  />
                </button>
             </div>
          </div>
        </section>

        {/* Account Settings */}
        <section>
          <h3 className="font-black text-lg text-theme-text-primary uppercase tracking-widest mb-3 pl-1">Akun & Data</h3>
          <KineticButton
             onClick={() => setShowDataPopup(true)}
             colorClass="bg-theme-surface-card-white"
             className="w-full text-left p-0 !border-theme-neutral-900 !rounded-[2rem] overflow-hidden block"
          >
             <div className="p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-theme-bg-soft-pink border-theme-sm border-theme-border-main rounded-xl flex items-center justify-center shrink-0">
                     <Smartphone size={24} className="text-theme-text-primary" />
                   </div>
                   <div className="flex flex-col min-w-0">
                     <span className="font-bold text-theme-text-muted text-xs uppercase tracking-widest">ID Pemain</span>
                     <span className="font-black text-theme-text-primary text-lg truncate">PLAYER-{profile.id || Math.floor(Math.random() * 1000000)}</span>
                   </div>
                </div>
                <div className="h-0.5 w-full bg-theme-neutral-100 rounded-full my-1" />
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <Cloud size={16} className={navigator.onLine ? "text-theme-primary-tropical-green" : "text-theme-game-danger"} />
                      <span className="font-bold text-theme-text-secondary text-sm">Status:</span>
                   </div>
                   <span className={`font-black text-sm ${navigator.onLine ? 'text-theme-primary-tropical-green' : 'text-theme-game-danger'}`}>
                      {navigator.onLine ? 'Cloud Tersambung' : 'Offline'}
                   </span>
                </div>
             </div>
          </KineticButton>
          
          <div className="flex flex-col gap-3 mt-4">
             <KineticButton
                onClick={handleLogout}
                colorClass="bg-theme-surface-card-soft"
                className="w-full py-3 flex items-center justify-center gap-2 !border-theme-neutral-900 text-theme-text-primary"
             >
                <LogOut size={18} />
                <span className="font-black text-sm uppercase">Keluar dari Akun</span>
             </KineticButton>
             <KineticButton
                onClick={handleReset}
                colorClass="bg-theme-bg-soft-pink"
                className="w-full py-3 flex items-center justify-center gap-2 !border-red-900 text-theme-game-danger"
             >
                <Trash2 size={18} />
                <span className="font-black text-sm uppercase">Reset Data Permainan</span>
             </KineticButton>
          </div>
        </section>
        


        <div className="text-center mt-4">
           <p className="font-bold text-xs text-theme-text-muted">Connectify v1.0.0</p>
        </div>

      </div>

      <KineticDialog 
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        title="Keluar dari Akun?"
        description="Data permainanmu sudah tersimpan dan kamu bisa masuk kembali nanti."
        primaryAction={{ label: 'Keluar', onClick: executeLogout, colorClass: 'bg-theme-game-danger' }}
        secondaryAction={{ label: 'Batal', onClick: () => setShowLogoutDialog(false) }}
      />
      
      <KineticDialog 
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        title="Reset Data?"
        description="Apakah kamu yakin ingin mereset semua data di perangkat ini? Data cloud masih dipertahankan."
        primaryAction={{ label: 'Reset', onClick: executeReset, colorClass: 'bg-theme-game-danger' }}
        secondaryAction={{ label: 'Batal', onClick: () => setShowResetDialog(false) }}
      />
      <AccountDataPopup 
        isOpen={showDataPopup}
        onClose={() => setShowDataPopup(false)}
        onLogout={handleLogout}
        onReset={handleReset}
        profileId={profile.id || Math.floor(Math.random() * 1000000).toString()}
      />
    </motion.div>

  );
};
