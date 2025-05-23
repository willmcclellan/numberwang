import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus } from 'lucide-react';
import { useWebSocket } from '../lib/websocket';

const Home = () => {
  const urlGroup = new URLSearchParams(window.location.search).get('groupName');
  const [groupId, setGroupId] = useState(urlGroup);
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const navigate = useNavigate();
  const {  _connected, connect, disconnect, joinGroup, leaveGroup, groupName } = useWebSocket();

  // TODO do we need this?
  // Cleanup on unmount
  //useEffect(() => {
  //  return () => {
  //    disconnect();
  //  };
  //}, [disconnect]);

  const handleCreateGroup = async () => {
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setError(null);
    setIsConnecting(true);

    try {
      await connect(playerName);
      const parsedGroupId = groupId.trim().toLowerCase().replace(/\s+/g, '-');

      await joinGroup(parsedGroupId);
      navigate(`/${parsedGroupId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!groupId.trim()) {
      setError('Please enter a group code');
      return;
    }

    setError(null);
    setIsConnecting(true);
    
    try {
      await connect(playerName);
      await joinGroup(groupId);
      navigate(`/${groupId}`); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Welcome to Countdown</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Enter Your Name</h2>
        </div>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Your name"
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          disabled={isConnecting || _connected}
        />
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/**
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 mb-4">
            <UserPlus className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Create a Group</h2>
          </div>
          <p className="text-gray-600 mb-4">Start a new game and invite your friends to join.</p>
          <button
            onClick={handleCreateGroup}
            disabled={isConnecting || !playerName.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
          >
            {isConnecting ? 'Creating...' : 'Create Group'}
          </button>
        </div>
        **/}

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold">Create or Join a Group</h2>
          </div>
          <form onSubmit={handleJoinGroup}>
            <input
              type="text"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              placeholder="Enter group code"
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
              disabled={isConnecting || _connected}
            />
            <button
              type="submit"
              disabled={isConnecting || !playerName.trim() || !groupId.trim()}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-green-300"
            >
              {isConnecting ? 'Joining...' : 'Join Group'}
            </button>
          </form>
        </div>
      </div>

      {_connected && groupName && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
          Connected to group: {groupName} <button onClick={leaveGroup} className="text-blue-600 hover:underline">Leave Group</button>
        </div>
      )}
    </div>
  );
};

export default Home;
