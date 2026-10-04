import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Copy, LogOut, MessageCircle, X, Volume2, VolumeX, AlertTriangle } from "lucide-react";
import { FrogLoader } from "@/components/ui/FrogLoader";
import { ConnectionStatus, GameId, ChatMessage } from '@/types/game';
import ChatPanel from './ChatPanel';
import GameSelector from './GameSelector';
import ErrorBoundary from './ErrorBoundary';
import TicTacToe from './games/TicTacToe';
import RockPaperScissors from './games/RockPaperScissors';
import ConnectFour from './games/ConnectFour';
import ChessGame from './games/ChessGame';
import SnakeGame from './games/SnakeGame';
import PongGame from './games/PongGame';
import WordGuessing from './games/WordGuessing';
import DrawingGuessing from './games/DrawingGuessing';
import TriviaBattle from './games/TriviaBattle';
import MemoryMatch from './games/MemoryMatch';
import CheckersGame from './games/CheckersGame';
import BattleshipGame from './games/BattleshipGame';
import Game2048 from './games/Game2048';
import TypingRace from './games/TypingRace';
import LudoGame from './games/LudoGame';
import { toast } from 'sonner';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface RoomViewProps {
  status: ConnectionStatus;
  roomCode: string;
  myName: string;
  peerName: string;
  messages: ChatMessage[];
  activeGame: GameId | null;
  gameState: any;
  pendingInvite: GameId | null;
  isInviter: boolean;
  peerTyping: boolean;
  isHost: boolean;
  peerDisconnected: boolean;
  sendChat: (text: string) => void;
  sendGameInvite: (gameId: GameId) => void;
  acceptGameInvite: () => void;
  declineGameInvite: () => void;
  sendGameState: (gameId: GameId, state: any) => void;
  sendTyping: (isTyping: boolean) => void;
  leaveGame: () => void;
  leaveRoom: () => void;
}

const GAME_NAMES: Record<GameId, string> = {
  'tic-tac-toe': 'Tic Tac Toe',
  'rock-paper-scissors': 'Rock Paper Scissors',
  'connect-four': 'Connect Four',
  'ludo': 'Ludo Battle',
  'chess': 'Chess',
  'snake': 'Snake',
  'pong': 'Pong',
  'word-guessing': 'Word Guessing',
  'drawing-guessing': 'Draw & Guess',
  'trivia-battle': 'Trivia Battle',
  'memory-match': 'Memory Match',
  'checkers': 'Checkers',
  'battleship': 'Battleship',
  '2048-battle': '2048 Battle',
  'typing-race': 'Typing Race',
};

const RoomView = (props: RoomViewProps) => {
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenCountRef = useRef(0);
  const { enabled: soundEnabled, toggle: toggleSound, play } = useSoundEffects();

  const {
    status, roomCode, myName, peerName, messages,
    activeGame, gameState, pendingInvite, isInviter,
    peerTyping, isHost, peerDisconnected,
    sendChat, sendGameInvite, acceptGameInvite,
    declineGameInvite, sendGameState, sendTyping,
    leaveGame, leaveRoom,
  } = props;

  // Track unread messages - only count incoming messages
  useEffect(() => {
    const incomingCount = messages.filter(m => !m.isMe).length;
    if (incomingCount > lastSeenCountRef.current) {
      setUnreadCount(prev => prev + (incomingCount - lastSeenCountRef.current));
      play('message');
    }
    lastSeenCountRef.current = incomingCount;
  }, [messages, play]);

  // Clear unread when chat is visible (desktop sidebar always visible on md+)
  const handleOpenChat = () => {
    setShowChat(true);
    setUnreadCount(0);
  };

  const handleCloseChat = () => {
    setShowChat(false);
  };

  // Clear unread on desktop where chat sidebar is always visible
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = () => { if (mq.matches) setUnreadCount(0); };
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [messages]);

  // Sound for peer events
  useEffect(() => {
    if (peerDisconnected) play('leave');
  }, [peerDisconnected, play]);

  useEffect(() => {
    if (pendingInvite && !isInviter) play('invite');
  }, [pendingInvite, isInviter, play]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Room code copied!');
    play('click');
  };

  const onSendState = useCallback((state: any) => {
    if (activeGame) sendGameState(activeGame, state);
  }, [activeGame, sendGameState]);

  const handleSendChat = useCallback((text: string) => {
    sendChat(text);
    play('click');
  }, [sendChat, play]);

  const handleSelectGame = useCallback((gameId: GameId) => {
    sendGameInvite(gameId);
    play('click');
  }, [sendGameInvite, play]);

  if (status === 'creating' || status === 'joining') {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="gum-card px-8 py-7 flex flex-col items-center gap-4">
          <FrogLoader className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Connecting...</span>
        </motion.div>
      </div>
    );
  }

  if (status === 'waiting') {
    return (
      <div className="flex h-full items-center justify-center p-4 sm:p-6 bg-background overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="gum-card text-center space-y-6 p-6 sm:p-8 w-full max-w-xl">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-primary">Waiting for a friend...</h2>
            <p className="text-sm text-muted-foreground">Share this code to invite someone</p>
          </div>
          <button
            onClick={copyRoomCode}
            className="gum-btn group inline-flex items-center gap-3 bg-card font-mono text-3xl sm:text-4xl tracking-[0.2em] px-6 py-4"
          >
            {roomCode}
            <Copy className="h-5 w-5 text-muted-foreground transition-colors" />
          </button>
          <div className="flex items-center justify-center gap-2 text-muted-foreground/60">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground/30" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground/50" />
            </span>
            <span className="text-sm">Listening for connections...</span>
          </div>
          <Button variant="outline" onClick={leaveRoom} className="gum-btn bg-card text-foreground">Cancel</Button>
        </motion.div>
      </div>
    );
  }

  const gameProps = {
    isHost,
    peerState: gameState,
    onSendState,
    onLeaveGame: leaveGame,
    myName,
    peerName,
  };

  const renderGame = () => {
    const GameComponent = {
      'tic-tac-toe': TicTacToe,
      'rock-paper-scissors': RockPaperScissors,
      'connect-four': ConnectFour,
      'chess': ChessGame,
      'snake': SnakeGame,
      'pong': PongGame,
      'word-guessing': WordGuessing,
      'drawing-guessing': DrawingGuessing,
      'trivia-battle': TriviaBattle,
      'memory-match': MemoryMatch,
      'checkers': CheckersGame,
      'battleship': BattleshipGame,
      '2048-battle': Game2048,
      'typing-race': TypingRace,
      'ludo': LudoGame,
    }[activeGame!];

    if (!GameComponent) return null;

    return (
      <ErrorBoundary key={activeGame}>
        <GameComponent {...gameProps} />
      </ErrorBoundary>
    );
  };

  return (
    <div className="relative flex h-full flex-col bg-background">
      <header className="flex items-center justify-between border-b-2 border-border px-4 py-2.5 bg-background shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={copyRoomCode}
            className="font-mono text-[11px] bg-secondary px-2.5 py-1 rounded-[3px] border-2 border-border hover:bg-accent transition-colors"
          >
            {roomCode}
          </button>
          <div className="flex items-center gap-1.5">
            <span className={`relative flex h-2 w-2`}>
              {!peerDisconnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success/50" />}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${peerDisconnected ? 'bg-destructive' : 'bg-success'}`} />
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <span className="font-bold text-foreground/90">{myName}</span>
          <span className="text-muted-foreground/50 text-xs">vs</span>
          <span className="font-bold text-foreground/90">{peerName || '...'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleSound} title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'} className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-[3px] border-2 border-transparent hover:border-border">
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden relative h-8 w-8 rounded-[3px] border-2 border-transparent hover:border-border" onClick={handleOpenChat}>
            <MessageCircle className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={leaveRoom} className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-[3px] border-2 border-transparent hover:border-border"><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      {/* Peer disconnected banner */}
      <AnimatePresence>
        {peerDisconnected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b-2 border-destructive/40 bg-destructive/10 overflow-hidden shrink-0"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive"><strong>{peerName}</strong> has left the room. You should leave too.</span>
              </div>
              <Button size="sm" variant="destructive" onClick={leaveRoom}>Leave Room</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingInvite && !isInviter && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b-2 border-border bg-secondary/40 overflow-hidden shrink-0">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm"><strong>{peerName}</strong> wants to play <strong>{GAME_NAMES[pendingInvite]}</strong></span>
              <div className="flex gap-2">
                <Button size="sm" onClick={acceptGameInvite} className="gum-btn bg-primary text-primary-foreground">Play</Button>
                <Button size="sm" variant="outline" onClick={declineGameInvite} className="gum-btn bg-card text-foreground">Decline</Button>
              </div>
            </div>
          </motion.div>
        )}
        {pendingInvite && isInviter && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b-2 border-border bg-secondary/40 overflow-hidden shrink-0">
            <div className="flex items-center justify-center gap-2 px-4 py-3">
              <FrogLoader className="h-4 w-4 " />
              <span className="text-sm">Waiting for {peerName} to accept {GAME_NAMES[pendingInvite]}...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden min-h-0">
        <main className="flex-1 overflow-auto">
          {activeGame ? renderGame() : <GameSelector onSelectGame={handleSelectGame} disabled={!!pendingInvite || peerDisconnected} />}
        </main>
        <aside className="hidden md:flex w-80 border-l-2 border-border flex-col min-h-0 bg-card">
          <ChatPanel messages={messages} onSendMessage={handleSendChat} peerTyping={peerTyping} onTyping={sendTyping} />
        </aside>
      </div>

      <AnimatePresence>
        {showChat && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="absolute inset-0 z-50 bg-background md:hidden flex flex-col border-t-2 border-border">
            <div className="flex items-center justify-between border-b-2 border-border px-4 py-2 shrink-0">
              <span className="font-medium text-sm">Chat</span>
              <Button variant="ghost" size="icon" onClick={handleCloseChat} className="rounded-[3px] border-2 border-transparent hover:border-border"><X className="h-4 w-4" /></Button>
            </div>
            <ChatPanel messages={messages} onSendMessage={handleSendChat} peerTyping={peerTyping} onTyping={sendTyping} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoomView;
