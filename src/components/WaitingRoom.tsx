import { useState, useMemo } from 'react';
import { useTheme } from '../config/theme';
import { getRandomAvatar } from '../config/avatars';
import AvatarComponent from './AvatarComponent';
import Header from './Header';

interface WaitingRoomProps {
  roomCode: string;
  nickname: string;
  betAmount: number;
}

function WaitingRoom({ roomCode, nickname, betAmount }: WaitingRoomProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  
  // Generate a random avatar for the player (memoized so it doesn't change on re-renders)
  const playerAvatar = useMemo(() => getRandomAvatar(), []);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        showRanking={false}
        showRules={false}
        playerName={nickname}
      />

      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[580px] flex flex-col gap-6 animate-fade-in">
          <div 
            className="rounded-xl shadow-2xl border overflow-hidden relative"
            style={{
              backgroundColor: theme.colors.surface.dark,
              borderColor: theme.colors.border.dark,
            }}
          >
            {/* Top accent bar */}
            <div 
              className="absolute top-0 left-0 w-full h-1.5"
              style={{
                background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.primaryLight}, ${theme.colors.primary})`
              }}
            />

            <div className="p-6 sm:p-10 flex flex-col items-center text-center">
              {/* Status badge */}
              <div className="mb-8 space-y-3">
                <div 
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2"
                  style={{
                    backgroundColor: `${theme.colors.primary}1a`,
                    color: theme.colors.primary,
                  }}
                >
                  <span className="relative flex h-2 w-2">
                    <span 
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <span 
                      className="relative inline-flex rounded-full h-2 w-2"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                  </span>
                  En Vivo
                </div>
                <h1 
                  className="text-3xl sm:text-4xl font-black tracking-tight"
                  style={{ fontFamily: theme.fonts.display }}
                >
                  Esperando Oponente...
                </h1>
                <p 
                  className="text-base font-medium"
                  style={{ color: theme.colors.text.muted }}
                >
                  Comparte el código para desafiar a un amigo
                </p>
              </div>

              {/* Room code section */}
              <div 
                className="w-full border rounded-lg p-6 mb-8 relative group transition-colors shadow-inner"
                style={{
                  backgroundColor: `${theme.colors.background.dark}80`,
                  borderColor: theme.colors.border.dark,
                }}
              >
                <p 
                  className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
                  style={{ color: theme.colors.text.mutedDark }}
                >
                  Código de Sala
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                  <span 
                    className="text-5xl font-black font-mono tracking-widest select-all"
                    style={{ 
                      fontFamily: 'monospace',
                      color: 'white',
                      textShadow: '0 2px 10px rgba(0,0,0,0.3)' 
                    }}
                  >
                    {roomCode}
                  </span>
                  <button 
                    onClick={copyRoomCode}
                    className="flex min-w-[120px] cursor-pointer items-center justify-center rounded-full h-11 px-5 gap-2 transition-all shadow-lg active:scale-95"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: 'white',
                      boxShadow: `0 4px 12px ${theme.colors.primary}33`,
                    }}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {copied ? 'check' : 'content_copy'}
                    </span>
                    <span className="text-sm font-bold">
                      {copied ? 'Copiado!' : 'Copiar'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Players section */}
              <div className="w-full flex items-center justify-between px-2 sm:px-8 mb-8">
                {/* Current player */}
                <div className="flex flex-col items-center gap-3 w-1/3">
                  <div className="relative">
                    <AvatarComponent 
                      avatar={playerAvatar} 
                      size="xl"
                      showBorder={true}
                      className="shadow-lg"
                    />
                    <div 
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm"
                      style={{
                        backgroundColor: theme.colors.surface.dark,
                        color: 'white',
                        border: `2px solid ${theme.colors.border.dark}`,
                      }}
                    >
                      Tú
                    </div>
                  </div>
                  <span className="font-bold mt-2 truncate max-w-full">{nickname}</span>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center justify-center w-1/3 -mt-6">
                  <span 
                    className="text-4xl font-black italic select-none"
                    style={{ color: theme.colors.border.dark }}
                  >
                    VS
                  </span>
                </div>

                {/* Waiting for opponent */}
                <div className="flex flex-col items-center gap-3 w-1/3">
                  <div className="relative">
                    <div 
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-dashed flex items-center justify-center animate-pulse"
                      style={{
                        borderColor: `${theme.colors.primary}66`,
                        backgroundColor: `${theme.colors.primary}0d`,
                      }}
                    >
                      <span 
                        className="material-symbols-outlined text-4xl"
                        style={{ color: `${theme.colors.primary}99` }}
                      >
                        person_add
                      </span>
                    </div>
                  </div>
                  <span 
                    className="font-medium text-sm italic mt-2 animate-pulse"
                    style={{ color: theme.colors.text.muted }}
                  >
                    Esperando...
                  </span>
                </div>
              </div>

              {/* Bet info */}
              <div 
                className="inline-flex items-center gap-3 border rounded-full pl-2 pr-6 py-2 mb-6"
                style={{
                  backgroundColor: `${theme.colors.background.dark}80`,
                  borderColor: theme.colors.border.dark,
                }}
              >
                <div 
                  className="rounded-full p-2 flex items-center justify-center shadow-sm text-white"
                  style={{ backgroundColor: theme.colors.secondary }}
                >
                  <span className="material-symbols-outlined text-lg leading-none">savings</span>
                </div>
                <div className="flex flex-col text-left">
                  <span 
                    className="text-[10px] font-bold uppercase leading-none mb-0.5"
                    style={{ color: theme.colors.text.muted }}
                  >
                    Apuesta
                  </span>
                  <span className="font-bold text-sm leading-none">
                    ${betAmount.toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>
            </div>

            {/* Footer tip */}
            <div 
              className="px-6 py-4 text-center border-t"
              style={{
                backgroundColor: `${theme.colors.background.dark}40`,
                borderColor: theme.colors.border.dark,
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <span 
                  className="material-symbols-outlined text-base"
                  style={{ color: theme.colors.secondary }}
                >
                  lightbulb
                </span>
                <p 
                  className="text-xs font-medium"
                  style={{ color: theme.colors.text.muted }}
                >
                  <strong style={{ color: theme.colors.secondary }}>Tip Pro:</strong> Bloquea las esquinas de tu oponente temprano para evitar que multiplique sus puntos.
                </p>
              </div>
            </div>
          </div>

          {/* Timer (optional - you can add actual functionality later) */}
          <div className="flex items-center justify-center gap-2 opacity-60">
            <span 
              className="material-symbols-outlined text-sm"
              style={{ color: theme.colors.text.muted }}
            >
              schedule
            </span>
            <span 
              className="text-sm"
              style={{ color: theme.colors.text.muted }}
            >
              Esperando jugador...
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default WaitingRoom;
