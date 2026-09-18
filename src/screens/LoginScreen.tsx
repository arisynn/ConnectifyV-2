import { DynamicIcon } from "../components/theme/DynamicIcon";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../GameContext';
import { CDEAuth } from '../core/cde/auth/CDEAuth';

export const LoginScreen = () => {
  const { navigate } = useGame();
  React.useEffect(() => {
    const loader = document.getElementById('static-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 300);
    }
  }, []);
  
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [stage, setStage] = useState<'nickname' | 'password'>('nickname');
  const [isNewAccount, setIsNewAccount] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanName = nickname.trim();
    if (!cleanName) {
      setError('Nickname tidak boleh kosong!');
      return;
    }
    if (cleanName.length < 3) {
      setError('Nickname minimal 3 karakter!');
      return;
    }

    if (stage === 'nickname') {
        setError('');
        setIsLoading(true);
        try {
            const exists = await CDEAuth.checkUsernameExists(cleanName);
            setIsNewAccount(!exists);
            setStage('password');
        } catch (err) {
            console.error('Check username failed:', err);
            setError('Gagal memeriksa nama pemain.');
        } finally {
            setIsLoading(false);
        }
        return;
    }
    
    if (!password) {
      setError('Kata sandi tidak boleh kosong!');
      return;
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter!');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      await CDEAuth.login(cleanName, password, isNewAccount);
      navigate('startup');
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Gagal masuk. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-theme-primary-sky-blue flex flex-col items-center justify-center p-6"
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #000 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className="w-full max-w-sm bg-theme-surface-card-white border-theme-lg border-theme-border-main rounded-[2rem] shadow-theme-lg p-8 relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-theme-primary-coral-pink rounded-full border-theme-base border-theme-border-main opacity-20" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-theme-primary-sunny-yellow rounded-full border-theme-base border-theme-border-main opacity-20" />
        
        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className="w-24 h-24 mb-4">
             <DynamicIcon name="connectify_logo" type="logo" className="w-full h-full object-contain drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)]" />
          </div>
          <h1 className="font-black text-theme-text-primary text-2xl uppercase tracking-widest text-center">Connectify</h1>
          <p className="font-bold text-theme-text-muted text-xs uppercase tracking-widest mt-1 text-center">
             {stage === 'nickname' 
                 ? 'Masuk untuk Bermain' 
                 : isNewAccount 
                    ? 'Halo pemain baru! Buat sandi untuk mengamankan akunmu.' 
                    : 'Selamat datang kembali! Masukkan sandimu.'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="relative z-10 flex flex-col gap-4">
          
          <AnimatePresence mode="wait">
              {stage === 'nickname' ? (
                  <motion.div key="nickname-stage" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-black text-theme-text-primary text-[10px] uppercase tracking-widest pl-1">Nickname</label>
                      <input 
                        type="text" 
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Masukkan namamu..."
                        disabled={isLoading}
                        className="w-full bg-gray-100 border-theme-base border-theme-border-main rounded-xl px-4 py-3 font-bold text-theme-text-primary placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-400 transition-colors shadow-[inset_2px_2px_0px_rgba(0,0,0,0.05)]"
                      />
                    </div>
                  </motion.div>
              ) : (
                  <motion.div key="password-stage" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center px-1">
                          <label className="font-black text-theme-text-primary text-[10px] uppercase tracking-widest">Kata Sandi</label>
                          <button 
                              type="button" 
                              onClick={() => { setStage('nickname'); setPassword(''); setError(''); }}
                              className="font-bold text-theme-primary-coral-pink hover:text-pink-600 text-[10px] uppercase"
                          >
                              GANTI NAMA
                          </button>
                      </div>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        disabled={isLoading}
                        className="w-full bg-gray-100 border-theme-base border-theme-border-main rounded-xl px-4 py-3 font-bold text-theme-text-primary placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-400 transition-colors shadow-[inset_2px_2px_0px_rgba(0,0,0,0.05)]"
                      />
                    </div>
                  </motion.div>
              )}
          </AnimatePresence>
          
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-theme-bg-soft-pink border-theme-sm border-red-500 rounded-lg px-3 py-2"
              >
                <span className="font-bold text-red-600 text-[10px] uppercase tracking-wider block text-center">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex flex-col gap-2 mt-2">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-theme-primary-tropical-green hover:bg-green-300 active:bg-green-500 border-theme-base border-theme-border-main rounded-xl py-3.5 font-black text-theme-text-primary uppercase tracking-widest shadow-theme-base hover:translate-y-[-2px] hover:shadow-theme-lg active:translate-y-[2px] active:shadow-theme-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-theme-base border-theme-border-main border-t-transparent rounded-full"
                  />
                ) : (
                  stage === 'nickname' ? 'LANJUT' : isNewAccount ? 'BUAT AKUN' : 'MASUK'
                )}
              </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
