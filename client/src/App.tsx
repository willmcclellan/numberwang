import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Logo from './components/Logo';
import Home from './pages/Home';
import Group from './pages/Group';
import Letters from './pages/Letters';
import Numbers from './pages/Numbers';
import Conundrum from './pages/Conundrum';

function App() {
  return (
    <Router>
      <div className="min-h-screen pb-8 bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="justify-center items-center flex h-32">
          <Logo />
        </div>
        <div className="container mx-auto px-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/:groupId" element={<Group />} />
            <Route path="/:groupId/letters/:gameId" element={<Letters />} />
            <Route path="/:groupId/numbers/:gameId" element={<Numbers />} />
            <Route path="/:groupId/conundrum/:gameId" element={<Conundrum />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
