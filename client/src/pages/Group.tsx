import { useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, BookA, Calculator, Brain } from 'lucide-react';
import { useWebSocket, createGame } from "../lib/websocket";

const Group = () => {
  const path = window.location.pathname;
  const urlGroup = path.split('/')[1];

  const navigate = useNavigate();
  const { connect, joinGroup } = useWebSocket();
  const { players, playerName, groupName, socket, channel } = useWebSocket(store => ({
    socket: store._socket,
    channel: store._channel,
    players: store.players,
    playerName: store.playerName,
    groupName: store.groupName,
  }))

  const handleConnect = async (playerName: string) => {
    await connect(playerName);
  }

  useEffect(() => {
    console.debug('Group component mounted', { playerName, groupName, socket });
    if (!playerName && !socket) {
      console.debug('No player name or socket, navigating to home');
      navigate(`/?groupName=${urlGroup}`);
    } else if (!socket && playerName) {
      console.debug('Connecting to WebSocket', { playerName });
      handleConnect(playerName)
    } else if (!channel && playerName) {
      console.debug('Joining group', urlGroup);
      joinGroup(urlGroup)
    }
  }, [playerName, groupName, socket]);

  useEffect(() => {
    if (channel) {
      channel.on('game_created', (payload) => {
        console.debug('Game created, navigating to game', { payload });
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

  const startGame = async (gameType: 'letters' | 'numbers' | 'conundrum') => {
    try {
      await createGame(gameType)
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col gap-4 items-center md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">
              Group: {groupName}
            </h1>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Trophy className="h-5 w-5" />
            <span className="font-medium">Leaderboard</span>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {players.map((player) => (
            <div
              key={player.id}
              className="py-3 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    true ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <span className="font-medium">{player.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">XX</span>
                <span className="text-sm text-gray-500">pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => startGame('letters')}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center space-y-3"
        >
          <BookA className="h-8 w-8 text-blue-500" />
          <span className="font-medium">Letters Round</span>
        </button>

        <button
          onClick={() => startGame('numbers')}
          className="disabled opacity-50 bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center space-y-3"
        >
          <Calculator className="h-8 w-8 text-green-500" />
          <span className="font-medium">Numbers Round</span>
        </button>

        <button
          onClick={() => startGame('conundrum')}
          className="disabled opacity-50 bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center space-y-3"
        >
          <Brain className="h-8 w-8 text-red-500" />
          <span className="font-medium">Conundrum</span>
        </button>
      </div>
    </div>
  );
};

export default Group;
