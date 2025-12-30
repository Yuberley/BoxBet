import { useState } from 'react';
import './WaitingRoom.css';

interface WaitingRoomProps {
  roomCode: string;
  nickname: string;
}

function WaitingRoom({ roomCode, nickname }: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="waiting-room">
      <div className="waiting-card">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>

        <h2 className="waiting-title">Esperando jugador...</h2>
        
        <p className="waiting-text">
          Comparte este código con tu amigo para que se una:
        </p>

        <div className="code-display" onClick={copyRoomCode}>
          <div className="code-value">{roomCode}</div>
          <button className="copy-button">
            {copied ? '✓ Copiado' : '📋 Copiar'}
          </button>
        </div>

        <div className="waiting-info">
          <p>👤 {nickname}</p>
          <p className="waiting-dots">Esperando oponente<span className="dots">...</span></p>
        </div>
      </div>
    </div>
  );
}

export default WaitingRoom;
