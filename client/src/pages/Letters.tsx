import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from 'react-use'
import { useMachine } from '@xstate/react';
import { lettersMachine } from '../machines/lettersMachine';
import AnalogClock from '../components/AnalogClock';
import Toggle from '../components/Toggle';
import { useWebSocket, createGame, startLettersGame, submitAnswer, getGameResults } from "../lib/websocket";

interface GameResults {
  results: {
    all_words: string[];
    word_distribution: Record<string, number>;
  }
  submissions: Array<{
    player_id: string;
    player_name: string;
    value: string;
    score: number;
    valid: boolean;
  }>;
  winner: {
    player_id: string;
    player_name: string;
    value: string;
    score: number;
  };
}

const Letters = () => {
  const gameId = window.location.pathname.split('/')[3];
  const [submissions, setSubmissions] = useState<string[]>([]);
  const { _channel: channel, groupName } = useWebSocket();
  const navigate = useNavigate();
  const [state, send] = useMachine(
    lettersMachine.provide({
      actions: {
        startGame: ({ context }) => {
          console.debug('Letters: Starting game with context:', context);
          const { letters, gameDuration } = context;
          // @ts-expect-error
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
            results: {
              winner: {
                playerId: gameResults.winner?.player_id,
                playerName: gameResults.winner?.player_name,
                word: gameResults.winner?.value,
                score: gameResults.winner?.score,
              },
              playerSubmissions: gameResults.submissions.map(submission => ({
                playerId: submission.player_id,
                playerName: submission.player_name,
                word: submission.value,
                score: submission.score,
                valid: submission.valid,
              })),
              wordLengthDistribution: gameResults.results.word_distribution,
              possibleWords: gameResults.results.all_words,
            }
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

  useEffect(() => {
    if (channel) {
      channel.on('game_created', (payload) => {
        console.debug('New letters game started, navigating to game', { payload });
        const gameId = payload.game.id;
        const gameType = payload.game.game_type;
        navigate(`/${groupName}/${gameType}/${gameId}`);
      });
    }

    return () => {
      if (channel) {
        channel.off('game_created');
      }
    }
  }, [channel, navigate]);

  const startNewGame = () => {
    try {
      createGame('letters')
    } catch (error) {
      console.error('Failed to start new game:', error);
    }
  };

  const handleSubmissionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // parse textarea value as space-separated or line-break words
    const submissions = e.target.value.split(/\s+/).filter(word => word.trim() !== '');
    setSubmissions(submissions);
  }

  useDebounce(() => {
    send({ type: 'SUBMIT', submissions });
  }, 800, [submissions]);

  const { 
    letters = [], 
    gameDuration, 
    showWordLengths, 
    showPossibleWords, 
    showResults,
    wordLengthDistribution,
    possibleWords ,
    playerSubmissions,
    winner,
  } = state.context;

  const showClock = state.matches('playing') || state.matches('completed');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="flex flex-col gap-2 justify-center md:flex-row md:justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Letters Round</h1>
          {state.matches('completed') && (
            <button
              onClick={startNewGame}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
            >
              New Game
            </button>
          )}
        </div>
        {showClock && (
          <div className="flex justify-center flex-col items-center mb-8">
            <AnalogClock
              duration={gameDuration}
              isRunning={true}
              onComplete={() => send({ type: 'TIMER_COMPLETE' })}
            />
          </div>
        )}
        <div className="max-w-xl mx-auto pb-2">
          <div className="grid grid-cols-9 gap-1 xs:gap-2 sm:gap-3 md:gap-4 mb-4 min-w-min">
            {letters.map((letter, index) => (
              <div
                key={index}
                className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center bg-blue-100 rounded-md text-lg xs:text-base sm:text-xl md:text-2xl font-bold text-blue-800"
              >
                {letter}
              </div>
            ))}
            {Array(9 - letters.length).fill(null).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center bg-gray-100 rounded-md"
              />
            ))}
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => send({ type: 'RANDOM_FILL' })}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
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
          autoCorrect="off"
          autoComplete="off" 
          autoCapitalize="off"
          spellCheck="false"
          className="w-full h-48 mt-4 p-2 border rounded-md font-medium text-lg"
          disabled={!state.matches('playing')}
          placeholder="Type your words here..."
          onChange={handleSubmissionsChange}
        />
      </div>

      {state.matches('completed') && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {!showWordLengths && (
              <button
                onClick={() => send({ type: 'TOGGLE_WORD_LENGTHS' })}
                className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
              >
                {showWordLengths ? 'Hide' : 'Show'} Word Length Distribution
              </button>
            )}
            {!showPossibleWords && (
              <button
                onClick={() => send({ type: 'TOGGLE_POSSIBLE_WORDS' })}
                className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
              >
                {showPossibleWords ? 'Hide' : 'Show'} Possible Words
              </button>
            )}
            <button
              onClick={() => send({ type: 'TOGGLE_RESULTS' })}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
            >
              {showResults ? 'Hide' : 'Show'} Results
            </button>
          </div>

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

          {state.matches('completed') && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">Winner</h2>
              {winner?.playerName ? (
                <div className="flex items-center justify-between mb-4">
                  <span className={`font-semibold ${!showResults && 'blur-sm'}`}>{winner.playerName}</span>
                  <span className={`font-semibold ml-2 text-green-700 ${!showResults && 'blur-sm'}`}>{winner.word.length} letters</span>
                </div>
              ) : (
                <p>No winner!</p>
              )}
              <h2 className="text-xl font-bold mb-4">Submissions</h2>
              <div className="space-y-4">
                {playerSubmissions?.length === 0 && (
                  <p>No submissions yet!</p>
                )}
                {playerSubmissions
                  ?.sort((a, b) => b.score - a.score)
                  ?.map(submission => (
                    <div key={`${submission.playerId}-${submission.word}`} className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold">{submission.playerName}</span>
                        <span className="ml-2 text-gray-600">({submission.word.length} letters)</span>
                      </div>
                      <span className={`font-semibold ${!showResults ? 'text-gray-700' : submission.valid ? 'text-green-700' : 'text-red-700'} ${!showResults && 'blur-sm'}`}>{submission.word}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Letters;
