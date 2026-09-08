import { useState, useEffect, useRef } from 'react';
import { GameState, TrialType, TrialResult } from '@/lib/types';

interface SkillTrialsScreenProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onReturnToMenu?: () => void;
}

const TRIAL_TYPES: { type: TrialType; name: string; description: string }[] = [
  { type: 'volleys', name: 'Volleys', description: 'Hit the ball cleanly in the air' },
  { type: 'penalties', name: 'Penalties', description: 'Score from the spot' },
  { type: 'snap-shots', name: 'Snap Shots', description: 'Quick reactions from close range' },
];

export default function SkillTrialsScreen({ gameState, setGameState, onReturnToMenu }: SkillTrialsScreenProps) {
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [isInTrial, setIsInTrial] = useState(false);
  const [powerLevel, setPowerLevel] = useState(0);
  const [isPowerBuilding, setIsPowerBuilding] = useState(false);
  const [hasShot, setHasShot] = useState(false);
  const [trialScore, setTrialScore] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(10);
  const [showResult, setShowResult] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const currentTrial = TRIAL_TYPES[currentTrialIndex];
  const allTrialsComplete = currentTrialIndex >= TRIAL_TYPES.length;

  useEffect(() => {
    if (!isInTrial || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Power bar animation
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw goal posts (rear view)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(50, 50, 10, 200); // Left post
      ctx.fillRect(540, 50, 10, 200); // Right post
      ctx.fillRect(50, 50, 500, 10); // Crossbar

      // Draw net pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      for (let x = 60; x < 540; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 60);
        ctx.lineTo(x, 250);
        ctx.stroke();
      }
      for (let y = 60; y < 250; y += 40) {
        ctx.beginPath();
        ctx.moveTo(60, y);
        ctx.lineTo(540, y);
        ctx.stroke();
      }

      // Draw power bar
      ctx.fillStyle = '#333';
      ctx.fillRect(200, 280, 200, 30);
      
      // Power level indicator
      const powerColor = powerLevel < 30 ? '#ff4444' : powerLevel < 70 ? '#44ff44' : '#ff4444';
      ctx.fillStyle = powerColor;
      ctx.fillRect(200, 280, powerLevel * 2, 30);

      if (isPowerBuilding && !hasShot) {
        setPowerLevel((prev) => {
          const next = prev + 2;
          return next > 100 ? 0 : next;
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInTrial, isPowerBuilding, hasShot, powerLevel]);

  const startTrial = () => {
    setIsInTrial(true);
    setIsPowerBuilding(true);
    setHasShot(false);
    setPowerLevel(0);
    setTrialScore(0);
    setAttemptsLeft(10);
    setShowResult(false);
  };

  const handleShoot = () => {
    if (hasShot || attemptsLeft <= 0) return;
    
    setHasShot(true);
    setIsPowerBuilding(false);

    // Evaluate shot: ideal power is 40-70
    const isGoodPower = powerLevel >= 40 && powerLevel <= 70;
    const success = Math.random() < (isGoodPower ? 0.8 : 0.3);

    if (success) {
      setTrialScore(prev => prev + 1);
    }

    // Reset for next attempt
    setTimeout(() => {
      const newAttemptsLeft = attemptsLeft - 1;
      setAttemptsLeft(newAttemptsLeft);
      
      if (newAttemptsLeft > 0) {
        setHasShot(false);
        setPowerLevel(0);
        setIsPowerBuilding(true);
      } else {
        // Trial complete
        finishTrial();
      }
    }, 1000);
  };

  const finishTrial = () => {
    const passed = trialScore >= 5; // Need 5/10 to pass
    
    const result: TrialResult = {
      type: currentTrial.type,
      score: trialScore,
      passed,
    };

    setShowResult(true);
    
    setTimeout(() => {
      // Add result to gameState
      const updatedResults = [...gameState.trialResults, result];
      const allComplete = currentTrialIndex + 1 >= TRIAL_TYPES.length;
      
      setGameState({
        ...gameState,
        trialResults: updatedResults,
        trialsCompleted: allComplete,
        gameScreen: allComplete ? 'contract-offers' : gameState.gameScreen,
      });

      if (!allComplete) {
        setCurrentTrialIndex(currentTrialIndex + 1);
        setIsInTrial(false);
        setShowResult(false);
      }
    }, 2000);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isInTrial && !hasShot && attemptsLeft > 0) {
        e.preventDefault();
        handleShoot();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isInTrial, hasShot, attemptsLeft, powerLevel]);

  if (allTrialsComplete) {
    return (
      <div className="screen skill-trials-screen">
        {onReturnToMenu && (
          <button className="menu-escape" onClick={onReturnToMenu}>
            ← MENU
          </button>
        )}
        <div className="screen-header">
          <h2>TRIALS COMPLETE!</h2>
        </div>
        <p>Moving to contract offers...</p>
      </div>
    );
  }

  return (
    <div className="screen skill-trials-screen">
      {onReturnToMenu && (
        <button className="menu-escape" onClick={onReturnToMenu}>
          ← MENU
        </button>
      )}
      <div className="screen-header">
        <h2>⚽ BACKYARD TRIALS</h2>
        <p>Prove your skills to earn a contract</p>
      </div>

      {!isInTrial ? (
        <div className="trial-intro">
          <h3>{currentTrial.name}</h3>
          <p>{currentTrial.description}</p>
          <p className="trial-info">Score 5 out of 10 to pass this trial.</p>
          <button className="menu-btn primary" onClick={startTrial}>
            START TRIAL
          </button>
        </div>
      ) : (
        <div className="trial-active">
          {showResult ? (
            <div className="trial-result">
              <h3>
                {trialScore >= 5 ? '✅ PASSED!' : '❌ FAILED'}
              </h3>
              <p>You scored {trialScore} out of 10</p>
            </div>
          ) : (
            <>
              <canvas
                ref={canvasRef}
                width={600}
                height={350}
                style={{
                  border: '2px solid #4a90e2',
                  borderRadius: '8px',
                  background: '#1a2332',
                }}
              />
              <div className="trial-stats">
                <p>Score: {trialScore}/10</p>
                <p>Attempts Left: {attemptsLeft}</p>
                <p>Press SPACE to shoot (aim for green power!)</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
