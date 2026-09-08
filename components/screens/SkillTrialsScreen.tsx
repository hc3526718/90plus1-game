import { useState, useEffect, useRef } from 'react';
import { GameState, TrialType, TrialResult } from '@/lib/types';

interface SkillTrialsScreenProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onReturnToMenu?: () => void;
}

const TRIAL_TYPES: { type: TrialType; name: string; description: string }[] = [
  { type: 'volleys', name: 'Volleys', description: 'Hit the ball cleanly out of the air' },
  { type: 'headers', name: 'Headers', description: 'Time your header from crosses' },
  { type: 'penalties', name: 'Penalties', description: 'Score from the penalty spot' },
  { type: 'snap-shots', name: 'Snap Shots', description: 'Quick close-range finishing' },
  { type: 'free-kicks', name: 'Free Kicks', description: 'Beat the wall and score' },
  { type: 'through-balls', name: 'Through Balls', description: 'Weight your passes perfectly' },
];

export default function SkillTrialsScreen({ gameState, setGameState, onReturnToMenu }: SkillTrialsScreenProps) {
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [isInTrial, setIsInTrial] = useState(false);
  const [timing, setTiming] = useState(0); // 0-1 for timing bar position
  const [timingDirection, setTimingDirection] = useState(1);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [trialScore, setTrialScore] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(10);
  const [showResult, setShowResult] = useState(false);
  const [attemptFeedback, setAttemptFeedback] = useState('');
  const [ballAnimation, setBallAnimation] = useState<{x: number, y: number, visible: boolean}>({x: 0, y: 0, visible: false});
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const currentTrial = TRIAL_TYPES[currentTrialIndex];
  const allTrialsComplete = currentTrialIndex >= 3; // Only do first 3 for onboarding

  // TUTORIAL-FRIENDLY: Slow timing speed for career start
  const TIMING_SPEED = 0.008; // Slower than before for better learning

  useEffect(() => {
    if (!isInTrial || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw pitch scene based on trial type
      draw25DPitch(ctx, currentTrial.type);
      
      // Draw trial-specific elements
      switch (currentTrial.type) {
        case 'headers':
          drawHeadersCross(ctx, timing);
          break;
        case 'free-kicks':
          drawFreeKickWall(ctx);
          break;
        case 'through-balls':
          drawThroughBallSetup(ctx);
          break;
        case 'volleys':
          drawVolleySetup(ctx);
          break;
        case 'penalties':
          drawPenaltySetup(ctx);
          break;
        case 'snap-shots':
          drawSnapShotSetup(ctx);
          break;
      }

      // Draw ball animation if active
      if (ballAnimation.visible) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ballAnimation.x, ballAnimation.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Draw timing bar with OPTIMAL WINDOW (not just a line)
      if (!hasAttempted) {
        drawTimingBar(ctx, timing, currentTrial.type);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInTrial, timing, hasAttempted, currentTrial.type, ballAnimation]);

  // Timing bar animation
  useEffect(() => {
    if (!isInTrial || hasAttempted) return;

    const interval = setInterval(() => {
      setTiming(prev => {
        let next = prev + timingDirection * TIMING_SPEED;
        let newDirection = timingDirection;

        if (next >= 1) {
          next = 1;
          newDirection = -1;
        } else if (next <= 0) {
          next = 0;
          newDirection = 1;
        }

        if (newDirection !== timingDirection) {
          setTimingDirection(newDirection);
        }

        return next;
      });
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [isInTrial, hasAttempted, timingDirection]);

  // Helper: Draw 2.5D pitch background
  function draw25DPitch(ctx: CanvasRenderingContext2D, trialType: TrialType) {
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 150);
    skyGrad.addColorStop(0, '#4a90e2');
    skyGrad.addColorStop(1, '#2a5a8a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 600, 150);

    // Grass
    const grassGrad = ctx.createLinearGradient(0, 150, 0, 350);
    grassGrad.addColorStop(0, '#2d6b2d');
    grassGrad.addColorStop(1, '#1a4d1a');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, 150, 600, 200);

    // Crowd silhouettes
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    for (let i = 0; i < 20; i++) {
      const x = 30 + i * 27;
      const headSize = 12 + Math.sin(i) * 3;
      ctx.fillRect(x, 25, headSize, headSize);
      ctx.fillRect(x + headSize/4, 37, headSize/2, 15);
    }

    // Goal structure
    ctx.fillStyle = '#888';
    ctx.fillRect(195, 45, 8, 210);
    ctx.fillRect(397, 45, 8, 210);
    ctx.fillRect(195, 45, 210, 8);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(200, 50, 10, 200);
    ctx.fillRect(390, 50, 10, 200);
    ctx.fillRect(200, 50, 200, 10);

    // Net
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let x = 210; x < 390; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 60);
      ctx.lineTo(x, 250);
      ctx.stroke();
    }
  }

  function drawHeadersCross(ctx: CanvasRenderingContext2D, progress: number) {
    // Ball being crossed in from the right
    const crossX = 500 - progress * 200;
    const crossY = 180 + Math.sin(progress * Math.PI) * 80;
    
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(crossX, crossY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Player silhouette (ready to head)
    ctx.fillStyle = '#0066cc';
    ctx.fillRect(280, 220, 40, 50);
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.arc(300, 215, 15, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFreeKickWall(ctx: CanvasRenderingContext2D) {
    // Defensive wall (4 players)
    for (let i = 0; i < 4; i++) {
      const x = 220 + i * 40;
      ctx.fillStyle = '#cc0000';
      ctx.fillRect(x, 180, 30, 50);
      ctx.fillStyle = '#ffdbac';
      ctx.beginPath();
      ctx.arc(x + 15, 175, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ball at free kick spot
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(300, 260, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function drawThroughBallSetup(ctx: CanvasRenderingContext2D) {
    // Teammate making run (animated)
    const runProgress = (timing * 0.5) + 0.3;
    const teammateX = 300 + runProgress * 80;
    const teammateY = 200 - runProgress * 30;
    
    ctx.fillStyle = '#0066cc';
    ctx.fillRect(teammateX - 15, teammateY, 30, 40);
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.arc(teammateX, teammateY - 5, 10, 0, Math.PI * 2);
    ctx.fill();

    // Defender
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(340, 190, 25, 40);
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.arc(352, 185, 10, 0, Math.PI * 2);
    ctx.fill();

    // Ball at feet
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(280, 280, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function drawVolleySetup(ctx: CanvasRenderingContext2D) {
    // Ball dropping
    const ballY = 150 + timing * 100;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(300, ballY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function drawPenaltySetup(ctx: CanvasRenderingContext2D) {
    // Goalkeeper
    const gkX = 300 + Math.sin(timing * Math.PI * 2) * 40;
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(gkX - 20, 100, 40, 60);
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.arc(gkX, 95, 15, 0, Math.PI * 2);
    ctx.fill();

    // Ball at penalty spot
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(300, 280, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function drawSnapShotSetup(ctx: CanvasRenderingContext2D) {
    // Close range - ball bouncing
    const bounce = Math.abs(Math.sin(timing * Math.PI * 4)) * 20;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(300, 240 - bounce, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function drawTimingBar(ctx: CanvasRenderingContext2D, position: number, trialType: TrialType) {
    // Background
    ctx.fillStyle = '#222';
    ctx.fillRect(150, 310, 300, 30);
    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 3;
    ctx.strokeRect(150, 310, 300, 30);

    // OPTIMAL WINDOW (not just a line!)
    const windowStart = 0.4;
    const windowEnd = 0.6;
    const windowWidth = windowEnd - windowStart;
    
    ctx.fillStyle = 'rgba(68, 255, 68, 0.3)';
    ctx.fillRect(150 + windowStart * 300, 310, windowWidth * 300, 30);
    
    // Window borders
    ctx.strokeStyle = '#44ff44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150 + windowStart * 300, 310);
    ctx.lineTo(150 + windowStart * 300, 340);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(150 + windowEnd * 300, 310);
    ctx.lineTo(150 + windowEnd * 300, 340);
    ctx.stroke();

    // Moving indicator
    ctx.fillStyle = '#fff';
    ctx.fillRect(150 + position * 300 - 3, 308, 6, 34);

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('RELEASE IN GREEN WINDOW', 300, 305);
  }

  const startTrial = () => {
    setIsInTrial(true);
    setTiming(0);
    setTimingDirection(1);
    setHasAttempted(false);
    setTrialScore(0);
    setAttemptsLeft(10);
    setShowResult(false);
    setAttemptFeedback('');
    setBallAnimation({x: 0, y: 0, visible: false});
  };

  const handleAttempt = () => {
    if (hasAttempted || attemptsLeft <= 0) return;
    
    setHasAttempted(true);

    // Evaluate based on timing window (0.4 to 0.6 is optimal)
    const windowStart = 0.4;
    const windowEnd = 0.6;
    const inWindow = timing >= windowStart && timing <= windowEnd;
    
    let success = false;
    let quality = 'miss';

    if (inWindow) {
      success = true;
      const windowCenter = 0.5;
      const distanceFromCenter = Math.abs(timing - windowCenter);
      
      if (distanceFromCenter < 0.05) {
        quality = 'perfect';
      } else if (distanceFromCenter < 0.1) {
        quality = 'good';
      } else {
        quality = 'ok';
      }
    }

    if (success) {
      setTrialScore(prev => prev + 1);
      setAttemptFeedback(`✅ ${quality.toUpperCase()}! Released at ${(timing * 100).toFixed(0)}%`);
      animateGoal();
    } else {
      setAttemptFeedback(`❌ MISS! Released at ${(timing * 100).toFixed(0)}% (aim for green window)`);
      animateMiss();
    }

    // Reset for next attempt
    setTimeout(() => {
      const newAttemptsLeft = attemptsLeft - 1;
      setAttemptsLeft(newAttemptsLeft);
      
      if (newAttemptsLeft > 0) {
        setHasAttempted(false);
        setTiming(0);
        setTimingDirection(1);
        setAttemptFeedback('');
        setBallAnimation({x: 0, y: 0, visible: false});
      } else {
        finishTrial();
      }
    }, 2000);
  };

  const animateGoal = () => {
    // Simple goal animation
    setBallAnimation({x: 300, y: 120, visible: true});
  };

  const animateMiss = () => {
    // Ball goes wide/over
    const missDirection = timing < 0.4 ? -1 : 1;
    setBallAnimation({x: 300 + missDirection * 100, y: 80, visible: true});
  };

  const finishTrial = () => {
    const passed = trialScore >= 5;
    
    const result: TrialResult = {
      type: currentTrial.type,
      score: trialScore,
      passed,
    };

    setShowResult(true);
    
    setTimeout(() => {
      const updatedResults = [...gameState.trialResults, result];
      const allComplete = currentTrialIndex + 1 >= 3; // Only 3 trials for onboarding
      
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
    }, 2500);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isInTrial && !hasAttempted && attemptsLeft > 0) {
        e.preventDefault();
        handleAttempt();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isInTrial, hasAttempted, attemptsLeft, timing]);

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
          <p className="trial-tip">💡 Release in the GREEN WINDOW for success</p>
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
                {attemptFeedback && <p className="attempt-feedback">{attemptFeedback}</p>}
                <p className="trial-instruction">Press SPACE in the green window!</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
