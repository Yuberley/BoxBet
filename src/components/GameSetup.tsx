import { useState } from 'react';
import { BET_OPTIONS } from '../types/game';
import { useTheme } from '../config/theme';
import Header from './Header';
import ComingSoonModal from './ComingSoonModal';

interface GameSetupProps {
  onCreateRoom: (nickname: string, betAmount: number) => void;
  onJoinRoom: (roomCode: string, nickname: string) => void;
}

function GameSetup({ onCreateRoom, onJoinRoom }: GameSetupProps) {
  const theme = useTheme();
  const [nickname, setNickname] = useState('');
  const [betAmount, setBetAmount] = useState(10000);
  const [roomCode, setRoomCode] = useState(['', '', '', '']);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');

  const handleShowComingSoon = (feature: string) => {
    setComingSoonFeature(feature);
    setShowComingSoon(true);
  };

  const handleCreateRoom = () => {
    if (nickname.trim().length < 2) {
      alert('El nickname debe tener al menos 2 caracteres');
      return;
    }
    onCreateRoom(nickname, betAmount);
  };

  const handleJoinRoom = () => {
    if (nickname.trim().length < 2) {
      alert('El nickname debe tener al menos 2 caracteres');
      return;
    }
    const code = roomCode.join('');
    if (code.length !== 4) {
      alert('Debes ingresar el código completo de 4 dígitos');
      return;
    }
    onJoinRoom(code, nickname);
  };

  const handleCodeInput = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...roomCode];
    newCode[index] = value.toUpperCase();
    setRoomCode(newCode);
    
    // Auto focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !roomCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').toUpperCase().slice(0, 4);
    
    if (pastedText.length >= 1) {
      const newCode = ['', '', '', ''];
      for (let i = 0; i < Math.min(pastedText.length, 4); i++) {
        newCode[i] = pastedText[i];
      }
      setRoomCode(newCode);
      
      // Focus the last filled input or the next empty one
      const focusIndex = Math.min(pastedText.length, 3);
      const inputToFocus = document.getElementById(`code-${focusIndex}`);
      inputToFocus?.focus();
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col font-sans antialiased overflow-x-hidden text-white"
      style={{ 
        backgroundColor: theme.colors.background.dark,
        fontFamily: theme.fonts.display 
      }}
    >
      <Header 
        showRanking={true}
        showRules={true}
        onRankingClick={() => handleShowComingSoon('Ranking')}
        onRulesClick={() => handleShowComingSoon('Reglas')}
      />

      <main className="flex-grow flex flex-col justify-center items-center p-4 md:p-8 lg:p-12 relative">
        {/* Background pattern */}
        <div 
          className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
          style={{
            backgroundImage: `radial-gradient(${theme.colors.primary} 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />

        <div className="w-full max-w-6xl z-10 space-y-8">
          {/* Title section */}
          <div className="text-center space-y-4 mb-12">
            <div 
              className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 shadow-lg"
              style={{ 
                backgroundColor: theme.colors.surface.dark,
                boxShadow: `0 0 20px ${theme.colors.primary}20`
              }}
            >
              <span 
                className="material-symbols-outlined text-4xl"
                style={{ color: theme.colors.primary }}
              >
                sports_esports
              </span>
            </div>
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight"
              style={{ fontFamily: theme.fonts.display }}
            >
              Bienvenido a la <span style={{ color: theme.colors.primary }}>Arena</span>
            </h1>
            <p 
              className="text-lg max-w-2xl mx-auto"
              style={{ 
                color: theme.colors.text.muted,
                fontFamily: theme.fonts.body 
              }}
            >
              El clásico de monedas, ahora digital. Crea una sala para desafiar a un amigo o únete con un código existente.
            </p>
          </div>

          {/* Nickname Input - Common section */}
          <div className="max-w-2xl mx-auto mb-8">
            <label 
              className="block text-sm font-medium uppercase tracking-wider mb-3 text-center"
              style={{ color: theme.colors.text.muted }}
            >
              Tu Nickname
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 text-center"
              style={{
                backgroundColor: `${theme.colors.background.dark}80`,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: theme.colors.border.dark,
                color: 'white',
              }}
              placeholder="Ingresa tu nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
            />
          </div>

          {/* Main cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-stretch">
            {/* Create Room Card */}
            <div 
              className="group relative rounded-2xl p-6 md:p-10 shadow-xl transition-all duration-300"
              style={{ 
                backgroundColor: theme.colors.surface.dark,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: theme.colors.border.dark,
              }}
            >
              <div className="relative z-10 flex flex-col h-full justify-between space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span 
                      className="material-symbols-outlined text-3xl"
                      style={{ color: theme.colors.primary }}
                    >
                      token
                    </span>
                    <h2 className="text-3xl font-bold">Crear Sala</h2>
                  </div>
                  <p 
                    className="mb-8"
                    style={{ 
                      color: theme.colors.text.muted,
                      fontFamily: theme.fonts.body 
                    }}
                  >
                    Configura el valor de la apuesta para iniciar una nueva partida.
                  </p>

                  {/* Bet Amount Selector */}
                  <div 
                    className="rounded-xl p-6 border"
                    style={{
                      backgroundColor: `${theme.colors.background.dark}50`,
                      borderColor: theme.colors.border.dark,
                    }}
                  >
                    <div className="flex justify-between items-end mb-6">
                      <span 
                        className="text-sm font-medium uppercase tracking-wider"
                        style={{ color: theme.colors.text.muted }}
                      >
                        Apuesta Actual
                      </span>
                      <div className="text-right">
                        <span 
                          className="text-3xl md:text-4xl font-black"
                          style={{ color: theme.colors.primary }}
                        >
                          ${betAmount.toLocaleString('es-CO')}
                        </span>
                        <span 
                          className="text-xs font-bold block mt-1"
                          style={{ color: theme.colors.text.muted }}
                        >
                          COP
                        </span>
                      </div>
                    </div>

                    {/* Range Slider */}
                    <div className="relative w-full mb-8" style={{ height: '32px' }}>
                      {/* Progress bar background */}
                      <div 
                        className="absolute top-1/2 left-0 right-0 h-2 rounded-full overflow-hidden" 
                        style={{ 
                          backgroundColor: theme.colors.border.dark,
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <div 
                          className="absolute top-0 left-0 h-full rounded-full transition-all duration-200"
                          style={{ 
                            backgroundColor: theme.colors.primary,
                            width: `${((betAmount - 1000) / (20000 - 1000)) * 100}%`
                          }}
                        />
                      </div>
                      {/* Slider */}
                      <input
                        type="range"
                        className="absolute top-0 left-0 w-full h-full focus:outline-none custom-range"
                        style={{ zIndex: 10 }}
                        min="1000"
                        max="20000"
                        step="1000"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                      />
                    </div>

                    {/* Quick select buttons */}
                    <div className="flex flex-wrap gap-3 justify-center">
                      {BET_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setBetAmount(option.value)}
                          className="flex-1 min-w-[80px] py-2 px-3 rounded-full border transition-all text-xs font-bold text-center"
                          style={{
                            backgroundColor: betAmount === option.value ? theme.colors.primary : 'transparent',
                            borderColor: betAmount === option.value ? theme.colors.primary : theme.colors.border.dark,
                            color: betAmount === option.value ? 'white' : theme.colors.text.muted,
                            transform: betAmount === option.value ? 'scale(1.05)' : 'scale(1)',
                          }}
                        >
                          ${option.value / 1000}k
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleCreateRoom}
                    disabled={nickname.trim().length < 2}
                    className="w-full h-14 rounded-full font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: 'white',
                      boxShadow: `0 10px 30px ${theme.colors.primary}40`,
                    }}
                  >
                    <span>Generar Código</span>
                    <span className="material-symbols-outlined group-hover/btn:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Join Room Card */}
            <div 
              className="group relative rounded-2xl p-6 md:p-10 shadow-xl transition-all duration-300"
              style={{ 
                backgroundColor: theme.colors.surface.dark,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: theme.colors.border.dark,
              }}
            >
              <div 
                className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity"
              >
                <span 
                  className="material-symbols-outlined text-9xl"
                  style={{ color: theme.colors.text.muted }}
                >
                  vpn_key
                </span>
              </div>

              <div className="relative z-10 flex flex-col h-full justify-between space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span 
                      className="material-symbols-outlined text-3xl"
                      style={{ color: theme.colors.text.mutedDark }}
                    >
                      keyboard
                    </span>
                    <h2 className="text-3xl font-bold">Unirse a Sala</h2>
                  </div>
                  <p 
                    className="mb-8"
                    style={{ 
                      color: theme.colors.text.muted,
                      fontFamily: theme.fonts.body 
                    }}
                  >
                    Ingresa el código de 4 dígitos para ingresar a una sala.
                  </p>

                  {/* Room Code Input */}
                  <div 
                    className="rounded-xl p-8 border flex flex-col items-center justify-center"
                    style={{
                      backgroundColor: `${theme.colors.background.dark}50`,
                      borderColor: theme.colors.border.dark,
                      minHeight: '240px',
                    }}
                  >
                    <p 
                      className="text-sm uppercase tracking-wider text-center font-bold mb-6"
                      style={{ color: theme.colors.text.muted }}
                    >
                      Código de Acceso
                    </p>
                    <div className="flex gap-4 justify-center">
                      {[0, 1, 2, 3].map((index) => (
                        <input
                          key={index}
                          id={`code-${index}`}
                          type="text"
                          maxLength={1}
                          className="w-16 h-20 text-center text-3xl font-bold rounded-xl uppercase focus:outline-none focus:ring-2 transition-all"
                          style={{
                            backgroundColor: theme.colors.background.dark,
                            borderWidth: '2px',
                            borderStyle: 'solid',
                            borderColor: roomCode[index] ? theme.colors.primary : theme.colors.border.dark,
                            color: theme.colors.primary,
                          }}
                          value={roomCode[index]}
                          onChange={(e) => handleCodeInput(index, e.target.value)}
                          onKeyDown={(e) => handleCodeKeyDown(index, e)}
                          onPaste={handleCodePaste}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleJoinRoom}
                    disabled={nickname.trim().length < 2 || roomCode.join('').length !== 4}
                    className="w-full h-14 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-3 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'white',
                      color: theme.colors.background.dark,
                    }}
                  >
                    <span className="material-symbols-outlined">login</span>
                    <span>Entrar a la mesa</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer links */}
          <div className="flex items-center justify-center gap-8 mt-8 text-sm">
            <button 
              onClick={() => handleShowComingSoon('¿Cómo Jugar?')}
              className="flex items-center gap-2 transition-colors"
              style={{ color: theme.colors.text.muted }}
            >
              <span className="material-symbols-outlined text-sm">help</span>
              <span>¿Cómo jugar?</span>
            </button>
            <button 
              onClick={() => handleShowComingSoon('Política de Juego')}
              className="flex items-center gap-2 transition-colors"
              style={{ color: theme.colors.text.muted }}
            >
              <span className="material-symbols-outlined text-sm">security</span>
              <span>Política de juego</span>
            </button>
          </div>
        </div>
      </main>

      <ComingSoonModal 
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        feature={comingSoonFeature}
      />

      <style>{`
        .custom-range {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          width: 100%;
        }

        .custom-range::-webkit-slider-track {
          background: transparent;
          height: 24px;
        }

        .custom-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          background: ${theme.colors.primary};
          height: 24px;
          width: 24px;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 15px ${theme.colors.primary}80;
          border: 3px solid ${theme.colors.background.dark};
        }

        .custom-range::-moz-range-track {
          background: transparent;
          height: 24px;
        }

        .custom-range::-moz-range-thumb {
          background: ${theme.colors.primary};
          height: 24px;
          width: 24px;
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid ${theme.colors.background.dark};
          box-shadow: 0 0 15px ${theme.colors.primary}80;
        }

        .custom-range:focus::-webkit-slider-thumb {
          box-shadow: 0 0 20px ${theme.colors.primary};
        }

        .custom-range:focus::-moz-range-thumb {
          box-shadow: 0 0 20px ${theme.colors.primary};
        }
      `}</style>
    </div>
  );
}

export default GameSetup;
