interface StartScreenProps {
  hasSave: boolean;
  onNewGame: () => void;
  onContinue: () => void;
  onDeleteSave?: () => void;
}

export default function StartScreen({ hasSave, onNewGame, onContinue, onDeleteSave }: StartScreenProps) {
  return (
    <div className="screen start-screen">
      <div className="title-card">
        <h1 className="game-title">90+1</h1>
        <p className="game-subtitle">A FOOTBALL CAREER GAME</p>
        <p className="game-tagline">Inspired by Jumpers for Goalposts</p>
      </div>
      
      <div className="menu-buttons">
        <button className="menu-btn primary" onClick={onNewGame}>
          NEW CAREER
        </button>
        {hasSave && (
          <button className="menu-btn secondary" onClick={onContinue}>
            CONTINUE CAREER
          </button>
        )}
        {hasSave && onDeleteSave && (
          <button className="menu-btn danger" onClick={onDeleteSave}>
            DELETE SAVE
          </button>
        )}
      </div>
      
      <div className="credits">
        <p>From non-league to the top flight</p>
        <p className="version">v1.5 - Activity Deck Edition</p>
      </div>
    </div>
  );
}
