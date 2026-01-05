import { useTheme } from '../config/theme';

interface HeaderProps {
  showProfile?: boolean;
  showRanking?: boolean;
  showRules?: boolean;
  showHistory?: boolean;
  playerName?: string;
  onRankingClick?: () => void;
  onRulesClick?: () => void;
}

function Header({
  showProfile = false,
  showRanking = true,
  showRules = true,
  showHistory = false,
  playerName,
  onRankingClick,
  onRulesClick,
}: HeaderProps) {
  const theme = useTheme();

  return (
    <header 
      className="w-full border-b backdrop-blur-md sticky top-0 z-50"
      style={{
        borderColor: theme.colors.border.dark,
        backgroundColor: `${theme.colors.surface.dark}cc`, // cc = 80% opacity
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ 
                backgroundColor: `${theme.colors.primary}1a`, // 1a = 10% opacity
                color: theme.colors.primary 
              }}
            >
              <span className="material-symbols-outlined text-2xl">casino</span>
            </div>
            <h2 
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: theme.fonts.display }}
            >
              BoxBet
            </h2>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {showRules && (
              <button
                onClick={onRulesClick}
                className="text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: theme.colors.text.muted }}
              >
                Reglas
              </button>
            )}
            {showRanking && (
              <button
                onClick={onRankingClick}
                className="text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: theme.colors.text.muted }}
              >
                Ranking
              </button>
            )}
            {showHistory && (
              <button
                className="text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: theme.colors.text.muted }}
              >
                Historial
              </button>
            )}
          </nav>

          {/* Profile (optional) */}
          {showProfile && playerName && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold">{playerName}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
