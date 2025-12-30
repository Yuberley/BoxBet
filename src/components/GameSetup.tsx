import { useState } from 'react';
import { BET_OPTIONS } from '../types/game';
import './GameSetup.css';

interface GameSetupProps {
  onCreateRoom: (nickname: string, betAmount: number) => void;
  onJoinRoom: (roomCode: string, nickname: string) => void;
}

function GameSetup({ onCreateRoom, onJoinRoom }: GameSetupProps) {
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [nickname, setNickname] = useState('');
  const [betAmount, setBetAmount] = useState(BET_OPTIONS[0].value);
  const [roomCode, setRoomCode] = useState('');

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
    if (roomCode.trim().length !== 4) {
      alert('El código de sala debe tener 4 dígitos');
      return;
    }
    onJoinRoom(roomCode, nickname);
  };

  if (mode === 'menu') {
    return (
      <div className="game-setup">
        <div className="setup-card">
          <h1 className="game-title">💰 BoxBet</h1>
          <p className="game-subtitle">Juego de Monedas Colombianas</p>
          
          <div className="menu-buttons">
            <button 
              className="btn btn-primary"
              onClick={() => setMode('create')}
            >
              Crear Sala
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={() => setMode('join')}
            >
              Unirse a Sala
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="game-setup">
        <div className="setup-card">
          <button 
            className="btn-back"
            onClick={() => setMode('menu')}
          >
            ← Volver
          </button>

          <h2 className="setup-title">Crear Nueva Sala</h2>
          
          <div className="form-group">
            <label>Tu Nickname</label>
            <input
              type="text"
              className="input"
              placeholder="Ingresa tu nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label>Monto de Apuesta</label>
            <div className="bet-options">
              {BET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`bet-option ${betAmount === option.value ? 'active' : ''}`}
                  onClick={() => setBetAmount(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button 
            className="btn btn-primary btn-large"
            onClick={handleCreateRoom}
            disabled={nickname.trim().length < 2}
          >
            Crear Sala
          </button>
        </div>
      </div>
    );
  }

  // mode === 'join'
  return (
    <div className="game-setup">
      <div className="setup-card">
        <button 
          className="btn-back"
          onClick={() => setMode('menu')}
        >
          ← Volver
        </button>

        <h2 className="setup-title">Unirse a Sala</h2>
        
        <div className="form-group">
          <label>Tu Nickname</label>
          <input
            type="text"
            className="input"
            placeholder="Ingresa tu nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
          />
        </div>

        <div className="form-group">
          <label>Código de Sala</label>
          <input
            type="text"
            className="input code-input"
            placeholder="1234"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            maxLength={4}
          />
        </div>

        <button 
          className="btn btn-primary btn-large"
          onClick={handleJoinRoom}
          disabled={nickname.trim().length < 2 || roomCode.length !== 4}
        >
          Unirse
        </button>
      </div>
    </div>
  );
}

export default GameSetup;
