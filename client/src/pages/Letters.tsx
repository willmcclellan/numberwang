import { useEffect, useState } from 'react';
import { Shuffle, Eye, EyeOff } from 'lucide-react';
import { useDebounce } from 'react-use'
import { useMachine } from '@xstate/react';
import { lettersMachine } from '../machines/lettersMachine';
import AnalogClock from '../components/AnalogClock';
import Toggle from '../components/Toggle';
import { useWebSocket, startLettersGame, submitAnswer, getGameResults } from "../lib/websocket";

interface GameResults {
  all_words: string[];
  word_distribution: Record<string, number>;
}

const Letters = () => {
  const gameId = window.location.pathname.split('/')[3];
  const [submissions, setSubmissions] = useState<string[]>([]);
  const { _channel: channel } = useWebSocket();
  const [state, send] = useMachine(
    lettersMachine.provide({
      actions: {
        startGame: ({ context }) => {
          console.debug('Letters: Starting game with context:', context);
          const { letters, gameDuration } = context;
          startLettersGame(gameId, letters, gameDuration)
        },
        sendSubmission: (_, params: unknown) => {
          console.debug('Letters: Sending submission:', params);
          const submissionParams = params as { submission: string };
          submitAnswer(gameId, submissionParams.submission);
        },
        getGameResults: async () => {
          console.debug('Letters: Getting game results');
          const { results: gameResults } = await getGameResults<GameResults>(gameId)
          console.debug('Letters: Received Game results:', gameResults);
          send({
            type: 'RESULTS',
            wordLengthDistribution: gameResults.word_distribution,
            possibleWords: gameResults.all_words,
          });
        },
      },
    })
  );

  useEffect(() => {
    console.debug('Letters: Current state:', state.value);
  }, [state.value]);

  useEffect(() => {
    if (channel) {
      channel.on('game_started', (payload) => {
        console.debug('Letters: Game started', { payload });
        send({ type: 'STARTED_GAME', game: payload.game });
      });
    }
  }, [channel, send]);

  const handleSubmissionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // parse textarea value as space-separated or line-break words
    const submissions = e.target.value.split(/\s+/).filter(word => word.trim() !== '');
    setSubmissions(submissions);
  }

  useDebounce(() => {
    send({ type: 'SUBMIT', submissions });
  }, 300, [submissions]);

  const { 
    letters, 
    gameDuration, 
    showWordLengths, 
    showPossibleWords, 
    players,
    wordLengthDistribution,
    possibleWords 
  } = state.context;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Letters Round</h1>
        {state.matches('playing') && (
          <div className="flex justify-center flex-col items-center mb-8">
            <AnalogClock
              duration={gameDuration}
              isRunning={true}
              onComplete={() => send({ type: 'TIMER_COMPLETE' })}
            />
          </div>
        )}
        <div className="grid grid-cols-9 gap-4 mb-4">
          {letters.map((letter, index) => (
            <div
              key={index}
              className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-md text-2xl font-bold text-blue-800"
            >
              {letter}
            </div>
          ))}
          {Array(9 - letters.length).fill(null).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-md"
            />
          ))}
        </div>

        {state.matches('selecting') && letters.length < 9 && (
          <>
            <div className="flex justify-center h-16 space-x-4">
              <Toggle
                checked={gameDuration === 60}
                onChange={(checked) => send({ type: 'SET_DURATION', duration: checked ? 60 : 30 })}
                leftLabel="30s"
                rightLabel="60s"
                disabled={!state.matches('selecting')}
              />
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => send({ type: 'RANDOM_FILL' })}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                <Shuffle className="w-4 h-4" />
                <span>Random Fill</span>
              </button>
              <button
                onClick={() => send({ type: 'ADD_VOWEL' })}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
              >
                Vowel
              </button>
              <button
                onClick={() => send({ type: 'ADD_CONSONANT' })}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Consonant
              </button>
            </div>
          </>
        )}
        <textarea
          className="w-full h-48 mt-4 p-2 border rounded-md font-medium text-lg"
          disabled={!state.matches('playing')}
          placeholder="Type your words here..."
          onChange={handleSubmissionsChange}
        />
      </div>

      {state.matches('completed') && (
        <div className="space-y-6">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => send({ type: 'TOGGLE_WORD_LENGTHS' })}
              className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
            >
              {showWordLengths ? 'Hide' : 'Show'} Word Length Distribution
            </button>
            <button
              onClick={() => send({ type: 'TOGGLE_POSSIBLE_WORDS' })}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
            >
              {showPossibleWords ? 'Hide' : 'Show'} Possible Words
            </button>
          </div>

          {/**
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Player Submissions</h2>
            <div className="space-y-4">
              {players.map(player => (
                <div key={player.id} className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{player.name}</span>
                    <span className="ml-2 text-gray-600">({player.wordLength} letters)</span>
                  </div>
                  <button
                    onClick={() => send({ type: 'TOGGLE_PLAYER_WORD', playerId: player.id })}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                  >
                    {player.word ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>{player.word}</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Reveal Word</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
          */}

          {showWordLengths && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">Word Length Distribution</h2>
              <div className="space-y-2">
                {Object.entries(wordLengthDistribution)
                  .sort(([a], [b]) => parseInt(b) - parseInt(a))
                  .map(([length, count]) => (
                    <div key={length} className="flex items-center space-x-2">
                      <span className="w-20">{length} letters:</span>
                      <div className="flex-1 bg-blue-100 rounded-full h-4">
                        <div
                          className="bg-blue-600 h-4 rounded-full"
                          style={{ width: `${(count / Math.max(...Object.values(wordLengthDistribution))) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {showPossibleWords && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">Possible Words</h2>
              <div className="grid grid-cols-3 gap-2">
                {possibleWords.map((word, index) => (
                  <div key={index} className="text-gray-700">{word}</div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={() => send({ type: 'RESET' })}
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
            >
              New Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Letters;
