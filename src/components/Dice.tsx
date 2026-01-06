import { useEffect, useState } from 'react';
import './Dice.css';

interface DiceProps {
  value: number | null;
  isRolling: boolean;
}

function Dice({ value, isRolling }: DiceProps) {
  // Definir las rotaciones para cada cara del dado
  const faceRotations: { [key: number]: { x: number; y: number } } = {
    1: { x: 0, y: 0 },
    2: { x: 0, y: -90 },
    3: { x: 0, y: -180 },
    4: { x: 0, y: 90 },
    5: { x: -90, y: 0 },
    6: { x: 90, y: 0 },
  };

  // Inicializar con una cara aleatoria en lugar de siempre mostrar la cara 1
  const [rotation, setRotation] = useState(() => {
    const randomFace = Math.floor(Math.random() * 6) + 1;
    return faceRotations[randomFace] || { x: 0, y: 0 };
  });

  useEffect(() => {
    if (!isRolling || value === null) return;

    // Detectar si es mobile para optimizar rendimiento
    const isMobile = window.innerWidth < 1024;
    
    // Animación de rodado con rotaciones aleatorias (menos rotaciones en mobile)
    const randomRotations = isMobile 
      ? Math.floor(Math.random() * 2) + 2 // 2-3 rotaciones en mobile
      : Math.floor(Math.random() * 3) + 3; // 3-5 rotaciones en desktop
    const baseX = randomRotations * 360;
    const baseY = randomRotations * 360;
    
    const finalRotation = faceRotations[value];
    
    // Validar que finalRotation existe antes de usarlo
    if (!finalRotation) return;
    
    const newRotation = {
      x: baseX + finalRotation.x,
      y: baseY + finalRotation.y,
    };

    // Usar requestAnimationFrame para evitar setState síncrono
    requestAnimationFrame(() => {
      setRotation(newRotation);
    });
  }, [value, isRolling, faceRotations]);

  return (
    <div className="dice-container">
      <div 
        className={`dice ${isRolling ? 'rolling' : ''}`}
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        <div className="dice-face dice-face-1">
          <span className="dot dot-center"></span>
        </div>
        <div className="dice-face dice-face-2">
          <span className="dot dot-top-left"></span>
          <span className="dot dot-bottom-right"></span>
        </div>
        <div className="dice-face dice-face-3">
          <span className="dot dot-top-left"></span>
          <span className="dot dot-center"></span>
          <span className="dot dot-bottom-right"></span>
        </div>
        <div className="dice-face dice-face-4">
          <span className="dot dot-top-left"></span>
          <span className="dot dot-top-right"></span>
          <span className="dot dot-bottom-left"></span>
          <span className="dot dot-bottom-right"></span>
        </div>
        <div className="dice-face dice-face-5">
          <span className="dot dot-top-left"></span>
          <span className="dot dot-top-right"></span>
          <span className="dot dot-center"></span>
          <span className="dot dot-bottom-left"></span>
          <span className="dot dot-bottom-right"></span>
        </div>
        <div className="dice-face dice-face-6">
          <span className="dot dot-top-left"></span>
          <span className="dot dot-top-right"></span>
          <span className="dot dot-middle-left"></span>
          <span className="dot dot-middle-right"></span>
          <span className="dot dot-bottom-left"></span>
          <span className="dot dot-bottom-right"></span>
        </div>
      </div>
    </div>
  );
}

export default Dice;
