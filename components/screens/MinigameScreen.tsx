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
      // Sky gradient (Flash-era)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 150);
      skyGrad.addColorStop(0, '#4a90e2');
      skyGrad.addColorStop(1, '#2a5a8a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, 150);

      // Grass pitch with perspective gradient
      const grassGrad = ctx.createLinearGradient(0, 150, 0, canvas.height);
      grassGrad.addColorStop(0, '#2d6b2d');
      grassGrad.addColorStop(0.5, '#1a4d1a');
      grassGrad.addColorStop(1, '#2d6b2d');
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, 150, canvas.width, canvas.height - 150);

      // Pitch perspective lines (rear view)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(150, canvas.height);
      ctx.lineTo(0, 100);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(450, canvas.height);
      ctx.lineTo(canvas.width, 100);
      ctx.stroke();

      // Crowd silhouettes (chunky Flash style)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      for (let i = 0; i < 20; i++) {
        const x = 10 + i * 29;
        const headSize = 10 + Math.sin(i * 0.5) * 3;
        ctx.fillRect(x, 20, headSize, headSize);
        ctx.fillRect(x + headSize/4, 30, headSize/2, 12);
      }

      // Goal structure with depth
      // Back net support
      ctx.fillStyle = '#555';
      ctx.fillRect(145, 45, 310, 210);
      
      // Net pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      for (let x = 150; x < 450; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 50);
        ctx.lineTo(x, 250);
        ctx.stroke();
      }
      for (let y = 50; y < 250; y += 30) {
        ctx.beginPath();
        ctx.moveTo(150, y);
        ctx.lineTo(450, y);
        ctx.stroke();
      }
      
      // Goal frame (main posts)
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 5;
      ctx.strokeRect(150, 50, 300, 200);

      // Posts with depth/shadow
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(148, 50, 6, 200); // Left post
      ctx.fillRect(446, 50, 6, 200); // Right post
      ctx.fillRect(150, 48, 300, 6); // Crossbar
      
      // Post shadows
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(154, 54, 3, 196);
      ctx.fillRect(452, 54, 3, 196);

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

      // Draw power meter (chunky Flash UI)
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

        // Power bar background
        ctx.fillStyle = '#222';
        ctx.fillRect(45, canvas.height - 55, 210, 40);
        ctx.strokeStyle = '#4a90e2';
        ctx.lineWidth = 3;
        ctx.strokeRect(45, canvas.height - 55, 210, 40);
        
        // Power fill with gradient
        const powerColor = power > 0.8 ? '#ff4444' : power > 0.5 ? '#ffaa00' : '#44ff44';
        const powerEndColor = power > 0.8 ? '#cc0000' : power > 0.5 ? '#ff8800' : '#00cc00';
        const powerGrad = ctx.createLinearGradient(50, 0, 50 + 200 * power, 0);
        powerGrad.addColorStop(0, powerColor);
        powerGrad.addColorStop(1, powerEndColor);
        ctx.fillStyle = powerGrad;
        ctx.fillRect(50, canvas.height - 50, 200 * power, 30);

        // Sweet spot indicator (green zone)
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(150, canvas.height - 55);
        ctx.lineTo(150, canvas.height - 15);
        ctx.stroke();

        // Power label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('POWER', 150, canvas.height - 60);
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
