import { createMachine, assign, log } from 'xstate';

export interface LettersContext {
  letters: string[];
  players: Player[];
  guesses: string[];
  wordLengthDistribution: Record<number, number>;
  possibleWords: string[];
  gameDuration: number;
  showWordLengths: boolean;
  showPossibleWords: boolean;
}

interface Player {
  id: string;
  name: string;
  wordLength: number;
  word?: string;
}

type LettersEvent =
  | { type: 'ADD_VOWEL' }
  | { type: 'ADD_CONSONANT' }
  | { type: 'RANDOM_FILL' }
  | { type: 'STARTED_GAME' }
  | { type: 'TIMER_COMPLETE' }
  | { type: 'TOGGLE_WORD_LENGTHS' }
  | { type: 'TOGGLE_POSSIBLE_WORDS' }
  | { type: 'TOGGLE_PLAYER_WORD'; playerId: string }
  | { type: 'SET_DURATION'; duration: number }
  | { type: 'RESET' };

const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const CONSONANTS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];

export const lettersMachine = createMachine({
  id: 'letters',
  initial: 'selecting',
  context: {
    letters: [],
    players: [],
    guesses: [],
    wordLengthDistribution: {},
    possibleWords: [],
    gameDuration: 30,
    showWordLengths: false,
    showPossibleWords: false,
  } as LettersContext,
  states: {
    selecting: {
      initial: 'waiting',
      states: {
        waiting: {},
        checkLetters: {
          always: [
            {
              guard: ({ context }) => context.letters.length === 9,
              target: '#letters.ready',
            },
            { target: 'waiting' }
          ]
        }
      },
      on: {
        ADD_VOWEL: {
          guard: ({ context }) => context.letters.length < 9,
          actions: assign({
            letters: ({ context }) => [
              ...context.letters,
              VOWELS[Math.floor(Math.random() * VOWELS.length)]
            ]
          }),
          target: '.checkLetters'
        },
        ADD_CONSONANT: {
          guard: ({ context }) => context.letters.length < 9,
          actions: assign({
            letters: ({ context }) => [
              ...context.letters,
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
        }
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
      entry: [log('Game started')],
      // TODO this might need two phases, one to trigger the startGame event
      // and two to wait for the websocket response until actually starting
      // the clock? 
      on: {
        TIMER_COMPLETE: 'completed'
      }
    },
    completed: {
      entry: [log('Game completed')],
      on: {
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
        TOGGLE_PLAYER_WORD: {
          actions: assign({
            players: ({ context, event }) => context.players.map(player =>
              player.id === event.playerId
                ? { ...player, word: player.word ? undefined : 'EXAMPLE' }
                : player
            )
          })
        },
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
