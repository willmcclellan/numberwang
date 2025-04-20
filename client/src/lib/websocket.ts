import { Socket, Channel } from 'phoenix';
import { create } from 'zustand';
import { persist } from 'zustand/middleware'

export interface Game {
  id: string;
  game_type: 'letters' | 'numbers' | 'conundrum';
  duration: number;
  letters?: string[];
  numbers?: number[];
  target?: number;
  started_at: string;
  group_id: number;
}

export interface Player {
  id: string;
  name: string;
  //active: boolean;
  //points: number;
}

interface WebSocketStore {
  _socket: Socket | null;
  _channel: Channel | null;
  _connected: boolean;
  playerName: string | null;
  players: Player[];
  groupId: number | null;
  groupName: string | null;
  games: Record<string, any>; // TODO Replace with actual game type
  connect: (playerName: string) => Promise<void>;
  disconnect: () => void;
  joinGroup: (groupName: string) => Promise<void>;
  leaveGroup: () => void;
  sendEvent: (event: string, payload: any) => Promise<any>;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:4000/socket';

export const useWebSocket = create<WebSocketStore>()(persist(
  (set, get) => ({
    _socket: null,
    _channel: null,
    _connected: false,
    players: [],
    playerName: null,
    groupId: null,
    groupName: null,
    games: {},

    connect: async (playerName: string) => {
      const socket = new Socket(SOCKET_URL, {
        params: { player_name: playerName }
      });

      socket.connect();

      await new Promise((resolve, reject) => {
        socket.onOpen(() => {
          set({ _socket: socket, _connected: true, playerName });
          resolve(undefined);
        });

        socket.onError(() => reject(new Error('Failed to connect')));
      });
    },

    disconnect: () => {
      const { _socket: socket } = get();
      console.debug('Disconnecting from socket');
      if (socket) {
        socket.disconnect();
      }

      set({ _socket: null, _channel: null, _connected: false, playerName: null, groupId: null, groupName: null });
    },

    joinGroup: async (groupId: string) => {
      const { _socket: socket } = get();
      if (!socket) throw new Error('Not connected');

      const channel = socket.channel(`group:${groupId}`, {
        player_name: get().playerName,
      });

      await new Promise((resolve, reject) => {
        channel.join()
          .receive('ok', (response) => {
            console.debug('Joined group:', response);
            set({ _channel: channel, groupName: response.group.name, groupId: response.group.id });
            resolve(response);
          })
          .receive('error', (error) => reject(error));
      });

      // Set up channel event listeners
      channel.on('players_list', (payload) => {
        // Handle players list update
        console.debug('Players list:', payload);
        set({ players: payload.players });
      });

      channel.on('player_joined', (payload) => {
        // Handle new player
        console.log('Player joined:', payload);
      });

      channel.on('game_created', (payload) => {
        // Handle game create
        const { games } = get();
        games[payload.game.id] = payload.game;
        set({ games });
      });

      channel.on('game_started', (payload) => {
        // Handle game start
        console.log('Game started:', payload);
      });

      channel.on('new_submission', (payload) => {
        // Handle new submission
        console.log('New submission:', payload);
      });

      channel.on('game_ended', (payload) => {
        // Handle game end
        console.log('Game ended:', payload);
      });
    },

    leaveGroup: () => {
      const { _channel: channel } = get();
      if (channel) {
        channel.leave();
        set({ _channel: null, groupId: null, groupName: null });
      }
    },

    sendEvent: async (event: string, payload: any) => {
      console.debug('Sending event:', event, payload);
      const { _channel: channel } = get();
      if (!channel) throw new Error('Not in a group');

      return new Promise((resolve, reject) => {
        channel.push(event, payload)
          .receive('ok', resolve)
          .receive('error', reject);
      });
    },
  }),
  { 
    name: 'websocket-store', 
    partialize: state => {
      return { 
        ...state, 
        // NOTE don't persist non-serializable or in-memory values
        _socket: null, 
        _channel: null, 
        _connected: false 
      }
    },
  },
));

// Types for game events
export interface GameStartedPayload {
  game: {
    id: number;
    game_type: 'letters' | 'numbers' | 'conundrum';
    duration: number;
    letters?: string[];
    numbers?: number[];
    target?: number;
    started_at: string;
    group_id: number;
  };
}

export interface SubmissionPayload {
  player_id: number;
  value: string;
  valid: boolean;
  score: number;
}

export interface GameEndedPayload {
  game_id: number;
  results: {
    game_id: number;
    game_type: string;
    winner: {
      player_id: number;
      player_name: string;
      value: string;
      score: number;
    };
    submissions: SubmissionPayload[];
  };
}

export interface WordDistributionPayload {
  distribution: Record<string, number>;
}

export interface AllWordsPayload {
  words: string[];
}

// Game-specific helper functions
export const createGame = (gameType: 'letters' | 'numbers' | 'conundrum') => {
  return useWebSocket.getState().sendEvent(`create_${gameType}_game`, {});
}

export const startLettersGame = (gameId: string, letters: string[], duration: number) => {
  return useWebSocket.getState().sendEvent('start_game', { game_id: gameId, options: { letters, duration } });
};

//export const createNumbersGame = (duration: number, largeCount: number) => {
//  return useWebSocket.getState().sendEvent('create_numbers_game', { duration, large_count: largeCount });
//};
//
//export const createConundrumGame = (duration: number) => {
//  return useWebSocket.getState().sendEvent('create_conundrum_game', { duration });
//};

export const submitAnswer = (gameId: string, value: string) => {
  return useWebSocket.getState().sendEvent('submit_answer', { game_id: gameId, value });
};

//export const getWordDistribution = (gameId: string) => {
//  return useWebSocket.getState().sendEvent('get_word_distribution', { game_id: gameId });
//};
//
//export const getAllWords = (gameId: string) => {
//  return useWebSocket.getState().sendEvent('get_all_words', { game_id: gameId });
//};
//
export const getNumberSolutions = (gameId: string) => {
  return useWebSocket.getState().sendEvent('get_number_solutions', { game_id: gameId });
};

export const getGameResults = <T>(gameId: string): Promise<{ results: T }> => {
  return useWebSocket.getState().sendEvent('get_game_results', { game_id: gameId });
};
