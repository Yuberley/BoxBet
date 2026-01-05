import { useTheme } from '../config/theme';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
}

function ComingSoonModal({ isOpen, onClose, feature }: ComingSoonModalProps) {
  const theme = useTheme();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-fade-in"
        style={{ backgroundColor: theme.colors.surface.dark }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ backgroundColor: `${theme.colors.primary}20` }}
          >
            <span 
              className="material-symbols-outlined text-4xl"
              style={{ color: theme.colors.primary }}
            >
              schedule
            </span>
          </div>
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: theme.fonts.display }}
          >
            Próximamente
          </h2>
          <p style={{ color: theme.colors.text.muted }}>
            La funcionalidad de <strong style={{ color: theme.colors.primary }}>{feature}</strong> estará disponible en futuras actualizaciones.
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="w-full py-3 px-6 rounded-full font-bold transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: theme.colors.primary,
            color: 'white',
          }}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

export default ComingSoonModal;
