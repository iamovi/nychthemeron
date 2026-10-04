import { motion } from 'framer-motion';
import { GameId } from '@/types/game';
import { Grid3X3, Hand, Circle, Crown, Zap, Minus, BookOpen, Pencil, Brain, Layers, CheckSquare, Ship, Hash, Keyboard, Dices } from 'lucide-react';

interface GameSelectorProps {
  onSelectGame: (gameId: GameId) => void;
  disabled: boolean;
}

const games: { id: GameId; name: string; description: string; icon: any; tag?: string }[] = [
  { id: 'tic-tac-toe', name: 'Tic Tac Toe', description: 'Classic 3×3 strategy', icon: Grid3X3, tag: 'Quick' },
  { id: 'rock-paper-scissors', name: 'Rock Paper Scissors', description: 'Best-of-5 showdown', icon: Hand, tag: 'Quick' },
  { id: 'connect-four', name: 'Connect Four', description: 'Drop & connect 4', icon: Circle, tag: 'Strategy' },
  { id: 'ludo', name: 'Ludo Battle', description: 'Classic board race to home', icon: Dices, tag: 'Strategy' },
  { id: 'chess', name: 'Chess', description: 'Full chess with legal moves', icon: Crown, tag: 'Strategy' },
  { id: 'checkers', name: 'Checkers', description: 'Jump & capture pieces', icon: CheckSquare, tag: 'Strategy' },
  { id: 'battleship', name: 'Battleship', description: 'Hunt enemy ships', icon: Ship, tag: 'Strategy' },
  { id: 'snake', name: 'Snake', description: 'Competitive two-snake battle', icon: Zap, tag: 'Action' },
  { id: 'pong', name: 'Pong', description: 'Classic paddle game', icon: Minus, tag: 'Action' },
  { id: '2048-battle', name: '2048 Battle', description: 'Race to the highest score', icon: Hash, tag: 'Action' },
  { id: 'typing-race', name: 'Typing Race', description: 'Who types fastest?', icon: Keyboard, tag: 'Action' },
  { id: 'word-guessing', name: 'Word Guessing', description: 'Hangman-style guessing', icon: BookOpen, tag: 'Party' },
  { id: 'drawing-guessing', name: 'Draw & Guess', description: 'Pictionary-style drawing', icon: Pencil, tag: 'Party' },
  { id: 'trivia-battle', name: 'Trivia Battle', description: 'Test your knowledge', icon: Brain, tag: 'Party' },
  { id: 'memory-match', name: 'Memory Match', description: 'Find matching pairs', icon: Layers, tag: 'Quick' },
];

const GameSelector = ({ onSelectGame, disabled }: GameSelectorProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6 gum-card p-4 w-full max-w-6xl"
      >
        <h2 className="text-2xl font-black mb-2 text-primary">Choose a Game</h2>
        <p className="text-sm text-muted-foreground">Select a game to invite your friend</p>
      </motion.div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 max-w-6xl w-full">
        {games.map((game, i) => (
          <motion.button
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            onClick={() => !disabled && onSelectGame(game.id)}
            disabled={disabled}
            className="group relative gum-card p-5 text-left transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-0 active:translate-y-0"
          >
            <div className="absolute top-3 right-3">
              <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-[3px] border border-border">
                {game.tag}
              </span>
            </div>
            <div className="h-10 w-10 rounded-[3px] bg-secondary border-2 border-border flex items-center justify-center mb-3">
              <game.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <h3 className="font-semibold text-sm mb-1 group-hover:text-foreground transition-colors">{game.name}</h3>
            <p className="text-xs text-muted-foreground/70">{game.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default GameSelector;
