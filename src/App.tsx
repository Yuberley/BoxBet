import { useState, useEffect } from 'react'
import socketService from './services/socket'
import GameSetup from './components/GameSetup'
import WaitingRoom from './components/WaitingRoom'
import GameBoard from './components/GameBoard'
import type { GameState } from './types/game'
import './App.css'

type AppState = 'setup' | 'waiting' | 'playing';

function App() {
  const [appState, setAppState] = useState<AppState>('setup');
  const [game, setGame] = useState<GameState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');

  const playSound = (type: 'start' | 'coin' | 'winCoin' | 'dice' | 'edge') => {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextClass();
    
    // Función para crear notas suaves con envolvente
    const playNote = (frequency: number, duration: number, volume: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine'; // Onda sinusoidal para sonido más suave
      oscillator.frequency.value = frequency;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Envolvente suave (fade in/out)
      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
      gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + duration * 0.5);
      gainNode.gain.linearRampToValueAtTime(0, now + duration);
      
      oscillator.start(now);
      oscillator.stop(now + duration);
    };

    switch(type) {
      case 'start':
        // Acorde alegre C-E-G (Do mayor)
        playNote(523.25, 0.4, 0.08); // C5
        playNote(659.25, 0.4, 0.06); // E5
        playNote(783.99, 0.4, 0.05); // G5
        break;
      case 'coin':
        // Secuencia ascendente alegre
        playNote(523.25, 0.12, 0.06); // C5
        setTimeout(() => playNote(659.25, 0.12, 0.06), 50); // E5
        setTimeout(() => playNote(783.99, 0.18, 0.07), 100); // G5
        break;
      case 'winCoin':
        // Sonido metálico de moneda - efecto "ding" con armónicos
        playNote(1046.50, 0.25, 0.09); // C6 - tono principal
        playNote(1318.51, 0.22, 0.07); // E6 - primer armónico
        playNote(1567.98, 0.20, 0.05); // G6 - segundo armónico
        setTimeout(() => playNote(2093.00, 0.15, 0.04), 30); // C7 - resonancia aguda
        setTimeout(() => playNote(1760.00, 0.18, 0.03), 60); // A6 - brillo final
        break;
      case 'dice':
        // Sonido de dado suave
        playNote(392.00, 0.08, 0.05); // G4
        setTimeout(() => playNote(523.25, 0.08, 0.04), 40); // C5
        break;
      case 'edge':
        // Click suave
        playNote(880.00, 0.06, 0.03); // A5
        break;
    }
  };

  useEffect(() => {
    // Conectar socket
    const socket = socketService.connect();
    
    // Esperar a que el socket se conecte para obtener el ID
    socket.on('connect', () => {
      setCurrentPlayerId(socket.id || '');
    });

    // Listeners
    socketService.onRoomCreated((data) => {
      setGame(data.game);
      setAppState('waiting');
      // Asegurar que tenemos el ID actualizado
      if (socket.id) setCurrentPlayerId(socket.id);
    });

    socketService.onRoomJoined((data) => {
      setGame(data.game);
      setAppState('waiting');
      // Asegurar que tenemos el ID actualizado
      if (socket.id) setCurrentPlayerId(socket.id);
    });

    socketService.onGameUpdated((gameData) => {
      setGame(gameData);
      // Si el juego ya comenzó (hay 2 jugadores), cambiar a playing
      if (gameData.gameStarted) {
        setAppState('playing');
        playSound('start');
      }
    });

    socketService.onCoinsCompleted((data) => {
      playSound('winCoin');
      // Animación de monedas ganadas
      console.log('Monedas completadas:', data);
    });

    socketService.onPlayerDisconnected(() => {
      alert('El otro jugador se desconectó. El juego ha terminado.');
      window.location.reload();
    });

    socketService.onError((data) => {
      alert(data.message);
    });

    // Cleanup
    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
    };
  }, []);

  const handleCreateRoom = (playerNickname: string, betAmount: number) => {
    setNickname(playerNickname);
    socketService.createRoom(playerNickname, betAmount);
  };

  const handleJoinRoom = (roomCode: string, playerNickname: string) => {
    setNickname(playerNickname);
    socketService.joinRoom(roomCode, playerNickname);
  };

  if (appState === 'setup') {
    return <GameSetup onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
  }

  if (appState === 'waiting' && game) {
    return <WaitingRoom roomCode={game.roomCode} nickname={nickname} betAmount={game.betAmount} />;
  }

  if (appState === 'playing' && game) {
    return <GameBoard game={game} currentPlayerId={currentPlayerId} />;
  }

  return <div>Cargando...</div>;
}

export default App
