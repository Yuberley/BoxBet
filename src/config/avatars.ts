/**
 * Sistema de avatares predefinidos para BoxBet
 * Los jugadores obtienen avatares aleatorios en lugar de fotos
 */

export interface Avatar {
  id: string;
  emoji: string;
  background: string;
  name: string;
}

export const AVATARS: Avatar[] = [
  { id: 'fire', emoji: '🔥', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', name: 'Fuego' },
  { id: 'rocket', emoji: '🚀', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', name: 'Cohete' },
  { id: 'star', emoji: '⭐', background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', name: 'Estrella' },
  { id: 'crown', emoji: '👑', background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)', name: 'Corona' },
  { id: 'diamond', emoji: '💎', background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', name: 'Diamante' },
  { id: 'lightning', emoji: '⚡', background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', name: 'Rayo' },
  { id: 'trophy', emoji: '🏆', background: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)', name: 'Trofeo' },
  { id: 'target', emoji: '🎯', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', name: 'Diana' },
  { id: 'game', emoji: '🎮', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', name: 'Gaming' },
  { id: 'money', emoji: '💰', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', name: 'Dinero' },
  { id: 'dice', emoji: '🎲', background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', name: 'Dado' },
  { id: 'brain', emoji: '🧠', background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', name: 'Cerebro' },
  { id: 'ninja', emoji: '🥷', background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', name: 'Ninja' },
  { id: 'magic', emoji: '✨', background: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)', name: 'Magia' },
  { id: 'alien', emoji: '👽', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', name: 'Alien' },
  { id: 'robot', emoji: '🤖', background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', name: 'Robot' },
];

/**
 * Obtiene un avatar aleatorio para un jugador
 */
export const getRandomAvatar = (): Avatar => {
  const randomIndex = Math.floor(Math.random() * AVATARS.length);
  return AVATARS[randomIndex];
};

/**
 * Obtiene un avatar por ID, o uno aleatorio si no existe
 */
export const getAvatarById = (id: string): Avatar => {
  const avatar = AVATARS.find(a => a.id === id);
  return avatar || getRandomAvatar();
};

/**
 * Genera avatares únicos para múltiples jugadores
 */
export const getUniqueAvatarsForPlayers = (count: number): Avatar[] => {
  const shuffled = [...AVATARS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, AVATARS.length));
};

export default AVATARS;
