import { Socket, Channel } from 'phoenix';
import { create } from 'zustand';

interface WebSocketStore {
  socket: Socket | null;
  channel: Channel | null;
  connected: boolean;
  playerName: string | null;
  groupName: string | null;
  connect: (playerName: string) => Promise<void>;
  disconnect: () => void;
  joinGroup: (groupName: string) => Promise<void>;
  leaveGroup: () => void;
  sendEvent: (event: string, payload: any) => Promise<any>;
}

const SOCKET_URL = 'ws://localhost:4000/socket';

export const useWebSocket = create<WebSocketStore>((set, get) => ({
  socket: null,
  channel: null,
  connected: false,
  playerName: null,
  groupName: null,

  connect: async (playerName: string) => {
    const socket = new Socket(SOCKET_URL, {
      params: { player_name: playerName }
    });

    socket.connect();

    await new Promise((resolve, reject) => {
      socket.onOpen(() => {
        set({ socket, connected: true, playerName });
        resolve(undefined);
      });

      socket.onError(() => reject(new Error('Failed to connect')));
    });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, channel: null, connected: false, playerName: null, groupName: null });
    }
  },

  joinGroup: async (groupName: string) => {
    const { socket } = get();
    if (!socket) throw new Error('Not connected');

    const channel = socket.channel(`group:${groupName}`, {
      player_name: get().playerName
    });

    await new Promise((resolve, reject) => {
      channel.join()
        .receive('ok', (response) => {
          set({ channel, groupName });
          resolve(response);
        })
        .receive('error', (error) => reject(error));
    });

    // Set up channel event listeners
    channel.on('players_list', (payload) => {
      // Handle players list update
      console.log('Players list:', payload);
    });

    channel.on('player_joined', (payload) => {
      // Handle new player
      console.log('Player joined:', payload);
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
    const { channel } = get();
    if (channel) {
      channel.leave();
      set({ channel: null, groupName: null });
    }
  },

  sendEvent: async (event: string, payload: any) => {
    const { channel } = get();
    if (!channel) throw new Error('Not in a group');

    return new Promise((resolve, reject) => {
      channel.push(event, payload)
        .receive('ok', resolve)
        .receive('error', reject);
    });
  },
}));

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
export const createLettersGame = (duration: number) => {
  return useWebSocket.getState().sendEvent('create_letters_game', { duration });
};

export const createNumbersGame = (duration: number, largeCount: number) => {
  return useWebSocket.getState().sendEvent('create_numbers_game', { duration, large_count: largeCount });
};

export const createConundrumGame = (duration: number) => {
  return useWebSocket.getState().sendEvent('create_conundrum_game', { duration });
};

export const submitAnswer = (gameId: number, value: string) => {
  return useWebSocket.getState().sendEvent('submit_answer', { game_id: gameId, value });
};

export const getWordDistribution = (gameId: number) => {
  return useWebSocket.getState().sendEvent('get_word_distribution', { game_id: gameId });
};

export const getAllWords = (gameId: number) => {
  return useWebSocket.getState().sendEvent('get_all_words', { game_id: gameId });
};

export const getNumberSolutions = (gameId: number) => {
  return useWebSocket.getState().sendEvent('get_number_solutions', { game_id: gameId });
};

export const getGameResults = (gameId: number) => {
  return useWebSocket.getState().sendEvent('get_game_results', { game_id: gameId });
};
