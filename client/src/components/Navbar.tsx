import React from 'react';
import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useWebSocket } from '../lib/websocket';

const Navbar = () => {
  const { connected, groupName } = useWebSocket();

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-800">Countdown</span>
          </Link>
          {connected && groupName && (
            <div className="hidden md:flex space-x-8">
              <Link to="/letters" className="text-gray-600 hover:text-blue-600">Letters</Link>
              <Link to="/numbers" className="text-gray-600 hover:text-blue-600">Numbers</Link>
              <Link to="/conundrum" className="text-gray-600 hover:text-blue-600">Conundrum</Link>
            </div>
          )}
          {connected && groupName && (
            <div className="hidden md:block text-sm text-gray-600">
              Group: {groupName}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;