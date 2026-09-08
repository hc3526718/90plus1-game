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

    // 2.5D Flash-era pitch animation
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 150);
      skyGrad.addColorStop(0, '#4a90e2');
      skyGrad.addColorStop(1, '#2a5a8a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, 150);

      // Grass pitch with perspective
      const grassGrad = ctx.createLinearGradient(0, 150, 0, 270);
      grassGrad.addColorStop(0, '#2d6b2d');
      grassGrad.addColorStop(1, '#1a4d1a');
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, 150, canvas.width, 120);

      // Pitch lines (perspective)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      // Goal area box
      ctx.strokeRect(150, 180, 300, 80);
      // 6-yard box
      ctx.strokeRect(220, 210, 160, 50);

      // Crowd silhouettes behind goal (chunky Flash style)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      for (let i = 0; i < 20; i++) {
        const x = 30 + i * 27;
        const headSize = 12 + Math.sin(i) * 3;
        // Head
        ctx.fillRect(x, 25, headSize, headSize);
        // Body
        ctx.fillRect(x + headSize/4, 37, headSize/2, 15);
      }

      // Goal structure (rear view with depth)
      // Back support bars
      ctx.fillStyle = '#888';
      ctx.fillRect(45, 45, 8, 210); // Left back post
      ctx.fillRect(547, 45, 8, 210); // Right back post
      ctx.fillRect(45, 45, 510, 8); // Back crossbar

      // Main goalposts (front, brighter)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(50, 50, 10, 200); // Left post
      ctx.fillRect(540, 50, 10, 200); // Right post
      ctx.fillRect(50, 50, 500, 10); // Crossbar

      // Post shadows for depth
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(60, 55, 4, 195);
      ctx.fillRect(550, 55, 4, 195);

      // Net pattern (diamond mesh)
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

      // Power bar (chunky Flash UI)
      ctx.fillStyle = '#222';
      ctx.fillRect(195, 275, 210, 40);
      ctx.strokeStyle = '#4a90e2';
      ctx.lineWidth = 3;
      ctx.strokeRect(195, 275, 210, 40);
      
      // Power level indicator with gradient
      const powerColor = powerLevel < 30 ? '#ff4444' : powerLevel < 70 ? '#44ff44' : '#ff4444';
      const powerGrad = ctx.createLinearGradient(200, 0, 200 + powerLevel * 2, 0);
      powerGrad.addColorStop(0, powerColor);
      powerGrad.addColorStop(1, powerLevel < 30 ? '#cc0000' : powerLevel < 70 ? '#00cc00' : '#cc0000');
      ctx.fillStyle = powerGrad;
      ctx.fillRect(200, 280, powerLevel * 2, 30);

      // Power bar label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('POWER', 300, 270);

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
