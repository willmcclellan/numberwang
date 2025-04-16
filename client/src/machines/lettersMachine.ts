import { createMachine, assign, enqueueActions, log } from 'xstate';
import { Game } from '../lib/websocket';

interface PlayerSubmission {
  playerId: string;
  playerName: string;
  word: string;
  valid: boolean;
  score: number;
}

export interface LettersContext {
  letters?: string[];
  players: Player[];
  submissions: string[];
  wordLengthDistribution: Record<number, number>;
  possibleWords: string[];
  gameDuration: number;
  playerSubmissions?: PlayerSubmission[];
  winner?: {
    playerId: string;
    playerName: string;
    word: string;
    score: number;
  };
  showWordLengths: boolean;
  showPossibleWords: boolean;
  showResults: boolean;
}

interface Player {
  id: string;
  name: string;
  wordLength: number;
  word?: string;
}

interface Results {
  possibleWords: LettersContext['possibleWords'];
  wordLengthDistribution: LettersContext['wordLengthDistribution'];
  winner: LettersContext['winner'];
  playerSubmissions: LettersContext['playerSubmissions'];

}

export type LettersEvent =
  | { type: 'ADD_VOWEL' }
  | { type: 'ADD_CONSONANT' }
  | { type: 'RANDOM_FILL' }
  | { type: 'RESULTS'; results: Results }
  | { type: 'STARTED_GAME', game: Game }
  | { type: 'TIMER_COMPLETE' }
  | { type: 'TOGGLE_WORD_LENGTHS' }
  | { type: 'TOGGLE_POSSIBLE_WORDS' }
  | { type: 'TOGGLE_RESULTS' }
  | { type: 'TOGGLE_PLAYER_WORD'; playerId: string }
  | { type: 'SET_DURATION'; duration: number }
  | { type: 'SUBMIT'; submissions: string[] }
  | { type: 'RESET' };

const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const CONSONANTS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];

export const lettersMachine = createMachine({
  types: {} as {
    context: LettersContext;
    events: LettersEvent;
  },
  id: 'letters',
  initial: 'selecting',
  context: {
    letters: [],
    players: [],
    submissions: [],
    wordLengthDistribution: {},
    possibleWords: [],
    gameDuration: 30,
    showWordLengths: false,
    showPossibleWords: false,
    showResults:false,
  },
  states: {
    selecting: {
      initial: 'waiting',
      states: {
        waiting: {},
        checkLetters: {
          always: [
            {
              guard: ({ context }) => context.letters?.length === 9,
              target: '#letters.ready',
            },
            { target: 'waiting' }
          ]
        }
      },
      on: {
        ADD_VOWEL: {
          guard: ({ context }) => (context.letters?.length || 0) < 9,
          actions: assign({
            letters: ({ context }) => [
              ...(context.letters || []),
              VOWELS[Math.floor(Math.random() * VOWELS.length)]
            ]
          }),
          target: '.checkLetters'
        },
        ADD_CONSONANT: {
          guard: ({ context }) => (context.letters?.length || 0) < 9,
          actions: assign({
            letters: ({ context }) => [
              ...(context.letters || []),
              CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)]
            ]
          }),
          target: '.checkLetters'
        },
        RANDOM_FILL: {
          actions: assign({
            letters: () => {
              const letters = [];
              // Add 4 vowels
              for (let i = 0; i < 4; i++) {
                letters.push(VOWELS[Math.floor(Math.random() * VOWELS.length)]);
              }
              // Add 5 consonants
              for (let i = 0; i < 5; i++) {
                letters.push(CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)]);
              }
              // Shuffle the array
              return letters.sort(() => Math.random() - 0.5);
            }
          }),
          target: 'ready'
        },
        SET_DURATION: {
          actions: assign({
            gameDuration: ({ event }) => event.duration
          })
        },
        STARTED_GAME: {
          target: 'playing',
        },
      }
    },
    ready: {
      entry: ['startGame', log('Game ready')],
      on: {
        STARTED_GAME: {
          target: 'playing',
        }
      }
    },
    playing: {
      entry: [
        log('Game started'), 
        assign(({ event }) => {
          if (event.type !== 'STARTED_GAME') {
            throw new Error('Expected STARTED_GAME event');
          }
          return {
            letters: event.game.letters,
            duration: event.game.duration,
          }
        })
      ],
      on: {
        SUBMIT: {
          actions: enqueueActions(({ context, event, enqueue }) => {
            const prevSubmissions = context.submissions;
            const nextSubmissions = event.submissions;
            // diff the prev submissions with the new ones
            const newSubmissions = nextSubmissions.filter(submission => !prevSubmissions.includes(submission));

            enqueue(assign({
              submissions: ({ context }) => [...context.submissions, ...newSubmissions]
            }));

            for (const newSubmission of newSubmissions) {
              enqueue(log(`New submission: ${newSubmission}`));
              enqueue({ type: 'sendSubmission', params: { 
                submission: newSubmission,
              } });
            }
          }),
        },
        TIMER_COMPLETE: 'completed'
      }
    },
    completed: {
      entry: ['getGameResults', log('Game completed')],
      on: {
        RESULTS: {
          actions: assign(({ event }) => {
            const { wordLengthDistribution, possibleWords, playerSubmissions, winner } = event.results;
            return {
              wordLengthDistribution,
              possibleWords,
              playerSubmissions,
              winner,
            }
          })
        },
        TOGGLE_WORD_LENGTHS: {
          actions: assign({
            showWordLengths: ({ context }) => !context.showWordLengths
          })
        },
        TOGGLE_POSSIBLE_WORDS: {
          actions: assign({
            showPossibleWords: ({ context }) => !context.showPossibleWords
          })
        },
        TOGGLE_RESULTS: {
          actions: assign({
            showResults: ({ context }) => !context.showResults
          })
        },
        //TOGGLE_PLAYER_WORD: {
        //  actions: assign({
        //    players: ({ context, event }) => context.players.map(player =>
        //      player.id === event.playerId
        //        ? { ...player, word: player.word ? undefined : 'EXAMPLE' }
        //        : player
        //    )
        //  })
        //},
        RESET: {
          target: 'selecting',
          actions: assign({
            letters: [],
            showWordLengths: false,
            showPossibleWords: false,
            gameDuration: 30
          })
        }
      }
    }
  }
});
