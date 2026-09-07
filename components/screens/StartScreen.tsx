interface StartScreenProps {
  hasSave: boolean;
  onNewGame: () => void;
  onContinue: () => void;
}

export default function StartScreen({ hasSave, onNewGame, onContinue }: StartScreenProps) {
  return (
    <div className="screen start-screen">
      <div className="title-card">
        <h1 className="game-title">90+1</h1>
        <p className="game-subtitle">A FOOTBALL CAREER GAME</p>
      </div>
      
      <div className="menu-buttons">
        <button className="menu-btn primary" onClick={onNewGame}>
          NEW CAREER
        </button>
        {hasSave && (
          <button className="menu-btn secondary" onClick={onContinue}>
            CONTINUE
          </button>
        )}
      </div>
      
      <div className="credits">
        <p>From non-league to the top flight</p>
      </div>
    </div>
  );
}
