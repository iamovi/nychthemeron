export type ConnectionStatus = 'disconnected' | 'creating' | 'waiting' | 'joining' | 'connected';

export type GameId = 'tic-tac-toe' | 'rock-paper-scissors' | 'connect-four' | 'chess' | 'snake' | 'pong' | 'word-guessing' | 'drawing-guessing' | 'trivia-battle' | 'memory-match' | 'checkers' | 'battleship' | '2048-battle' | 'typing-race' | 'ludo';

export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
  isMe: boolean;
}

export interface GameInfo {
  id: GameId;
  name: string;
  description: string;
}

export type PeerMessage =
  | { type: 'chat'; text: string; sender: string; timestamp: number; id: string }
  | { type: 'game-invite'; gameId: GameId }
  | { type: 'game-accept'; gameId: GameId }
  | { type: 'game-decline' }
  | { type: 'game-state'; gameId: GameId; state: any }
  | { type: 'typing'; isTyping: boolean }
  | { type: 'player-info'; name: string }
  | { type: 'leave-game' };

export interface GameProps {
  isHost: boolean;
  peerState: any;
  onSendState: (state: any) => void;
  onLeaveGame: () => void;
  myName: string;
  peerName: string;
}
