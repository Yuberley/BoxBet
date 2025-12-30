import type { GameState, Coin } from '../types/game';
import socketService from '../services/socket';
import { useEffect, useCallback } from 'react';
import Dice from './Dice';
import './GameBoard.css';

interface GameBoardProps {
  game: GameState;
  currentPlayerId: string;
}

function GameBoard({ game, currentPlayerId }: GameBoardProps) {
  const isMyTurn = game.players[game.currentTurn]?.id === currentPlayerId;
  const currentPlayer = game.players.find(p => p.id === currentPlayerId);
  const opponent = game.players.find(p => p.id !== currentPlayerId);

  const renderCoinImage = useCallback((value: 100 | 200 | 500 | 1000) => {
    // Emoji o representación de monedas colombianas
    const coinEmojis: Record<number, string> = {
      100: '🟡',
      200: '🟠',
      500: '🔵',
      1000: '🟣'
    };
    return coinEmojis[value];
  }, []);

  const animateCoinToPlayer = useCallback((row: number, col: number, value: number, playerId: string) => {
    // Obtener posición de la moneda en el tablero
    const coinElement = document.querySelector(`[data-coin="${row}-${col}"]`);
    const targetCard = document.querySelector(`[data-player-id="${playerId}"]`);
    
    if (!coinElement || !targetCard) return;

    const coinRect = coinElement.getBoundingClientRect();
    const targetRect = targetCard.getBoundingClientRect();

    // Crear moneda animada
    const flyingCoin = document.createElement('div');
    flyingCoin.className = 'flying-coin';
    flyingCoin.innerHTML = `
      <div class="flying-coin-inner">
        ${renderCoinImage(value as 100 | 200 | 500 | 1000)}
        <div class="flying-coin-value">$${value}</div>
      </div>
    `;
    
    flyingCoin.style.left = `${coinRect.left}px`;
    flyingCoin.style.top = `${coinRect.top}px`;
    
    document.body.appendChild(flyingCoin);

    // Animar con un pequeño delay para que el navegador registre la posición inicial
    requestAnimationFrame(() => {
      flyingCoin.style.left = `${targetRect.left + targetRect.width / 2}px`;
      flyingCoin.style.top = `${targetRect.top + targetRect.height / 2}px`;
      flyingCoin.style.transform = 'scale(0.5) rotate(720deg)';
      flyingCoin.style.opacity = '0';
    });

    // Eliminar después de la animación
    setTimeout(() => {
      flyingCoin.remove();
    }, 1000);
  }, [renderCoinImage]);

  // Escuchar cuando se completan monedas para animar
  useEffect(() => {
    const handleCoinsCompleted = (data: { playerId: string; coins: Array<{ row: number; col: number; value: number }> }) => {
      data.coins.forEach((coinData, index) => {
        setTimeout(() => {
          animateCoinToPlayer(coinData.row, coinData.col, coinData.value, data.playerId);
        }, index * 200);
      });
    };

    socketService.onCoinsCompleted(handleCoinsCompleted);

    return () => {
      socketService.getSocket()?.off('coins-completed', handleCoinsCompleted);
    };
  }, [animateCoinToPlayer]);

  const handleRollDice = () => {
    if (!isMyTurn || game.diceValue !== null) return;
    socketService.rollDice(game.roomCode);
  };

  const handlePlaceEdge = (row: number, col: number, type: 'horizontal' | 'vertical') => {
    if (!isMyTurn || game.diceValue === null) return;
    if (game.edgesPlaced >= game.diceValue) return;
    
    // Verificar si la arista ya existe
    const edgeExists = game.edges.some(e => 
      e.row === row && e.col === col && e.type === type
    );
    if (edgeExists) return;

    socketService.placeEdge(game.roomCode, row, col, type);
  };

  const getEdgeColor = (row: number, col: number, type: 'horizontal' | 'vertical'): string | null => {
    const edge = game.edges.find(e => e.row === row && e.col === col && e.type === type);
    if (!edge) return null;
    const player = game.players.find(p => p.id === edge.playerId);
    return player?.color || null;
  };

  const getCoinOwnerColor = (coin: Coin): string | null => {
    if (!coin.owner) return null;
    const player = game.players.find(p => p.id === coin.owner);
    return player?.color || null;
  };

  return (
    <div className="game-container">
      {/* Header con información de jugadores */}
      <div className="game-header">
        <div className="player-info">
          <div 
            className={`player-card ${isMyTurn ? 'active' : ''}`} 
            style={{ borderColor: currentPlayer?.color }}
            data-player-id={currentPlayerId}
          >
            <div className="player-name">
              {currentPlayer?.nickname} (Tú)
            </div>
            <div className="player-money-container">
              <div className="money-icon">💰</div>
              <div className="player-money">
                ${currentPlayer?.money.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="room-info">
            <div className="room-code">Sala: {game.roomCode}</div>
            <div className="bet-amount">Apuesta: ${game.betAmount.toLocaleString()}</div>
          </div>

          {opponent && (
            <div 
              className={`player-card ${!isMyTurn ? 'active' : ''}`} 
              style={{ borderColor: opponent.color }}
              data-player-id={opponent.id}
            >
              <div className="player-name">
                {opponent.nickname}
              </div>
              <div className="player-money-container">
                <div className="money-icon">💰</div>
                <div className="player-money">
                  ${opponent.money.toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controles del juego */}
      <div className="game-controls">
        <div className="dice-section">
          {game.diceValue === null ? (
            <button 
              className={`dice-button ${isMyTurn ? '' : 'disabled'}`}
              onClick={handleRollDice}
              disabled={!isMyTurn}
            >
              🎲 {isMyTurn ? 'Tirar Dado' : 'Esperando...'}
            </button>
          ) : (
            <div className="dice-result">
              <Dice value={game.diceValue} isRolling={game.edgesPlaced === 0} />
              <div className="edges-remaining">
                Aristas: {game.edgesPlaced}/{game.diceValue}
              </div>
            </div>
          )}
        </div>

        {!isMyTurn && (
          <div className="waiting-message">
            ⏳ Turno de {game.players[game.currentTurn]?.nickname}
          </div>
        )}
      </div>

      {/* Tablero de juego */}
      <div className="board-container">
        <div 
          className="game-board"
          style={{
            gridTemplateColumns: `repeat(${game.gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${game.gridSize}, 1fr)`
          }}
        >
          {game.coins.map((row, rowIndex) => 
            row.map((coin, colIndex) => {
              const ownerColor = getCoinOwnerColor(coin);
              
              return (
                <div 
                  key={`${rowIndex}-${colIndex}`} 
                  className="cell"
                >
                  {/* Arista superior */}
                  <div 
                    className={`edge edge-horizontal edge-top ${
                      getEdgeColor(rowIndex, colIndex, 'horizontal') ? 'placed' : ''
                    } ${isMyTurn && game.diceValue !== null && game.edgesPlaced < game.diceValue ? 'hoverable' : ''}`}
                    style={{ backgroundColor: getEdgeColor(rowIndex, colIndex, 'horizontal') || undefined }}
                    onClick={() => handlePlaceEdge(rowIndex, colIndex, 'horizontal')}
                  />

                  {/* Arista izquierda */}
                  <div 
                    className={`edge edge-vertical edge-left ${
                      getEdgeColor(rowIndex, colIndex, 'vertical') ? 'placed' : ''
                    } ${isMyTurn && game.diceValue !== null && game.edgesPlaced < game.diceValue ? 'hoverable' : ''}`}
                    style={{ backgroundColor: getEdgeColor(rowIndex, colIndex, 'vertical') || undefined }}
                    onClick={() => handlePlaceEdge(rowIndex, colIndex, 'vertical')}
                  />

                  {/* Moneda */}
                  <div 
                    className={`coin ${ownerColor ? 'owned' : ''}`}
                    style={{ 
                      backgroundColor: ownerColor || undefined,
                      opacity: ownerColor ? 1 : 1 
                    }}
                    data-coin={`${rowIndex}-${colIndex}`}
                  >
                    {ownerColor ? (
                      // Moneda capturada - mostrar inicial del jugador
                      <div className="coin-captured">
                        <div className="player-initial">
                          {game.players.find(p => p.id === coin.owner)?.nickname.charAt(0).toUpperCase()}
                        </div>
                        <div className="captured-badge">✓</div>
                      </div>
                    ) : (
                      // Moneda disponible - mostrar valor
                      <>
                        <div className="coin-emoji">
                          {renderCoinImage(coin.value)}
                        </div>
                        <div className="coin-value">
                          ${coin.value}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Arista derecha (solo última columna) */}
                  {colIndex === game.gridSize - 1 && (
                    <div 
                      className={`edge edge-vertical edge-right ${
                        getEdgeColor(rowIndex, colIndex + 1, 'vertical') ? 'placed' : ''
                      } ${isMyTurn && game.diceValue !== null && game.edgesPlaced < game.diceValue ? 'hoverable' : ''}`}
                      style={{ backgroundColor: getEdgeColor(rowIndex, colIndex + 1, 'vertical') || undefined }}
                      onClick={() => handlePlaceEdge(rowIndex, colIndex + 1, 'vertical')}
                    />
                  )}

                  {/* Arista inferior (solo última fila) */}
                  {rowIndex === game.gridSize - 1 && (
                    <div 
                      className={`edge edge-horizontal edge-bottom ${
                        getEdgeColor(rowIndex + 1, colIndex, 'horizontal') ? 'placed' : ''
                      } ${isMyTurn && game.diceValue !== null && game.edgesPlaced < game.diceValue ? 'hoverable' : ''}`}
                      style={{ backgroundColor: getEdgeColor(rowIndex + 1, colIndex, 'horizontal') || undefined }}
                      onClick={() => handlePlaceEdge(rowIndex + 1, colIndex, 'horizontal')}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de fin de juego */}
      {game.gameEnded && (
        <div className="game-over-modal">
          <div className="modal-content">
            <h2>🎉 ¡Juego Terminado!</h2>
            <div className="final-scores">
              {game.players
                .sort((a, b) => b.money - a.money)
                .map((player, index) => (
                  <div 
                    key={player.id} 
                    className={`final-score ${index === 0 ? 'winner' : ''}`}
                    style={{ borderColor: player.color }}
                  >
                    <div className="score-position">
                      {index === 0 ? '👑' : '2º'}
                    </div>
                    <div className="score-name">{player.nickname}</div>
                    <div className="score-money">
                      ${player.money.toLocaleString()} COP
                    </div>
                  </div>
                ))}
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Jugar de Nuevo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameBoard;
