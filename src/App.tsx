import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Settings, Info, Camera, ShieldCheck, X, Sparkles, Music, Volume2, MousePointer2, Sun, ArrowLeft, Sliders } from 'lucide-react';
import { GameState } from './types';
import { getAsset, setAsset, removeAsset } from './lib/db';

export default function App() {
  const [state, setState] = useState<GameState>({
    status: 'menu',
    background: 'https://picsum.photos/seed/sosis-elegant/1080/1920',
    isDevMode: localStorage.getItem('sosis_love_dev') === 'true',
    musicVolume: 0.7,
    rainVolume: 0.5,
    brightness: 0.6,
  });

  const [aboutClicks, setAboutClicks] = useState(0);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [tempCode, setTempCode] = useState('');
  const [showDevModal, setShowDevModal] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<'bg' | 'video' | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const soundtrackInputRef = useRef<HTMLInputElement>(null);
  const gameSoundtrackInputRef = useRef<HTMLInputElement>(null);
  const rainSoundInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const soundtrackAudioRef = useRef<HTMLAudioElement>(null);
  const gameSoundtrackAudioRef = useRef<HTMLAudioElement>(null);
  const rainSoundAudioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load assets from IndexedDB on mount
  useEffect(() => {
    const loadAssets = async () => {
      const savedBg = await getAsset('sosis_love_bg');
      const savedVideo = await getAsset('sosis_love_video');
      const savedSoundtrack = await getAsset('sosis_love_soundtrack');
      const savedGameSoundtrack = await getAsset('sosis_love_game_soundtrack');
      const savedRainSound = await getAsset('sosis_love_rain_sound');
      
      setState(prev => ({
        ...prev,
        background: savedBg || prev.background,
        videoOverlay: savedVideo || undefined,
        soundtrack: savedSoundtrack || undefined,
        gameSoundtrack: savedGameSoundtrack || undefined,
        rainSound: savedRainSound || undefined
      }));
    };
    loadAssets();
  }, []);

  useEffect(() => {
    if (state.videoOverlay && videoRef.current) {
      videoRef.current.play().catch(err => console.log("Video play failed:", err));
    }
  }, [state.videoOverlay]);

  useEffect(() => {
    const fadeIn = (audio: HTMLAudioElement, duration: number, targetVolume: number = 1) => {
      audio.volume = 0;
      audio.play().catch(err => console.log("Audio play failed:", err));
      
      const intervalTime = 50; 
      const steps = duration / intervalTime;
      const stepValue = targetVolume / steps;
      
      const interval = setInterval(() => {
        if (audio.volume < targetVolume) {
          audio.volume = Math.min(targetVolume, audio.volume + stepValue);
        } else {
          clearInterval(interval);
        }
      }, intervalTime);
      
      return interval;
    };

    const fadeOut = (audio: HTMLAudioElement, duration: number) => {
      const intervalTime = 50;
      const steps = duration / intervalTime;
      const stepValue = audio.volume / steps;

      const interval = setInterval(() => {
        if (audio.volume > 0) {
          audio.volume = Math.max(0, audio.volume - stepValue);
        } else {
          audio.pause();
          clearInterval(interval);
        }
      }, intervalTime);

      return interval;
    };

    if (!userInteracted) return;

    let rainInterval: NodeJS.Timeout | undefined;
    let menuMusicInterval: NodeJS.Timeout | undefined;
    let gameMusicInterval: NodeJS.Timeout | undefined;
    let menuMusicFadeOut: NodeJS.Timeout | undefined;
    let gameMusicFadeOut: NodeJS.Timeout | undefined;

    // Handle Rain Sound (Plays in all states if exists)
    if (state.rainSound && rainSoundAudioRef.current) {
      if (rainSoundAudioRef.current.paused) {
        rainInterval = fadeIn(rainSoundAudioRef.current, 3000, state.rainVolume);
      } else {
        rainSoundAudioRef.current.volume = state.rainVolume;
      }
    }

    // Handle Music Transitions
    const isMenuOrSettings = state.status === 'menu' || state.status === 'settings';
    const isPlaying = state.status === 'playing';

    if (isMenuOrSettings) {
      // Fade in Menu Music
      if (state.soundtrack && soundtrackAudioRef.current) {
        if (soundtrackAudioRef.current.paused) {
          menuMusicInterval = fadeIn(soundtrackAudioRef.current, 4000, state.musicVolume);
        } else {
          soundtrackAudioRef.current.volume = state.musicVolume;
        }
      }
      // Fade out Game Music if it was playing
      if (gameSoundtrackAudioRef.current && !gameSoundtrackAudioRef.current.paused) {
        gameMusicFadeOut = fadeOut(gameSoundtrackAudioRef.current, 2000);
      }
    } else if (isPlaying) {
      // Fade in Game Music
      if (state.gameSoundtrack && gameSoundtrackAudioRef.current) {
        if (gameSoundtrackAudioRef.current.paused) {
          gameMusicInterval = fadeIn(gameSoundtrackAudioRef.current, 4000, state.musicVolume);
        } else {
          gameSoundtrackAudioRef.current.volume = state.musicVolume;
        }
      }
      // Fade out Menu Music
      if (soundtrackAudioRef.current && !soundtrackAudioRef.current.paused) {
        menuMusicFadeOut = fadeOut(soundtrackAudioRef.current, 2000);
      }
    }

    return () => {
      if (rainInterval) clearInterval(rainInterval);
      if (menuMusicInterval) clearInterval(menuMusicInterval);
      if (gameMusicInterval) clearInterval(gameMusicInterval);
      if (menuMusicFadeOut) clearInterval(menuMusicFadeOut);
      if (gameMusicFadeOut) clearInterval(gameMusicFadeOut);
    };
  }, [state.status, state.rainSound, state.soundtrack, state.gameSoundtrack, userInteracted, state.musicVolume, state.rainVolume]);

  const handleAboutClick = () => {
    const newCount = aboutClicks + 1;
    setAboutClicks(newCount);
    if (newCount === 3) {
      setShowCodeInput(true);
      setAboutClicks(0);
    } else {
      setState(prev => ({ ...prev, status: 'about' }));
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempCode === 'adenpink') {
      setState(prev => ({ ...prev, isDevMode: true }));
      localStorage.setItem('sosis_love_dev', 'true');
      setShowDevModal(true);
      setShowCodeInput(false);
      setTempCode('');
    } else {
      setShowCodeInput(false);
      setTempCode('');
    }
  };

  const SettingSlider = ({ label, icon, value, onChange, min = 0, max = 1, step = 0.1 }: any) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/60">
          {icon}
          <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
        </div>
        <span className="text-[10px] font-mono text-orange-500">{Math.round(value * 100)}%</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
      />
    </div>
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setState(prev => ({ ...prev, background: base64String }));
        try {
          await setAsset('sosis_love_bg', base64String);
          setUploadSuccess('bg');
        } catch (err) {
          console.error("Gagal menyimpan background:", err);
          alert("Gagal menyimpan background. Memori penuh?");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // IndexedDB can handle much larger files than localStorage (usually 50MB+ is fine)
      if (file.size > 50 * 1024 * 1024) {
        alert("Video terlalu besar! Maksimal 50MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setState(prev => ({ ...prev, videoOverlay: base64String }));
        try {
          await setAsset('sosis_love_video', base64String);
          setUploadSuccess('video');
        } catch (err) {
          console.error("Gagal menyimpan video:", err);
          alert("Gagal menyimpan video. Memori browser mungkin penuh.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSoundtrackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Audio terlalu besar! Maksimal 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setState(prev => ({ ...prev, soundtrack: base64String }));
        try {
          await setAsset('sosis_love_soundtrack', base64String);
          setUploadSuccess('bg'); 
        } catch (err) {
          console.error("Gagal menyimpan soundtrack:", err);
          alert("Gagal menyimpan soundtrack.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGameSoundtrackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Audio terlalu besar! Maksimal 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setState(prev => ({ ...prev, gameSoundtrack: base64String }));
        try {
          await setAsset('sosis_love_game_soundtrack', base64String);
          setUploadSuccess('bg'); 
        } catch (err) {
          console.error("Gagal menyimpan game soundtrack:", err);
          alert("Gagal menyimpan game soundtrack.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRainSoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Audio terlalu besar! Maksimal 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setState(prev => ({ ...prev, rainSound: base64String }));
        try {
          await setAsset('sosis_love_rain_sound', base64String);
          setUploadSuccess('video'); // Reusing video success for now
        } catch (err) {
          console.error("Gagal menyimpan rain sound:", err);
          alert("Gagal menyimpan rain sound.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const MenuButton = ({ icon, label, primary = false, onClick }: { icon: React.ReactNode, label: string, primary?: boolean, onClick?: () => void }) => (
    <motion.button
      whileHover={{ scale: 1.05, x: 10 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={() => {
        onClick?.();
      }}
      className={`
        w-full flex items-center gap-4 px-6 py-3 rounded-xl border-2 transition-all shadow-lg
        ${primary 
          ? 'bg-[#f8d7b0] border-[#431f12] text-[#431f12] font-bold' 
          : 'bg-[#f8d7b0]/80 border-[#431f12]/40 text-[#431f12] font-medium'}
      `}
    >
      <span className="opacity-70">{icon}</span>
      <span className="text-xs uppercase tracking-widest font-display font-bold">{label}</span>
    </motion.button>
  );

  return (
    <>
      <div 
        onClick={() => !userInteracted && setUserInteracted(true)}
        className="relative w-full h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden select-none"
      >
      {/* Splash Screen / Initial Interaction */}
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0 z-[100] bg-[#0a0a0a] flex flex-col items-center justify-center cursor-pointer"
            onClick={() => {
              setUserInteracted(true);
              setShowSplash(false);
            }}
          >
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-rain pointer-events-none" />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="flex flex-col items-center gap-8 relative z-10"
            >
              <div className="flex flex-col items-center text-center">
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-[10px] tracking-[0.5em] uppercase text-white/60 mb-4 font-bold"
                >
                  Made with
                </motion.p>
                <motion.h1 
                  className="text-xl md:text-3xl font-display font-black tracking-[0.4em] uppercase text-white mb-2"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  RIFKY ADEN STUDIO
                </motion.h1>
                <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="mt-8 flex flex-col items-center gap-6"
              >
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserInteracted(true);
                    setShowSplash(false);
                  }}
                  className="px-12 py-3 rounded-full border border-white/20 bg-white/5 flex items-center justify-center gap-3 group transition-all"
                >
                  <span className="text-[10px] uppercase tracking-[0.6em] font-bold text-white/80 group-hover:text-white">Next</span>
                  <Play size={12} fill="white" className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                </motion.button>
                <p className="text-[7px] uppercase tracking-[0.3em] text-white/20 animate-pulse">Click to Enter Experience</p>
              </motion.div>
            </motion.div>

            {/* Decorative corners */}
            <div className="absolute top-12 left-12 w-8 h-8 border-t border-l border-white/10" />
            <div className="absolute top-12 right-12 w-8 h-8 border-t border-r border-white/10" />
            <div className="absolute bottom-12 left-12 w-8 h-8 border-b border-l border-white/10" />
            <div className="absolute bottom-12 right-12 w-8 h-8 border-b border-r border-white/10" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background with Overlay */}
      <div className="absolute inset-0 z-0">
        <motion.img
          key={state.background}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ 
            opacity: [state.brightness - 0.1, state.brightness, state.brightness - 0.1],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          src={state.background}
          alt="bg"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {/* Rain Overlay Effect */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-rain" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/60" />
        </div>
        {state.videoOverlay && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen pointer-events-none z-[1]"
            src={state.videoOverlay}
          />
        )}
      </div>

      {/* Hidden Audio Elements */}
      {state.soundtrack && (
        <audio 
          ref={soundtrackAudioRef} 
          src={state.soundtrack} 
          loop 
          className="hidden" 
        />
      )}
      {state.gameSoundtrack && (
        <audio 
          ref={gameSoundtrackAudioRef} 
          src={state.gameSoundtrack} 
          loop 
          className="hidden" 
        />
      )}
      {state.rainSound && (
        <audio 
          ref={rainSoundAudioRef} 
          src={state.rainSound} 
          loop 
          className="hidden" 
        />
      )}

      {/* Main UI Container */}
      <div className="relative z-10 h-full flex flex-col items-center justify-between pt-[6vh] pb-16 px-8">
        
        {state.status === 'menu' ? (
          <>
            {/* Top Section: Elegant Title */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight uppercase text-white/95 mb-2 whitespace-nowrap">
                Sosis <span className="text-orange-500">Love</span>
              </h1>
              <p className="text-xl md:text-2xl font-handwriting text-white/90 tracking-wide">
                Dari Gerobak ke Pelaminan
              </p>
              {state.isDevMode && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-4 flex items-center justify-center gap-1 text-orange-400 text-[10px] font-mono uppercase tracking-widest"
                >
                  <ShieldCheck size={12} /> Dev Mode Active
                </motion.div>
              )}
            </motion.div>

            {/* Middle Section: Spacer */}
            <div className="flex-1" />

            {/* Bottom Section: Controls */}
            <div className="w-full max-w-[280px] space-y-3">
              <motion.button
                onClick={() => {
                  setState(prev => ({ ...prev, status: 'playing' }));
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="w-full py-3.5 bg-white text-black rounded-full font-medium tracking-widest uppercase text-xs flex items-center justify-center gap-3 shadow-xl"
              >
                <Play size={16} fill="black" /> Mulai
              </motion.button>

              <motion.button
                onClick={() => {
                  setState(prev => ({ ...prev, status: 'settings' }));
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={`w-full py-3 bg-white/5 border rounded-full text-[10px] tracking-widest uppercase transition-colors flex items-center justify-center gap-2 ${state.isDevMode ? 'border-orange-500/50 text-orange-400 hover:bg-orange-500/10' : 'border-white/10 text-white hover:bg-white/10'}`}
              >
                <Settings size={14} className={state.isDevMode ? 'animate-spin-slow' : ''} /> {state.isDevMode ? 'Dev Console' : 'Pengaturan'}
              </motion.button>

              {state.isDevMode && (
                <div className="grid grid-cols-2 gap-2 w-full">
                  <motion.button
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="py-3 bg-orange-600/20 border border-orange-500/30 rounded-full text-[9px] tracking-widest uppercase text-orange-400 hover:bg-orange-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Camera size={12} /> Upload BG
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      videoInputRef.current?.click();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="py-3 bg-orange-600/20 border border-orange-500/30 rounded-full text-[9px] tracking-widest uppercase text-orange-400 hover:bg-orange-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={12} /> Upload Overlay
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      soundtrackInputRef.current?.click();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="py-3 bg-orange-600/20 border border-orange-500/30 rounded-full text-[9px] tracking-widest uppercase text-orange-400 hover:bg-orange-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Music size={12} /> Menu Music
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      gameSoundtrackInputRef.current?.click();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="py-3 bg-orange-600/20 border border-orange-500/30 rounded-full text-[9px] tracking-widest uppercase text-orange-400 hover:bg-orange-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Music size={12} /> Game Music
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      rainSoundInputRef.current?.click();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="py-3 bg-orange-600/20 border border-orange-500/30 rounded-full text-[9px] tracking-widest uppercase text-orange-400 hover:bg-orange-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Volume2 size={12} /> Rain Sound
                  </motion.button>
                </div>
              )}

              <motion.button
                onClick={handleAboutClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-full text-[10px] tracking-widest uppercase hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <Info size={14} /> Tentang
              </motion.button>

              <motion.button
                onClick={() => {
                  setState(prev => ({ ...prev, status: 'splash' }));
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-full text-[10px] tracking-widest uppercase hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <X size={14} /> Keluar
              </motion.button>
            </div>
          </>
        ) : state.status === 'settings' ? (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md h-full flex flex-col"
          >
            <div className="flex items-center justify-between mb-12">
              <motion.button
                onClick={() => {
                  setState(prev => ({ ...prev, status: 'menu' }));
                }}
                whileHover={{ x: -5 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="p-2 bg-white/5 rounded-full text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </motion.button>
              <h2 className="text-xl font-display font-bold uppercase tracking-[0.3em]">Pengaturan</h2>
              <div className="w-10" />
            </div>

            <div className="flex-1 space-y-10 overflow-y-auto pr-2 custom-scrollbar">
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-orange-500 mb-2">
                  <Volume2 size={16} />
                  <h3 className="text-[11px] uppercase tracking-widest font-black">Audio & Sound</h3>
                </div>
                
                <SettingSlider 
                  label="Music Volume" 
                  icon={<Music size={14} />} 
                  value={state.musicVolume} 
                  onChange={(v: number) => setState(prev => ({ ...prev, musicVolume: v }))} 
                />
                
                <SettingSlider 
                  label="Rain Effect" 
                  icon={<Sparkles size={14} />} 
                  value={state.rainVolume} 
                  onChange={(v: number) => setState(prev => ({ ...prev, rainVolume: v }))} 
                />
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-2 text-orange-500 mb-2">
                  <Sun size={16} />
                  <h3 className="text-[11px] uppercase tracking-widest font-black">Visuals</h3>
                </div>
                
                <SettingSlider 
                  label="Background Brightness" 
                  icon={<Sun size={14} />} 
                  value={state.brightness} 
                  onChange={(v: number) => setState(prev => ({ ...prev, brightness: v }))} 
                />
              </section>

              {state.isDevMode && (
                <section className="space-y-4 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 text-orange-500 mb-2">
                    <ShieldCheck size={16} />
                    <h3 className="text-[11px] uppercase tracking-widest font-black">Developer Tools</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setShowDevModal(true);
                    }}
                    className="w-full py-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-[10px] text-orange-400 uppercase tracking-widest font-bold hover:bg-orange-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Sliders size={14} /> Open Dev Console
                  </button>
                </section>
              )}
            </div>

            <div className="pt-8 text-center">
              <p className="text-[8px] uppercase tracking-[0.4em] text-white/20">Aden Pink Studio v1.0.0</p>
            </div>
          </motion.div>
        ) : state.status === 'about' ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md h-full flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <motion.button
                onClick={() => {
                  setState(prev => ({ ...prev, status: 'menu' }));
                }}
                whileHover={{ x: -5 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="p-2 bg-white/5 rounded-full text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </motion.button>
              <h2 className="text-xl font-display font-bold uppercase tracking-[0.3em]">Tentang</h2>
              <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-10 pb-10">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-display font-bold tracking-tighter uppercase text-white">SOSIS LOVE</h1>
                <p className="text-sm font-handwriting text-orange-500 italic">Dari Gerobak ke Pelaminan</p>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Versi 1.1</p>
              </div>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <section className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-500 text-center">SINOPSIS</h3>
                <div className="text-xs text-white/70 leading-relaxed text-center space-y-4 font-light italic">
                  <p>Ada cinta yang tidak dirajut oleh sutra kemewahan, melainkan dari kepul asap gerobak dan peluh di bawah purnama.</p>
                  <p>Yoyo Sutaryo, seorang penempa harapan di atas bara api, hanya memiliki satu mimpi purba: mengantar puan pujaannya menuju gerbang pelaminan.</p>
                  <p>Namun takdir tak pernah berpihak pada yang bersahaja. Detik waktu menjelma menjadi pisau yang mengikis keyakinan.</p>
                  <p>Ini bukanlah hikayat tentang kemenangan agung. Ini adalah cerita tentang sosok yang berani merayu takdir, meski pada akhirnya, hanya kehampaan yang menjawab.</p>
                  <p>Bagaimana kisah cinta Yoyo? Temukan jawabannya.</p>
                </div>
              </section>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <section className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-500 text-center">SOUNDTRACK</h3>
                <div className="text-center space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-white">🎵 Pelabuhan Terakhir</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">by Rifky Aden</p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-full">
                    <div className="w-4 h-4 bg-[#1DB954] rounded-full flex items-center justify-center">
                      <Music size={10} className="text-black" />
                    </div>
                    <span className="text-[9px] font-bold text-[#1DB954] uppercase tracking-widest">Dengarkan di Spotify</span>
                  </div>
                  <p className="text-[10px] text-white/60">Rifky Aden</p>
                </div>
              </section>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <section className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-500 text-center">KREDIT</h3>
                <div className="text-center">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Developer & Cerita</p>
                  <p className="text-xs font-medium text-white">Rifky Aden</p>
                </div>
              </section>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <section className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-500 text-center">IKUTI SAYA</h3>
                <div className="text-center">
                  <p className="text-xs text-white/80">Instagram : <span className="text-orange-400">@ripcobainn__</span></p>
                </div>
              </section>

              <div className="pt-8 text-center space-y-1">
                <p className="text-[9px] text-white/30 uppercase tracking-widest">© 2026 Rifky Aden Studio</p>
                <p className="text-[9px] text-white/20 uppercase tracking-widest">Semua hak dilindungi.</p>
              </div>
            </div>
          </motion.div>
        ) : state.status === 'playing' ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col items-center justify-center text-center"
          >
            <Sparkles className="text-orange-500 mb-6 animate-pulse" size={48} />
            <h2 className="text-3xl font-display font-bold uppercase tracking-widest mb-4">Cerita Dimulai</h2>
            <p className="text-white/60 font-handwriting text-xl mb-12">Segera hadir...</p>
            <motion.button
              onClick={() => {
                setState(prev => ({ ...prev, status: 'menu' }));
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="px-8 py-3 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest"
            >
              Kembali ke Menu
            </motion.button>
          </motion.div>
        ) : null}

          <input 
            type="file" 
            ref={videoInputRef} 
            onChange={handleVideoUpload} 
            className="hidden" 
            accept="video/*"
          />
          <input 
            type="file" 
            ref={soundtrackInputRef} 
            onChange={handleSoundtrackUpload} 
            className="hidden" 
            accept="audio/*"
          />
          <input 
            type="file" 
            ref={gameSoundtrackInputRef} 
            onChange={handleGameSoundtrackUpload} 
            className="hidden" 
            accept="audio/*"
          />
          <input 
            type="file" 
            ref={rainSoundInputRef} 
            onChange={handleRainSoundUpload} 
            className="hidden" 
            accept="audio/*"
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-[7px] text-white/10 font-mono tracking-[0.5em] uppercase">
          © 2026 RIFKY ADEN STUDIO
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
        accept="image/*"
      />

      <AnimatePresence>
        {uploadSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[70] w-[240px]"
          >
            <div className="bg-[#1a1a1a] border border-orange-500/50 p-4 rounded-2xl shadow-2xl text-center">
              <div className="flex items-center justify-center gap-2 text-orange-400 mb-3">
                <Sparkles size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {uploadSuccess === 'bg' ? 'Background' : 'Overlay'} Berhasil!
                </span>
              </div>
              <button 
                onClick={() => {
                  setUploadSuccess(null);
                }}
                className="w-full py-2 bg-orange-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-orange-500 transition-colors"
              >
                OK
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Code Input Modal (Secret) */}
      <AnimatePresence>
        {showCodeInput && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.form 
              onSubmit={handleCodeSubmit}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/10 w-full max-w-[240px] text-center"
            >
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-4">Enter Access Key</h3>
              <input 
                autoFocus
                type="password"
                value={tempCode}
                onChange={(e) => setTempCode(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-center text-sm tracking-widest focus:outline-none focus:border-orange-500/50 transition-colors mb-4"
              />
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    setShowCodeInput(false);
                  }}
                  className="flex-1 py-2 text-[9px] uppercase tracking-widest text-white/30 hover:text-white/60"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-orange-600 rounded-lg text-[9px] uppercase tracking-widest font-bold"
                >
                  Verify
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Developer Secret Modal */}
      <AnimatePresence>
        {showDevModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#1a1a1a] border border-orange-500/30 p-8 rounded-3xl max-w-sm w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-orange-500" />
              <button 
                onClick={() => setShowDevModal(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <ShieldCheck className="text-orange-500" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Developer Console</h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Access Granted: adenpink</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-xs text-white/60 mb-2 uppercase tracking-widest">Stats Debug</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="text-orange-400">FPS: 60.0</div>
                    <div className="text-orange-400">MEM: 24.5MB</div>
                    <div className="text-orange-400">SCENE: MENU_ROOT</div>
                    <div className="text-orange-400">VER: 1.0.0-DEV</div>
                  </div>
                </div>
                
                <button className="w-full py-3 bg-orange-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-orange-500 transition-colors">
                  Unlock All Scenes
                </button>
                <button 
                  onClick={() => {
                    setState(prev => ({ ...prev, isDevMode: false }));
                    localStorage.removeItem('sosis_love_dev');
                    setShowDevModal(false);
                  }}
                  className="w-full py-3 bg-red-600/10 text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-600/20 transition-colors"
                >
                  Logout Dev Mode
                </button>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] mb-3">Quick Actions</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      {state.videoOverlay && (
                        <button 
                          onClick={async () => {
                            setState(prev => ({ ...prev, videoOverlay: undefined }));
                            await removeAsset('sosis_love_video');
                          }}
                          className="flex-1 py-3 bg-red-600/20 text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-600/30 transition-colors"
                        >
                          Clear Video
                        </button>
                      )}
                      {state.soundtrack && (
                        <button 
                          onClick={async () => {
                            setState(prev => ({ ...prev, soundtrack: undefined }));
                            await removeAsset('sosis_love_soundtrack');
                          }}
                          className="flex-1 py-3 bg-red-600/20 text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-600/30 transition-colors"
                        >
                          Clear Menu Music
                        </button>
                      )}
                      {state.gameSoundtrack && (
                        <button 
                          onClick={async () => {
                            setState(prev => ({ ...prev, gameSoundtrack: undefined }));
                            await removeAsset('sosis_love_game_soundtrack');
                          }}
                          className="flex-1 py-3 bg-red-600/20 text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-600/30 transition-colors"
                        >
                          Clear Game Music
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {state.rainSound && (
                        <button 
                          onClick={async () => {
                            setState(prev => ({ ...prev, rainSound: undefined }));
                            await removeAsset('sosis_love_rain_sound');
                          }}
                          className="flex-1 py-3 bg-red-600/20 text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-600/30 transition-colors"
                        >
                          Clear Rain
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setShowDevModal(false);
                        }}
                        className="flex-1 py-3 bg-orange-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-orange-500 transition-colors"
                      >
                        OK
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Frame Decoration */}
      <div className="absolute inset-0 pointer-events-none border-[12px] border-black/20 rounded-[40px] z-40" />
    </>
  );
}
