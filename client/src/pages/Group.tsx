import { useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, PlayCircle, BookA, Calculator, Brain } from 'lucide-react';
import { useWebSocket } from "../lib/websocket";

interface Player {
  id: string;
  name: string;
  active: boolean;
  points: number;
}

const Group = () => {
  const path = window.location.pathname;
  const urlGroup = path.split('/')[1];

  const navigate = useNavigate();
  const { connect, joinGroup, sendEvent } = useWebSocket();
  const { playerName, groupName, socket, channel } = useWebSocket(store => ({
    socket: store._socket,
    channel: store._channel,
    playerName: store.playerName,
    groupName: store.groupName,
  }))

  const handleConnect = async (playerName: string) => {
    await connect(playerName);
  }

  useEffect(() => {
    if (!socket && playerName) {
      console.debug('Connecting to WebSocket', { playerName });
      handleConnect(playerName)
    } else if (!channel && playerName) {
      console.debug('Joining group', urlGroup);
      joinGroup(urlGroup)
    }
  }, [playerName, groupName, socket]);

// Mock data - replace with actual WebSocket data
  const players: Player[] = [
    { id: '1', name: 'Alice', active: true, points: 120 },
    { id: '2', name: 'Bob', active: true, points: 95 },
    { id: '3', name: 'Charlie', active: false, points: 85 },
    { id: '4', name: 'David', active: true, points: 75 },
  ].sort((a, b) => b.points - a.points);

  const startGame = async (gameType: 'letters' | 'numbers' | 'conundrum') => {
    try {
      // TODO this needs duration removing and moving to start game
      const response = await sendEvent(`create_${gameType}_game`, { duration: 30 });
      navigate(`/${groupName}/${gameType}/${response.game_id}`);
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-6">
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
                    player.active ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <span className="font-medium">{player.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">{player.points}</span>
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
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center space-y-3"
        >
          <Calculator className="h-8 w-8 text-green-500" />
          <span className="font-medium">Numbers Round</span>
        </button>

        <button
          onClick={() => startGame('conundrum')}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center space-y-3"
        >
          <Brain className="h-8 w-8 text-red-500" />
          <span className="font-medium">Conundrum</span>
        </button>
      </div>
    </div>
  );
};

export default Group;
