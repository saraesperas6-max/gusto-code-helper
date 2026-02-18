import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Heart, Star, Sun, Moon, Cloud, Flower2, TreePine, Mountain, Fish, Bird, Bug, Cat, Dog, Flame, Droplets, Snowflake, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CaptchaProps {
  onVerified: (verified: boolean) => void;
}

const ALL_ICONS = [
  { icon: Heart, name: 'heart' },
  { icon: Star, name: 'star' },
  { icon: Sun, name: 'sun' },
  { icon: Moon, name: 'moon' },
  { icon: Cloud, name: 'cloud' },
  { icon: Flower2, name: 'flower' },
  { icon: TreePine, name: 'tree' },
  { icon: Mountain, name: 'mountain' },
  { icon: Fish, name: 'fish' },
  { icon: Bird, name: 'bird' },
  { icon: Bug, name: 'bug' },
  { icon: Cat, name: 'cat' },
  { icon: Dog, name: 'dog' },
  { icon: Flame, name: 'fire' },
  { icon: Droplets, name: 'water' },
  { icon: Snowflake, name: 'snowflake' },
  { icon: Zap, name: 'lightning' },
];

const DISPLAY_NAMES: Record<string, string> = {
  heart: '❤️ Hearts',
  star: '⭐ Stars',
  sun: '☀️ Suns',
  moon: '🌙 Moons',
  cloud: '☁️ Clouds',
  flower: '🌸 Flowers',
  tree: '🌲 Trees',
  mountain: '⛰️ Mountains',
  fish: '🐟 Fish',
  bird: '🐦 Birds',
  bug: '🐛 Bugs',
  cat: '🐱 Cats',
  dog: '🐶 Dogs',
  fire: '🔥 Fires',
  water: '💧 Water drops',
  snowflake: '❄️ Snowflakes',
  lightning: '⚡ Lightning bolts',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generatePuzzle() {
  const shuffled = shuffle(ALL_ICONS);
  const target = shuffled[0];
  // Pick 2-3 target icons + fill rest with others to make a 3x3 grid
  const targetCount = Math.floor(Math.random() * 2) + 2; // 2 or 3
  const others = shuffled.slice(1, 1 + (9 - targetCount));
  const grid = shuffle([
    ...Array(targetCount).fill(null).map((_, i) => ({ ...target, id: `t${i}` })),
    ...others.map((o, i) => ({ ...o, id: `o${i}` })),
  ]).slice(0, 9);

  const correctIds = new Set(grid.filter(g => g.name === target.name).map(g => g.id));
  return { grid, targetName: target.name, correctIds };
}

const Captcha: React.FC<CaptchaProps> = ({ onVerified }) => {
  const [puzzle, setPuzzle] = useState(generatePuzzle);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const refresh = useCallback(() => {
    setPuzzle(generatePuzzle());
    setSelected(new Set());
    setSubmitted(false);
    setIsCorrect(false);
    onVerified(false);
  }, [onVerified]);

  const toggleSelect = (id: string) => {
    if (submitted) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleVerify = () => {
    const correct =
      selected.size === puzzle.correctIds.size &&
      [...selected].every(id => puzzle.correctIds.has(id));
    setSubmitted(true);
    setIsCorrect(correct);
    onVerified(correct);
  };

  if (submitted && isCorrect) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-input p-3 bg-muted/30">
        <span className="text-sm font-medium text-primary">✓ Captcha Verified</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-input p-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Select all {DISPLAY_NAMES[puzzle.targetName]}
        </Label>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={refresh} title="New puzzle">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {puzzle.grid.map((item) => {
          const Icon = item.icon;
          const isSelected = selected.has(item.id);
          const isTarget = puzzle.correctIds.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleSelect(item.id)}
              className={cn(
                'flex items-center justify-center h-14 rounded-md border-2 transition-all',
                submitted && isTarget && isSelected && 'border-green-500 bg-green-500/10',
                submitted && isTarget && !isSelected && 'border-red-500 bg-red-500/10',
                submitted && !isTarget && isSelected && 'border-red-500 bg-red-500/10',
                submitted && !isTarget && !isSelected && 'border-transparent bg-background',
                !submitted && isSelected && 'border-primary bg-primary/10',
                !submitted && !isSelected && 'border-transparent bg-background hover:bg-accent',
              )}
            >
              <Icon className="h-6 w-6 text-foreground" />
            </button>
          );
        })}
      </div>
      {!submitted ? (
        <Button type="button" variant="secondary" size="sm" className="w-full" onClick={handleVerify} disabled={selected.size === 0}>
          Verify
        </Button>
      ) : (
        <p className="text-xs text-center text-destructive font-medium">✗ Incorrect — try again</p>
      )}
    </div>
  );
};

export default Captcha;
