import { useEffect, useRef, useState } from 'react';
import { GameState, MatchEvent } from '@/lib/types';
import { evaluateMinigameSuccess } from '@/lib/gameEngine';

interface MinigameScreenProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onReturnToMenu?: () => void;
}

export default function MinigameScreen({ gameState, setGameState, onReturnToMenu }: MinigameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [powerLevel, setPowerLevel] = useState(0);
  const [isPowerBuilding, setIsPowerBuilding] = useState(true);
  const [hasShot, setHasShot] = useState(false);
  const animationRef = useRef<number | undefined>(undefined);

  const minigame = gameState.minigameState!;
  const isInjuryTime = gameState.matchState!.events[gameState.matchState!.events.length - 1]?.minute >= 90;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 600;
    canvas.height = 400;

    let power = 0;
    let direction = 1;
    const speed = isInjuryTime ? 0.03 : 0.02; // Faster in injury time

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = '#1a4d2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw pitch perspective lines (simple)
      ctx.strokeStyle = '#2d5a3d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(150, canvas.height);
      ctx.lineTo(0, 0);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(450, canvas.height);
      ctx.lineTo(canvas.width, 0);
      ctx.stroke();

      // Draw goal
      ctx.fillStyle = '#444';
      ctx.fillRect(150, 50, 300, 200);
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.strokeRect(150, 50, 300, 200);

      // Draw goal posts
      ctx.fillStyle = '#fff';
      ctx.fillRect(148, 50, 4, 200);
      ctx.fillRect(448, 50, 4, 200);
      ctx.fillRect(150, 48, 300, 4);

      // Draw player silhouette (rear view)
      if (!hasShot) {
        ctx.fillStyle = '#0066cc';
        ctx.beginPath();
        ctx.arc(300, 350, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.arc(300, 340, 15, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw ball
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(300, 320, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw power meter
      if (!hasShot && isPowerBuilding) {
        // Update power
        power += direction * speed;
        if (power >= 1) {
          power = 1;
          direction = -1;
        } else if (power <= 0) {
          power = 0;
          direction = 1;
        }
        setPowerLevel(power);

        // Draw power bar
        ctx.fillStyle = '#333';
        ctx.fillRect(50, canvas.height - 50, 200, 30);
        
        const powerColor = power > 0.8 ? '#ff4444' : power > 0.5 ? '#ffaa00' : '#44ff44';
        ctx.fillStyle = powerColor;
        ctx.fillRect(50, canvas.height - 50, 200 * power, 30);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, canvas.height - 50, 200, 30);

        // Sweet spot indicator
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(150, canvas.height - 50);
        ctx.lineTo(150, canvas.height - 20);
        ctx.stroke();
      }

      // Instructions
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      
      if (!hasShot) {
        ctx.fillText('PRESS SPACE TO SHOOT!', canvas.width / 2, canvas.height - 70);
        if (isInjuryTime) {
          ctx.fillStyle = '#ff4444';
          ctx.fillText('INJURY TIME - QUICK!', canvas.width / 2, canvas.height - 90);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPowerBuilding, hasShot, isInjuryTime]);

  const handleShoot = () => {
    if (hasShot) return;
    
    setHasShot(true);
    setIsPowerBuilding(false);

    // Evaluate the shot
    const result = evaluateMinigameSuccess(
      minigame.type,
      powerLevel,
      { x: 0.5, y: 0.5 }, // Simplified - just using power for now
      gameState.player
    );

    // Update match state
    const matchState = { ...gameState.matchState! };
    
    // Defensive: find the chance event we're responding to
    // Look backwards from displayedUpTo to find the last player chance
    let chanceMinute = 45; // Default fallback
    for (let i = matchState.displayedUpTo - 1; i >= 0; i--) {
      const event = matchState.events[i];
      if (event && event.playerInvolved && event.type === 'chance') {
        chanceMinute = event.minute;
        break;
      }
    }
    
    if (result.success) {
      // Goal!
      matchState.playerGoals += 1;
      if (matchState.isPlayerHome) {
        matchState.homeScore += 1;
      } else {
        matchState.awayScore += 1;
      }
      
      matchState.playerRating = Math.min(10, matchState.playerRating + 1.5);
      
      const newEvent: MatchEvent = {
        minute: chanceMinute,
        type: 'goal',
        description: `⚽ GOAL! ${gameState.player.name} ${result.quality === 'perfect' ? 'smashes it in!' : 'scores!'}`,
        playerInvolved: true,
      };
      matchState.events.push(newEvent);
    } else {
      matchState.playerRating = Math.max(1, matchState.playerRating - 0.5);
      
      const newEvent: MatchEvent = {
        minute: chanceMinute,
        type: 'miss',
        description: `${gameState.player.name} ${result.quality === 'poor' ? 'blazes it over!' : 'can\'t convert!'}`,
        playerInvolved: true,
      };
      matchState.events.push(newEvent);
    }

    // Return to match
    setTimeout(() => {
      setGameState({
        ...gameState,
        matchState,
        minigameState: null,
        gameScreen: 'match',
      });
    }, 1500);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !hasShot) {
        e.preventDefault();
        handleShoot();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [hasShot, powerLevel]);

  return (
    <div className="screen minigame-screen">
      {onReturnToMenu && (
        <button className="menu-escape" onClick={onReturnToMenu}>
          ← MENU
        </button>
      )}
      <div className="minigame-header">
        <h2>{minigame.type === 'penalty' ? '⚽ PENALTY!' : '⚽ YOUR CHANCE!'}</h2>
      </div>

      <canvas 
        ref={canvasRef}
        className="minigame-canvas"
      />

      <button 
        className="menu-btn primary shoot-btn" 
        onClick={handleShoot}
        disabled={hasShot}
      >
        {hasShot ? 'SHOOTING...' : 'SHOOT (SPACE)'}
      </button>
    </div>
  );
}
