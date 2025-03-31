import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Brain } from 'lucide-react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Letters from './pages/Letters';
import Numbers from './pages/Numbers';
import Conundrum from './pages/Conundrum';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/letters" element={<Letters />} />
            <Route path="/numbers" element={<Numbers />} />
            <Route path="/conundrum" element={<Conundrum />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;