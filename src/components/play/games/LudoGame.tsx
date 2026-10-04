import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GameProps } from '@/types/game';
import { ArrowLeft, Dices, RotateCcw, Trophy } from 'lucide-react';
import { useConfetti } from '@/hooks/useConfetti';
import { useSoundEffects } from '@/hooks/useSoundEffects';

/* ===== Pure Game Logic (ported from lydo.html) ===== */
const BASE = -1;
const FINISH = 56;
const LOOP = 52;

const range = (a: number, b: number): number[] => {
  const out: number[] = [];
  if (a <= b) for (let i = a; i <= b; i++) out.push(i);
  else for (let i = a; i >= b; i--) out.push(i);
  return out;
};

const PATH: [number, number][] = [
  ...range(1, 5).map((c): [number, number] => [6, c]),
  ...range(5, 0).map((r): [number, number] => [r, 6]),
  [0, 7], [0, 8],
  ...range(1, 5).map((r): [number, number] => [r, 8]),
  ...range(9, 14).map((c): [number, number] => [6, c]),
  [7, 14], [8, 14],
  ...range(13, 9).map((c): [number, number] => [8, c]),
  ...range(9, 14).map((r): [number, number] => [r, 8]),
  [14, 7], [14, 6],
  ...range(13, 9).map((r): [number, number] => [r, 6]),
  ...range(5, 0).map((c): [number, number] => [8, c]),
  [7, 0], [6, 0],
];

const START = [0, 26]; // Red = 0, Yellow = 26
const SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

const BASE_SLOTS: [number, number][][] = [
  [[2, 2], [2, 3], [3, 2], [3, 3]],       // Red  (top-left)
  [[11, 11], [11, 12], [12, 11], [12, 12]], // Yellow (bottom-right)
];

const CENTER_SLOTS: [number, number][][] = [
  [[7, 6], [6, 6], [8, 6], [7, 6]],
  [[7, 8], [6, 8], [8, 8], [7, 8]],
];

const HOME_COLUMN: [number, number][][] = [
  range(1, 5).map((c): [number, number] => [7, c]),   // Red home stretch
  range(13, 9).map((c): [number, number] => [7, c]),  // Yellow home stretch
];

const cellOf = (player: number, index: number, p: number): [number, number] => {
  if (p === BASE) return BASE_SLOTS[player][index];
  if (p === FINISH) return CENTER_SLOTS[player][index];
  if (p <= 50) return PATH[(START[player] + p) % LOOP];
  return HOME_COLUMN[player][p - 51];
};

const loopIndex = (player: number, p: number): number | null =>
  p >= 0 && p <= 50 ? (START[player] + p) % LOOP : null;

interface LudoState {
  tokens: number[][];
  turn: number;
  dice: number | null;
  diceBy: number;
  awaiting: boolean;
  sixes: number;
  winner: number | null;
  scores: number[];
  event: string;
  eventBy: number;
  rollId: number;
}

const createGame = (starter = 0, scores = [0, 0]): LudoState => ({
  tokens: [[-1, -1, -1, -1], [-1, -1, -1, -1]],
  turn: starter, dice: null, diceBy: starter,
  awaiting: false, sixes: 0, winner: null,
  scores, event: '', eventBy: starter, rollId: 0,
});

const legalMoves = (state: LudoState, player: number, dice: number): number[] => {
  const moves: number[] = [];
  state.tokens[player].forEach((p, i) => {
    if (p === FINISH) return;
    if (p === BASE) { if (dice === 6) moves.push(i); return; }
    if (p + dice <= FINISH) moves.push(i);
  });
  return moves;
};

const other = (p: number) => (p === 0 ? 1 : 0);

const applyRoll = (state: LudoState, dice: number): LudoState => {
  const player = state.turn;
  const sixes = dice === 6 ? state.sixes + 1 : 0;
  const base = { ...state, dice, diceBy: player, rollId: state.rollId + 1, event: '', eventBy: player };
  if (sixes >= 3) return { ...base, sixes: 0, awaiting: false, turn: other(player), event: 'three-sixes' };
  if (legalMoves(state, player, dice).length === 0)
    return { ...base, sixes: 0, awaiting: false, turn: other(player), event: 'no-move' };
  return { ...base, sixes, awaiting: true };
};

const applyMove = (state: LudoState, tokenIndex: number): LudoState => {
  if (!state.awaiting || state.dice === null || state.winner !== null) return state;
  const player = state.turn;
  const dice = state.dice;
  if (!legalMoves(state, player, dice).includes(tokenIndex)) return state;
  const opp = other(player);
  const mine = [...state.tokens[player]];
  const theirs = [...state.tokens[opp]];
  const from = mine[tokenIndex];
  const to = from === BASE ? 0 : from + dice;
  mine[tokenIndex] = to;
  let captured = false;
  const cell = loopIndex(player, to);
  if (cell !== null && !SAFE.has(cell)) {
    theirs.forEach((q, i) => {
      if (loopIndex(opp, q) === cell) { theirs[i] = BASE; captured = true; }
    });
  }
  const finished = to === FINISH;
  const tokens = player === 0 ? [mine, theirs] : [theirs, mine];
  if (mine.every((p) => p === FINISH)) {
    const scores = [...state.scores]; scores[player] += 1;
    return { ...state, tokens, awaiting: false, winner: player, scores, event: 'finished', eventBy: player };
  }
  const extraTurn = dice === 6 || captured || finished;
  return {
    ...state, tokens, awaiting: false,
    turn: extraTurn ? player : opp,
    sixes: extraTurn ? state.sixes : 0,
    event: captured ? 'captured' : finished ? 'finished' : '',
    eventBy: player,
  };
};

/* ===== Board Rendering Constants ===== */
const SIZE = 15;
const PLAYER_COLORS = ['#ef4444', '#facc15'];
const PLAYER_COLORS_DARK = ['#b91c1c', '#d97706'];

const DICE_PIPS: Record<number, [number, number][]> = {
  1: [[2, 2]],
  2: [[1, 3], [3, 1]],
  3: [[1, 3], [2, 2], [3, 1]],
  4: [[1, 1], [1, 3], [3, 1], [3, 3]],
  5: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]],
  6: [[1, 1], [1, 3], [2, 1], [2, 3], [3, 1], [3, 3]],
};

const RealDice = ({ value, color, rolling }: { value: number | null; color: string; rolling: boolean }) => {
  const pips = value && DICE_PIPS[value] ? DICE_PIPS[value] : [];

  return (
    <div className="relative flex items-center justify-center select-none py-1 px-0.5">
      <div
        className={`relative w-14 h-14 bg-card border-2 border-border rounded-xl shadow-[2px_2px_0_theme(colors.border)] flex items-center justify-center overflow-hidden transition-all duration-200 ${
          rolling ? 'scale-105 border-primary' : 'scale-100 hover:scale-105'
        }`}
        aria-live="polite"
      >
        {value === null ? (
          <span className="text-3xl" style={{ color }}>🎲</span>
        ) : (
          <div className="grid grid-cols-3 grid-rows-3 w-10 h-10 p-0.5">
            {[1, 2, 3].map(r =>
              [1, 2, 3].map(c => {
                const hasPip = pips.some(([pr, pc]) => pr === r && pc === c);
                const isCenterOne = value === 1 && r === 2 && c === 2;
                return (
                  <div key={`${r}-${c}`} className="flex items-center justify-center">
                    {hasPip && (
                      <div
                        className="rounded-full transition-all duration-150"
                        style={{
                          width: isCenterOne ? '10px' : '7.5px',
                          height: isCenterOne ? '10px' : '7.5px',
                          backgroundColor: color,
                          boxShadow: `0 0 2px ${color}80`,
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ZONE_COLORS: Record<string, string> = {
  red: '#ef4444', green: '#22c55e', blue: '#3b82f6', yellow: '#facc15',
};

const quadrantOf = (r: number, c: number) => {
  if (r <= 5 && c <= 5) return 'red';
  if (r <= 5 && c >= 9) return 'green';
  if (r >= 9 && c <= 5) return 'blue';
  if (r >= 9 && c >= 9) return 'yellow';
  return null;
};

const PATH_INDEX = new Map(PATH.map(([r, c], i) => [`${r},${c}`, i]));

const START_ZONE: Record<number, string> = { 0: 'red', 13: 'green', 26: 'yellow', 39: 'blue' };

const HOME_ZONE = new Map<string, string>();
HOME_COLUMN[0].forEach(([r, c]) => HOME_ZONE.set(`${r},${c}`, 'red'));
HOME_COLUMN[1].forEach(([r, c]) => HOME_ZONE.set(`${r},${c}`, 'yellow'));
for (let r = 1; r <= 5; r++) HOME_ZONE.set(`${r},7`, 'green');
for (let r = 9; r <= 13; r++) HOME_ZONE.set(`${r},7`, 'blue');

// Yard slot cells (the 4 inner slots in each yard quadrant)
const SLOT_KEYS = new Set([
  '2,2', '2,3', '3,2', '3,3',         // Red yard
  '2,11', '2,12', '3,11', '3,12',     // Green yard
  '11,2', '11,3', '12,2', '12,3',     // Blue yard
  '11,11', '11,12', '12,11', '12,12', // Yellow yard
]);

const OFFSETS = [[-22, -22], [22, 22], [22, -22], [-22, 26]];

const mix = (color: string, pct: number) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/* ===== React Component ===== */
const LudoGame = ({ isHost, peerState, onSendState, onLeaveGame, myName, peerName }: GameProps) => {
  const myPlayer = isHost ? 0 : 1;

  const [game, setGame] = useState<LudoState>(() => createGame(0));
  const [rolling, setRolling] = useState(false);
  const [face, setFace] = useState(1);
  const rollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fireConfetti = useConfetti();
  const { play } = useSoundEffects();

  const prevRollIdRef = useRef<number>(0);
  const prevTurnRef = useRef<number>(0);

  // Sync incoming peer state
  useEffect(() => {
    if (peerState && Array.isArray(peerState.tokens)) {
      if (peerState.rollId !== prevRollIdRef.current || peerState.turn !== prevTurnRef.current) {
        if (peerState.turn !== myPlayer || peerState.awaiting) {
          play('move');
        }
        prevRollIdRef.current = peerState.rollId;
        prevTurnRef.current = peerState.turn;
      }
      setGame(peerState);
    }
  }, [peerState, myPlayer, play]);

  // Win/loss effects
  useEffect(() => {
    if (game.winner === myPlayer) { fireConfetti(); play('win'); }
    else if (game.winner !== null) play('lose');
  }, [game.winner]);

  const isMyTurn = game.winner === null && game.turn === myPlayer;

  const movableIndices = useMemo(() => {
    if (!game.awaiting || game.dice === null || game.winner !== null) return [];
    return legalMoves(game, game.turn, game.dice);
  }, [game]);

  const doRoll = useCallback(() => {
    if (rolling || game.awaiting || game.winner !== null || !isMyTurn) return;
    play('click');
    setRolling(true);
    let ticks = 0;
    rollTimerRef.current = setInterval(() => {
      ticks++;
      setFace(1 + Math.floor(Math.random() * 6));
      if (ticks >= 7) {
        clearInterval(rollTimerRef.current!);
        const finalDie = 1 + Math.floor(Math.random() * 6);
        setRolling(false);
        play('move');
        setGame(prev => {
          const next = applyRoll(prev, finalDie);
          onSendState(next);
          return next;
        });
      }
    }, 80);
  }, [rolling, game, isMyTurn, onSendState, play]);

  useEffect(() => () => { if (rollTimerRef.current) clearInterval(rollTimerRef.current); }, []);

  const handleTokenClick = (p: number, tokenIdx: number) => {
    if (p !== game.turn || !isMyTurn || !movableIndices.includes(tokenIdx)) return;
    play('move');
    setGame(prev => { const next = applyMove(prev, tokenIdx); onSendState(next); return next; });
  };

  const handleReset = () => {
    const next = createGame(0, game.scores);
    setGame(next); onSendState(next);
  };

  const nameOf = (p: number) => {
    if (p === 0) return isHost ? myName : peerName;
    return isHost ? peerName : myName;
  };

  const getStatusText = () => {
    if (game.winner !== null) return `${nameOf(game.winner)} wins! 🎉`;
    const who = nameOf(game.turn);
    const mine = game.turn === myPlayer;
    if (game.awaiting) return mine ? 'Pick a glowing token to move' : `${who} is choosing a token…`;
    return mine ? 'Your turn — roll the dice!' : `${who} is rolling…`;
  };

  const getEventText = () => {
    const who = nameOf(game.eventBy);
    switch (game.event) {
      case 'no-move': return `${who} had no legal move.`;
      case 'captured': return `💥 ${who} sent a token back to base! Bonus turn!`;
      case 'finished': return game.winner !== null ? '' : `🏠 ${who} got a token home!`;
      case 'three-sixes': return `⚠️ ${who} rolled three 6s — turn lost.`;
      default: return '';
    }
  };

  // Build grid cell data (memoised — never changes)
  const gridCells = useMemo(() => {
    const cells: { r: number; c: number; key: string }[] = [];
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        cells.push({ r, c, key: `${r},${c}` });
    return cells;
  }, []);

  // Token rendering info
  const tokenItems = useMemo(() => {
    const groups = new Map<string, { p: number; i: number; v: number; r: number; c: number }[]>();
    const items: { p: number; i: number; v: number; r: number; c: number }[] = [];
    for (const p of [0, 1]) {
      game.tokens[p].forEach((v, i) => {
        const [r, c] = cellOf(p, i, v);
        const it = { p, i, v, r, c };
        items.push(it);
        const k = `${r},${c}`;
        groups.set(k, [...(groups.get(k) ?? []), it]);
      });
    }
    return items.map(it => {
      const g = groups.get(`${it.r},${it.c}`) ?? [];
      const stacked = g.length > 1 && it.v !== BASE;
      const idxInGroup = g.indexOf(it);
      const [ox, oy] = stacked ? OFFSETS[idxInGroup % 4] : [0, 0];
      const canMove = it.p === game.turn && isMyTurn && movableIndices.includes(it.i);
      return { ...it, stacked, ox, oy, canMove };
    });
  }, [game, isMyTurn, movableIndices]);

  const currentFace = rolling ? face : game.dice;

  // Per-cell background/content — computed inline for correctness
  const getCellStyle = (r: number, c: number, key: string): {
    background: string;
    showStar: boolean;
    showRing: boolean;
    ringColor: string;
  } => {
    const quad = quadrantOf(r, c);

    if (quad) {
      const inner = (r % 9) >= 1 && (r % 9) <= 4 && (c % 9) >= 1 && (c % 9) <= 4;
      const bg = inner ? 'transparent' : mix(ZONE_COLORS[quad], 32);
      const showRing = SLOT_KEYS.has(key);
      return { background: bg, showStar: false, showRing, ringColor: mix(ZONE_COLORS[quad], 75) };
    }

    // Centre 3x3
    if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
      let z: string | null = null;
      if (c === 6) z = 'red';
      else if (c === 8) z = 'yellow';
      else if (r === 6 && c === 7) z = 'green';
      else if (r === 8 && c === 7) z = 'blue';
      return {
        background: z ? mix(ZONE_COLORS[z], 38) : 'rgba(128,128,128,0.15)',
        showStar: false, showRing: false, ringColor: '',
      };
    }

    // Home-column
    if (HOME_ZONE.has(key)) {
      return {
        background: mix(ZONE_COLORS[HOME_ZONE.get(key)!], 75),
        showStar: false, showRing: false, ringColor: '',
      };
    }

    // Main track
    if (PATH_INDEX.has(key)) {
      const idx = PATH_INDEX.get(key)!;
      if (START_ZONE[idx])
        return { background: mix(ZONE_COLORS[START_ZONE[idx]], 75), showStar: false, showRing: false, ringColor: '' };
      if (SAFE.has(idx))
        return { background: 'transparent', showStar: true, showRing: false, ringColor: '' };
      return { background: 'transparent', showStar: false, showRing: false, ringColor: '' };
    }

    return { background: 'transparent', showStar: false, showRing: false, ringColor: '' };
  };

  const CELL_PCT = 100 / SIZE; // 6.6667%

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto gap-3 p-2 sm:p-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full bg-card border-2 border-border rounded-lg p-2 shadow-[2px_2px_0_theme(colors.border)]">
        <Button variant="ghost" size="sm" onClick={onLeaveGame} className="gap-1 font-bold text-xs">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-1.5 font-black text-base">
          <Dices className="h-5 w-5 text-red-500" /> Ludo
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset}><RotateCcw className="h-4 w-4" /></Button>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-2 gap-2 w-full text-sm">
        {[0, 1].map(p => (
          <div
            key={p}
            className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
              game.turn === p && game.winner === null
                ? p === 0
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-amber-400 bg-amber-400/10'
                : 'border-border bg-card'
            }`}
          >
            <div
              className="h-3.5 w-3.5 rounded-full shrink-0 border-2 border-black/40"
              style={{ background: PLAYER_COLORS[p] }}
            />
            <div className="overflow-hidden">
              <p className={`text-xs font-bold truncate ${game.turn === p && game.winner === null ? 'text-foreground' : 'text-muted-foreground'}`}>
                {nameOf(p)} {p === myPlayer ? '(You)' : ''}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {game.tokens[p].filter(v => v === FINISH).length}/4 home · {game.scores[p]} win{game.scores[p] === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Status */}
      <p className="text-xs sm:text-sm font-bold text-center">{getStatusText()}</p>

      {/* 15×15 Ludo Board */}
      <div
        className="relative w-full border-2 border-border rounded-lg overflow-hidden bg-card shadow-[3px_3px_0_theme(colors.border)] transition-transform duration-500"
        style={{
          aspectRatio: '1 / 1',
          transform: myPlayer === 0 ? 'rotate(180deg)' : 'none',
        }}
      >
        {/* Grid cells */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${SIZE}, minmax(0, 1fr))`,
          }}
        >
          {gridCells.map(({ r, c, key }) => {
            const { background, showStar, showRing, ringColor } = getCellStyle(r, c, key);
            const isTrack = PATH_INDEX.has(key) || HOME_ZONE.has(key);
            return (
              <div
                key={key}
                style={{
                  background,
                  border: isTrack ? '1px solid rgba(128,128,128,0.15)' : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {showStar && (
                  <span style={{ fontSize: 'clamp(5px, 1.7vw, 9px)', color: '#fbbf24', lineHeight: 1, transform: myPlayer === 0 ? 'rotate(180deg)' : 'none' }}>★</span>
                )}
                {showRing && (
                  <span
                    style={{
                      display: 'block',
                      width: '70%',
                      height: '70%',
                      borderRadius: '50%',
                      border: `2px solid ${ringColor}`,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Tokens — absolutely positioned over the grid */}
        {tokenItems.map(it => {
          const leftPct = it.c * CELL_PCT;
          const topPct  = it.r * CELL_PCT;
          const sizePct = it.stacked ? '52%' : '76%';
          const translate = `translate(${it.ox}%, ${it.oy}%)`;

          return (
            <button
              key={`tok-${it.p}-${it.i}`}
              type="button"
              disabled={!it.canMove}
              onClick={() => handleTokenClick(it.p, it.i)}
              style={{
                position: 'absolute',
                left: `${leftPct}%`,
                top: `${topPct}%`,
                width: `${CELL_PCT}%`,
                height: `${CELL_PCT}%`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 0,
                padding: 0,
                margin: 0,
                cursor: it.canMove ? 'pointer' : 'default',
                zIndex: it.canMove ? 20 : 10,
                transition: 'left 0.35s cubic-bezier(.3,.8,.3,1), top 0.35s cubic-bezier(.3,.8,.3,1)',
              }}
            >
              <i
                style={{
                  display: 'block',
                  background: PLAYER_COLORS[it.p],
                  width: sizePct,
                  height: sizePct,
                  borderRadius: '50%',
                  border: '2px solid rgba(0,0,0,0.5)',
                  boxShadow: it.canMove
                    ? `0 0 0 2px #fff, 0 0 8px 2px ${PLAYER_COLORS[it.p]}`
                    : '0 1px 3px rgba(0,0,0,0.4)',
                  transform: translate,
                  transition: 'transform 0.35s',
                  animation: it.canMove ? 'ludo-pulse 0.9s ease-in-out infinite' : 'none',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes ludo-pulse { 0%, 100% { scale: 1; filter: brightness(1); } 50% { scale: 1.18; filter: brightness(1.35); } }
      `}</style>

      {/* Dice Row */}
      <div className="flex items-center gap-4">
        <RealDice value={currentFace} color={PLAYER_COLORS[game.turn]} rolling={rolling} />

        <Button
          onClick={() => {
            if (game.winner !== null) { handleReset(); return; }
            doRoll();
          }}
          disabled={game.winner === null && (rolling || game.awaiting || !isMyTurn)}
          size="lg"
          className="font-black px-6 border-2 border-border shadow-[2px_2px_0_theme(colors.border)]"
        >
          {game.winner !== null ? 'Play Again' : rolling ? 'Rolling…' : 'Roll Dice'}
        </Button>
      </div>

      {/* Event log */}
      <p className="text-xs text-muted-foreground text-center min-h-[1rem]">{getEventText()}</p>

      <p className="text-[10px] text-muted-foreground/60 text-center max-w-xs leading-tight">
        Roll a 6 to leave base · ★ and coloured start squares are safe · Extra turn on 6, capture, or reaching home · Three 6s = lose turn · Need exact roll to finish.
      </p>

      {/* Winner overlay */}
      <AnimatePresence>
        {game.winner !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <div className="gum-card p-6 flex flex-col items-center gap-4 text-center max-w-sm w-full">
              <Trophy className="h-12 w-12 text-amber-400 animate-bounce" />
              <div>
                <h3 className="text-xl font-black">
                  {game.winner === myPlayer ? 'YOU WIN! 🎉' : `${nameOf(game.winner)} Wins!`}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Scores — {nameOf(0)}: {game.scores[0]} · {nameOf(1)}: {game.scores[1]}
                </p>
              </div>
              <div className="flex gap-2 w-full">
                <Button onClick={handleReset} className="flex-1 font-bold">Play Again</Button>
                <Button variant="outline" onClick={onLeaveGame} className="flex-1">Leave</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LudoGame;
