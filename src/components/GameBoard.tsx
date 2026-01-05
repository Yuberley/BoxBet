import React, { useState, useEffect, useCallback, useMemo } from 'react';
import socketService from '../services/socket';
import type { GameState, Player } from '../types/game';
import { useTheme } from '../config/theme';
import { getAvatarById } from '../config/avatars';
import Dice from './Dice';

interface GameBoardProps {
  game: GameState;
  currentPlayerId: string;
  onGameEnd?: () => void;
}

interface LocalEdge {
  row: number;
  col: number;
  direction: 'horizontal' | 'vertical';
  owner: string | null;
}

interface LocalBox {
  row: number;
  col: number;
  owner: string | null;
}

const GameBoard: React.FC<GameBoardProps> = ({ game, currentPlayerId, onGameEnd }) => {
  const theme = useTheme();
  const gridSize = game?.gridSize || 4;

  // State
  const [edges, setEdges] = useState<LocalEdge[]>([]);
  const [boxes, setBoxes] = useState<LocalBox[]>([]);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [remainingMoves, setRemainingMoves] = useState(0);
  const [turnTimer, setTurnTimer] = useState(30);
  const [placementTimer, setPlacementTimer] = useState(90);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);

  // Get current player and opponent
  const currentPlayer = useMemo(() => {
    return game?.players?.find(p => p.id === currentPlayerId) || null;
  }, [game?.players, currentPlayerId]);

  const opponent = useMemo(() => {
    return game?.players?.find(p => p.id !== currentPlayerId) || null;
  }, [game?.players, currentPlayerId]);

  const myNickname = currentPlayer?.nickname || '';
  
  // Get current turn player index and check if it's my turn
  const currentTurnPlayerIndex = game?.currentTurn ?? 0;
  const isMyTurn = game?.players?.[currentTurnPlayerIndex]?.id === currentPlayerId;

  // Initialize game board
  useEffect(() => {
    const initialEdges: LocalEdge[] = [];
    const initialBoxes: LocalBox[] = [];

    // Create horizontal edges
    for (let row = 0; row <= gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        initialEdges.push({ row, col, direction: 'horizontal', owner: null });
      }
    }

    // Create vertical edges
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col <= gridSize; col++) {
        initialEdges.push({ row, col, direction: 'vertical', owner: null });
      }
    }

    // Create boxes
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        initialBoxes.push({ row, col, owner: null });
      }
    }

    setEdges(initialEdges);
    setBoxes(initialBoxes);
  }, [gridSize]);

  // Sync edges from game state
  useEffect(() => {
    if (game?.edges && game.edges.length > 0) {
      setEdges(prev => {
        const updated = [...prev];
        game.edges.forEach(gameEdge => {
          const edgeIndex = updated.findIndex(
            e => e.row === gameEdge.row && 
                 e.col === gameEdge.col && 
                 e.direction === (gameEdge.type === 'horizontal' ? 'horizontal' : 'vertical')
          );
          if (edgeIndex !== -1) {
            const player = game.players.find(p => p.id === gameEdge.playerId);
            updated[edgeIndex] = { ...updated[edgeIndex], owner: player?.nickname || null };
          }
        });
        return updated;
      });
    }
  }, [game?.edges, game?.players]);

  // Sync boxes/coins from game state
  useEffect(() => {
    if (game?.coins && game.coins.length > 0) {
      setBoxes(prev => {
        const updated = [...prev];
        game.coins.forEach((rowCoins, row) => {
          rowCoins.forEach((coin, col) => {
            const boxIndex = updated.findIndex(b => b.row === row && b.col === col);
            if (boxIndex !== -1 && coin.owner) {
              const player = game.players.find(p => p.id === coin.owner);
              updated[boxIndex] = { ...updated[boxIndex], owner: player?.nickname || null };
            }
          });
        });
        return updated;
      });
    }
  }, [game?.coins, game?.players]);

  // Sync diceValue from server (only when dice is rolled)
  useEffect(() => {
    if (game?.diceValue !== null && game?.diceValue !== undefined && game.diceValue > 0) {
      // Solo actualizar si el valor cambió
      if (diceValue !== game.diceValue) {
        setDiceValue(game.diceValue);
        setPlacementTimer(90); // Reset placement timer when dice is rolled
      }
    }
  }, [game?.diceValue, diceValue]);

  // Sync remainingMoves from server (updates as edges are placed)
  useEffect(() => {
    if (game?.diceValue !== null && game?.diceValue !== undefined) {
      setRemainingMoves(game.diceValue - (game.edgesPlaced || 0));
    } else {
      setRemainingMoves(0);
    }
  }, [game?.diceValue, game?.edgesPlaced]);

  // Calculate scores
  const myScore = useMemo(() => {
    return boxes.filter(b => b.owner === myNickname).length;
  }, [boxes, myNickname]);

  const opponentScore = useMemo(() => {
    return boxes.filter(b => b.owner && b.owner !== myNickname).length;
  }, [boxes, myNickname]);

  // Turn timer
  useEffect(() => {
    if (!isMyTurn || gameOver) return;

    const timer = setInterval(() => {
      setTurnTimer(prev => {
        if (prev <= 1) {
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isMyTurn, gameOver]);

  // Placement timer - 90 seconds to place edges after rolling dice
  useEffect(() => {
    if (!isMyTurn || gameOver) return;
    // Only run timer if dice has been rolled (diceValue is not null)
    if (game?.diceValue === null) return;

    const timer = setInterval(() => {
      setPlacementTimer(prev => {
        if (prev <= 1) {
          // Time's up! Place remaining edges randomly
          placeRemainingEdgesRandomly();
          return 90;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isMyTurn, gameOver, game?.diceValue, game?.currentTurn]);

  // Function to place remaining edges randomly
  const placeRemainingEdgesRandomly = useCallback(() => {
    if (remainingMoves <= 0) return;

    const availableEdges = edges.filter(e => !e.owner);
    let movesToPlace = remainingMoves;

    while (movesToPlace > 0 && availableEdges.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableEdges.length);
      const randomEdge = availableEdges[randomIndex];
      
      handleEdgeClick(randomEdge);
      availableEdges.splice(randomIndex, 1);
      movesToPlace--;
    }
  }, [remainingMoves, edges]);

  // Reset timers on turn change
  useEffect(() => {
    setTurnTimer(30);
    setPlacementTimer(90);
  }, [game?.currentTurn]);

  // Socket listeners for opponent moves
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleGameUpdated = () => {
      // The game state updates will be handled by the sync effects above
    };

    socketService.onGameUpdated(handleGameUpdated);

    return () => {
      socket.off('game-updated', handleGameUpdated);
    };
  }, []);

  // Roll dice
  const handleRollDice = useCallback(() => {
    // Prevent rolling if: not my turn, already rolling, already rolled (diceValue set), or still have moves
    if (!isMyTurn || isRolling || game?.diceValue !== null || remainingMoves > 0) return;

    setIsRolling(true);

    // Emit roll dice event to server - server will generate the value
    socketService.rollDice(game.roomCode);

    // Animation delay
    setTimeout(() => {
      setIsRolling(false);
    }, 1000);
  }, [isMyTurn, isRolling, game?.diceValue, remainingMoves, game.roomCode]);

  // Click edge
  const handleEdgeClick = useCallback((edge: LocalEdge) => {
    if (!isMyTurn || remainingMoves <= 0 || edge.owner || game?.diceValue === null) return;

    const newEdges = edges.map(e => {
      if (e.row === edge.row && e.col === edge.col && e.direction === edge.direction) {
        return { ...e, owner: myNickname };
      }
      return e;
    });

    setEdges(newEdges);
    // Don't update remainingMoves locally - let server sync handle it

    // Check for completed boxes
    const newBoxes = [...boxes];
    let boxCompleted = false;

    for (let i = 0; i < newBoxes.length; i++) {
      const box = newBoxes[i];
      if (box.owner) continue;

      const topEdge = newEdges.find(e => e.direction === 'horizontal' && e.row === box.row && e.col === box.col);
      const bottomEdge = newEdges.find(e => e.direction === 'horizontal' && e.row === box.row + 1 && e.col === box.col);
      const leftEdge = newEdges.find(e => e.direction === 'vertical' && e.row === box.row && e.col === box.col);
      const rightEdge = newEdges.find(e => e.direction === 'vertical' && e.row === box.row && e.col === box.col + 1);

      if (topEdge?.owner && bottomEdge?.owner && leftEdge?.owner && rightEdge?.owner) {
        newBoxes[i] = { ...box, owner: myNickname };
        boxCompleted = true;
      }
    }

    if (boxCompleted) {
      setBoxes(newBoxes);
    }

    // Emit move
    socketService.placeEdge(game.roomCode, edge.row, edge.col, edge.direction);

    // Check game over
    const allBoxesFilled = newBoxes.every(b => b.owner !== null);
    if (allBoxesFilled) {
      const myFinalScore = newBoxes.filter(b => b.owner === myNickname).length;
      const oppFinalScore = newBoxes.filter(b => b.owner && b.owner !== myNickname).length;
      setGameOver(true);
      setWinner(myFinalScore > oppFinalScore ? currentPlayer : opponent);
    }
  }, [isMyTurn, remainingMoves, edges, boxes, myNickname, game.roomCode, currentPlayer, opponent]);

  // Render the grid
  const renderGrid = () => {
    const cellSize = `calc(100% / ${gridSize})`;
    const elements: React.ReactNode[] = [];

    for (let row = 0; row <= gridSize; row++) {
      for (let col = 0; col <= gridSize; col++) {
        // Dot
        elements.push(
          <div
            key={`dot-${row}-${col}`}
            className="absolute w-3 h-3 rounded-full bg-white shadow-lg z-20"
            style={{
              left: `calc(${col} * ${cellSize})`,
              top: `calc(${row} * ${cellSize})`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        );

        // Horizontal edge (right of dot)
        if (col < gridSize) {
          const hEdge = edges.find(e => e.direction === 'horizontal' && e.row === row && e.col === col);
          const isOwned = hEdge?.owner;
          const isMine = hEdge?.owner === myNickname;
          
          elements.push(
            <div
              key={`h-edge-${row}-${col}`}
              onClick={() => hEdge && handleEdgeClick(hEdge)}
              className="absolute h-2.5 rounded-full z-10 transition-all duration-200 cursor-pointer"
              style={{
                background: isOwned
                  ? isMine
                    ? '#38BDF8'
                    : '#FB923C'
                  : '#445266',
                boxShadow: isOwned
                  ? isMine
                    ? '0 0 10px rgba(56,189,248,0.7)'
                    : '0 0 10px rgba(251,146,60,0.7)'
                  : 'none',
                opacity: isMyTurn && remainingMoves > 0 && !isOwned ? 0.8 : 1,
                left: `calc(${col} * ${cellSize} + 6px)`,
                top: `calc(${row} * ${cellSize})`,
                width: `calc(${cellSize} - 12px)`,
                transform: 'translateY(-50%)'
              }}
            />
          );
        }

        // Vertical edge (below dot)
        if (row < gridSize) {
          const vEdge = edges.find(e => e.direction === 'vertical' && e.row === row && e.col === col);
          const isOwned = vEdge?.owner;
          const isMine = vEdge?.owner === myNickname;
          
          elements.push(
            <div
              key={`v-edge-${row}-${col}`}
              onClick={() => vEdge && handleEdgeClick(vEdge)}
              className="absolute w-2.5 rounded-full z-10 transition-all duration-200 cursor-pointer"
              style={{
                background: isOwned
                  ? isMine
                    ? '#38BDF8'
                    : '#FB923C'
                  : '#445266',
                boxShadow: isOwned
                  ? isMine
                    ? '0 0 10px rgba(56,189,248,0.7)'
                    : '0 0 10px rgba(251,146,60,0.7)'
                  : 'none',
                opacity: isMyTurn && remainingMoves > 0 && !isOwned ? 0.8 : 1,
                left: `calc(${col} * ${cellSize})`,
                top: `calc(${row} * ${cellSize} + 6px)`,
                height: `calc(${cellSize} - 12px)`,
                transform: 'translateX(-50%)'
              }}
            />
          );
        }

        // Box (coin) - between 4 dots
        if (row < gridSize && col < gridSize) {
          const box = boxes.find(b => b.row === row && b.col === col);
          const isOwned = box?.owner;
          const isMine = box?.owner === myNickname;
          
          // Get coin value from game state
          const coinValue = game?.coins?.[row]?.[col]?.value || 100;
          const coinDisplay = coinValue >= 1000 ? `${coinValue / 1000}K` : coinValue.toString();

          // Define colors based on coin value
          let coinColor = '';
          let textColor = 'text-white';
          let borderStyle = '';
          let shape = 'rounded-full'; // Monedas son circulares, billetes rectangulares
          
          if (isOwned) {
            // When owned, show player color
            if (isMine) {
              coinColor = 'bg-gradient-to-br from-cyan-400 to-cyan-600';
              textColor = 'text-white';
            } else {
              coinColor = 'bg-gradient-to-br from-orange-400 to-orange-600';
              textColor = 'text-white';
            }
            // Mantener forma según valor original
            shape = coinValue >= 2000 ? 'rounded-lg' : 'rounded-full';
          } else {
            // When not owned, show value-specific color
            switch(coinValue) {
              case 100:
                coinColor = 'bg-[#E48547]'; // Cobre
                textColor = 'text-white';
                shape = 'rounded-full';
                break;
              case 200:
                coinColor = 'bg-[#BFC3CC]'; // Plata
                textColor = 'text-gray-800';
                shape = 'rounded-full';
                break;
              case 500:
                coinColor = 'bg-[#F1C31E]'; // Oro
                textColor = 'text-yellow-900';
                shape = 'rounded-full';
                break;
              case 1000:
                coinColor = 'bg-[#F1C31E]'; // Oro
                textColor = 'text-yellow-900';
                borderStyle = 'border-4 border-[#9CA3AF]'; // Borde gris
                shape = 'rounded-full';
                break;
              case 2000:
                coinColor = 'bg-gradient-to-br from-green-400 to-green-600'; // Verde
                textColor = 'text-white';
                shape = 'rounded-lg'; // Billete rectangular
                break;
              case 5000:
                coinColor = 'bg-gradient-to-br from-purple-400 to-purple-600'; // Púrpura
                textColor = 'text-white';
                shape = 'rounded-lg'; // Billete rectangular
                break;
              default:
                coinColor = 'bg-gray-500';
                textColor = 'text-white';
                shape = 'rounded-full';
            }
          }

          elements.push(
            <div
              key={`box-${row}-${col}`}
              className={`absolute flex items-center justify-center z-5 transition-all duration-300 ${
                isOwned ? 'scale-100 opacity-100' : 'scale-90 opacity-100'
              }`}
              style={{
                left: `calc((${col} + 0.5) * ${cellSize})`,
                top: `calc((${row} + 0.5) * ${cellSize})`,
                width: `calc(${cellSize} * 0.49)`,
                height: `calc(${cellSize} * 0.49)`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div
                className={`w-full h-full ${shape} flex flex-col items-center justify-center font-bold ${
                  coinColor
                } ${textColor} ${borderStyle}`}
                style={{
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)'
                }}
              >
                <span className="text-xs">$</span>
                <span className="text-sm leading-none font-extrabold">{coinDisplay}</span>
              </div>
            </div>
          );
        }
      }
    }

    // Render connection points (vertices) - 2x thicker than edges
    for (let row = 0; row <= gridSize; row++) {
      for (let col = 0; col <= gridSize; col++) {
        elements.push(
          <div
            key={`vertex-${row}-${col}`}
            className="absolute h-5 w-5 rounded-full z-20"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 0 10px rgba(255,255,255,0.3)',
              left: `calc(${col} * ${cellSize})`,
              top: `calc(${row} * ${cellSize})`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        );
      }
    }

    return elements;
  };

  // Player panel component
  const PlayerPanel = ({ player, score, isCurrentUser, isActive }: { 
    player: Player | null; 
    score: number; 
    isCurrentUser: boolean;
    isActive: boolean;
  }) => {
    const avatar = player?.avatarId ? getAvatarById(player.avatarId) : null;
    
    return (
      <div className={`w-full max-w-sm transition-all duration-300 ${
        !isCurrentUser ? 'opacity-70 hover:opacity-100' : ''
      }`}>
        <div 
          className={`relative overflow-hidden rounded-xl p-5`}
          style={{
            background: isCurrentUser ? '#1E293B' : '#151E30',
            border: isActive && isCurrentUser ? '2px solid #38BDF8' : '1px solid #475569',
            boxShadow: isActive && isCurrentUser ? '0 0 20px rgba(56,189,248,0.3)' : 'none'
          }}
        >
          {/* "Tu Turno" badge - solo cuando está activo y es el usuario actual */}
          {isActive && isCurrentUser && (
            <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold uppercase tracking-wider text-slate-900" style={{ background: '#38BDF8' }}>
              Tu Turno
            </div>
          )}

          {/* Avatar y nombre */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              {avatar ? (
                <>
                  <div 
                    className="w-16 h-16 rounded-full bg-cover bg-center border-2"
                    style={{
                      borderColor: isCurrentUser ? '#38BDF8' : '#444',
                      background: avatar.background,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem'
                    }}
                  >
                    {avatar.emoji}
                  </div>
                  {isCurrentUser && (
                    <div className="absolute -bottom-1 -right-1 text-slate-900 p-1 rounded-full border-2" style={{ background: '#38BDF8', borderColor: '#1E293B' }}>
                      <span className="material-symbols-outlined text-sm block">edit</span>
                    </div>
                  )}
                </>
              ) : (
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                  isCurrentUser ? 'bg-cyan-500/30 border-2 border-cyan-400' : 'bg-slate-700 border-2 border-slate-600'
                }`}>
                  👤
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{player?.nickname || 'Esperando...'}</h3>
              <p className={`text-sm font-medium ${
                isActive && isCurrentUser ? 'text-cyan-400' : 'text-slate-400'
              }`}>
                {isActive && isCurrentUser ? 'Jugando...' : 'Esperando...'}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg border border-slate-700" style={{ background: '#020617' }}>
              <span className="text-slate-400 text-sm">Puntaje Total</span>
              <span className="text-2xl font-bold" style={{ color: isCurrentUser ? '#FFFFFF' : '#898A92' }}>
                {score.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg border border-slate-700" style={{ background: '#020617' }}>
              <span className="text-slate-400 text-sm">Monedas</span>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm" style={{ color: isCurrentUser ? '#EAB308' : '#898A92' }}>
                  monetization_on
                </span>
                <span className="text-lg font-bold" style={{ color: isCurrentUser ? '#FFFFFF' : '#898A92' }}>
                  {score}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Background gradient using theme
  const bgGradient = `linear-gradient(135deg, ${theme.colors.background.gradient.from} 0%, ${theme.colors.background.gradient.to} 100%)`;

  // Game over modal
  if (gameOver && winner) {
    const isWinner = winner.id === currentPlayerId;
    
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: bgGradient }}>
        <div className="bg-gray-800/90 backdrop-blur-lg rounded-3xl p-8 text-center max-w-md mx-4 border border-white/10">
          <div className="text-6xl mb-4">{isWinner ? '🏆' : '😢'}</div>
          <h2 className={`text-3xl font-bold mb-2 ${isWinner ? 'text-yellow-400' : 'text-gray-400'}`}>
            {isWinner ? '¡Victoria!' : 'Derrota'}
          </h2>
          <p className="text-gray-300 mb-6">
            {isWinner 
              ? `¡Felicitaciones ${myNickname}! Has ganado la partida.`
              : `${winner.nickname} ha ganado la partida.`
            }
          </p>
          
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-cyan-400 font-bold">{myNickname}</div>
              <div className="text-3xl font-bold text-cyan-300">{myScore} 🪙</div>
            </div>
            <div className="text-2xl text-gray-500">vs</div>
            <div className="text-center">
              <div className="text-orange-400 font-bold">{opponent?.nickname}</div>
              <div className="text-3xl font-bold text-orange-300">{opponentScore} 🪙</div>
            </div>
          </div>

          <button
            onClick={onGameEnd}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-white hover:from-cyan-400 hover:to-blue-500 transition-all"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: '#020617' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/10" style={{ background: '#0C1326' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎲</span>
          <h1 className="text-xl font-bold text-white">BoxBet</h1>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-white">Arena Multijugador</h2>
          <p className="text-sm text-gray-400">Sala: {game.roomCode}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Apuesta:</span>
          <span className="text-yellow-400 font-bold">${game?.betAmount || 0}</span>
        </div>
      </header>

      {/* Main game area */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch justify-center p-4 gap-4 lg:gap-6 min-h-0 overflow-auto lg:overflow-hidden">
        
        {/* Desktop: Left side - Current player + Dice (25%) */}
        {/* Mobile: Hidden, shown at bottom */}
        <div className="hidden lg:flex lg:flex-col lg:w-[25%] gap-4 items-center justify-center">
          <div className="w-full max-w-sm space-y-4">
            {/* Current player panel */}
            <div className="flex-shrink-0">
              <PlayerPanel 
                player={currentPlayer} 
                score={myScore} 
                isCurrentUser={true}
                isActive={isMyTurn}
              />
            </div>
            
            {/* Dice section */}
            <div className="flex-shrink-0 rounded-xl p-5 border border-slate-700" style={{ background: '#020617' }}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-white/60 text-sm font-medium uppercase tracking-wider">Lanzar Dado</span>
              <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-white/40">1d6</span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleRollDice}
                disabled={!isMyTurn || isRolling || remainingMoves > 0}
                className={`flex-1 h-14 rounded-xl flex items-center justify-center gap-2 font-bold text-lg shadow-lg transition-all group ${
                  isMyTurn && !isRolling && remainingMoves === 0
                    ? 'bg-cyan-400 hover:bg-sky-500 text-slate-900 shadow-sky-900/20 active:scale-95'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span className={`material-symbols-outlined transition-transform duration-500 ${
                  isRolling ? 'animate-spin' : 'group-hover:rotate-180'
                }`}>
                  casino
                </span>
                {isRolling ? 'GIRANDO...' : 'LANZAR'}
              </button>
              <div className="w-14 h-14 bg-slate-950 rounded-xl border border-slate-700 flex items-center justify-center">
                <Dice value={diceValue} isRolling={isRolling} />
              </div>
            </div>

            {/* Movimientos y timer cuando hay movimientos restantes */}
            {remainingMoves > 0 && (
              <div className="mt-4 p-3 bg-slate-950/50 rounded-lg border border-cyan-400/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Movimientos</span>
                  <span className="text-2xl font-bold text-cyan-400">{remainingMoves}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Tiempo restante</span>
                  <div className={`font-mono font-bold ${
                    placementTimer <= 10 ? 'text-red-400 animate-pulse' : 'text-yellow-400'
                  }`}>
                    {Math.floor(placementTimer / 60)}:{(placementTimer % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Game board container - 50% on desktop, full width on mobile */}
        <div className="flex-1 lg:w-[50%] flex flex-col items-center justify-center">
          {/* Game board */}
          <div 
            className="relative rounded-2xl border border-white/10 w-full"
            style={{
              background: '#1E293B',
              maxWidth: 'min(95vw, 80vh)',
              aspectRatio: '1 / 1',
              padding: 'clamp(0.9rem, 2.4vw, 2.4rem)'
            }}
          >
            {/* Dot pattern background */}
            <div 
              className="absolute inset-0 opacity-10 rounded-2xl pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            />
            <div className="relative w-full h-full">
              {renderGrid()}
            </div>
          </div>

          {/* Turn indicator & Timer */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <div className={`px-4 py-2 rounded-full font-bold text-sm ${
              isMyTurn 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500'
                : 'bg-orange-500/20 text-orange-400 border border-orange-500'
            }`}>
              {isMyTurn ? '¡Tu turno!' : `Turno de ${opponent?.nickname || 'oponente'}`}
            </div>
            
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              turnTimer <= 10 ? 'bg-red-500/20 text-red-400' : 'bg-gray-700/50 text-gray-300'
            }`}>
              <span>⏱️</span>
              <span className="font-mono font-bold">{turnTimer}s</span>
            </div>
          </div>
        </div>

        {/* Desktop: Right side - Opponent + Game History (25%) */}
        <div className="hidden lg:flex lg:flex-col lg:w-[25%] gap-4 items-center justify-center">
          <div className="w-full max-w-sm space-y-4">
            {/* Opponent panel */}
            <div className="flex-shrink-0">
              <PlayerPanel 
                player={opponent} 
                score={opponentScore} 
                isCurrentUser={false}
                isActive={!isMyTurn && !!opponent}
              />
            </div>
            
            {/* Game History with scrollable content */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-col" style={{ maxHeight: '300px' }}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex-shrink-0">Historial de Juego</div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {/* Placeholder para historial - se puede llenar dinámicamente */}
              <div className="flex gap-2 text-sm">
                <span className="text-cyan-400 font-bold">{currentPlayer?.nickname}</span>
                <span className="text-slate-400">inició la partida.</span>
              </div>
              {remainingMoves > 0 && (
                <div className="flex gap-2 text-sm">
                  <span className="text-cyan-400 font-bold">{currentPlayer?.nickname}</span>
                  <span className="text-slate-400">lanzó el dado: </span>
                  <span className="text-yellow-400 font-bold">{diceValue}</span>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Mobile only: Player panels at bottom */}
        <div className="lg:hidden flex flex-col gap-4 w-full max-w-md mx-auto pb-4">
          {/* Current player */}
          <PlayerPanel 
            player={currentPlayer} 
            score={myScore} 
            isCurrentUser={true}
            isActive={isMyTurn}
          />
          
          {/* Opponent player */}
          <PlayerPanel 
            player={opponent} 
            score={opponentScore} 
            isCurrentUser={false}
            isActive={!isMyTurn && !!opponent}
          />
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
