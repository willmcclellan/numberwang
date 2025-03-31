import React from 'react';
import { Timer, Shuffle, Eye, EyeOff } from 'lucide-react';
import { useMachine } from '@xstate/react';
import { lettersMachine } from '../machines/lettersMachine';
import AnalogClock from '../components/AnalogClock';

const Letters = () => {
  const [state, send] = useMachine(lettersMachine);
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Letters Round</h1>
        <div className="flex items-center space-x-4">
          <select
            value={gameDuration}
            onChange={(e) => send({ type: 'SET_DURATION', duration: Number(e.target.value) })}
            className="p-2 border rounded-md"
            disabled={!state.matches('selecting')}
          >
            <option value={30}>30 seconds</option>
            <option value={60}>60 seconds</option>
          </select>
          {state.matches('selecting') && (
            <button
              onClick={() => send({ type: 'RANDOM_FILL' })}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              <Shuffle className="w-4 h-4" />
              <span>Random Fill</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="grid grid-cols-9 gap-4 mb-8">
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
          <div className="flex justify-center space-x-4">
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
        )}

        {state.matches('playing') && (
          <div className="flex justify-center">
            <AnalogClock
              duration={gameDuration}
              isRunning={true}
              onComplete={() => send({ type: 'TIMER_COMPLETE' })}
            />
          </div>
        )}
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

          {showWordLengths && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">Word Length Distribution</h2>
              <div className="space-y-2">
                {Object.entries(wordLengthDistribution).map(([length, count]) => (
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