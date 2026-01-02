import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home as HomeIcon, Search, PlusCircle, MessageCircle, User as UserIcon } from 'lucide-react';
import { RideProvider } from './context/RideContext';
import { UserProvider, useUser } from './context/UserContext'; 
import { motion, AnimatePresence } from 'framer-motion';

// --- IMPORT THE MODAL CONTEXT ---
import { ModalProvider } from './context/ModalContext';

// Import Pages
import Home from './pages/Home';
import RideFeed from './pages/RideFeed';
import CreateRide from './pages/CreateRide';
import Login from './pages/Login';
import ChatData from './pages/ChatData'; 
import Profile from './pages/Profile'; 
import JoinRide from './pages/JoinRide'; // <--- IMPORT THIS

// --- IMPORT THE GENDER MODAL ---
import GenderModal from './components/GenderModal'; 

const ProtectedRoute = ({ children }) => {
  const { user } = useUser();
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <UserProvider> 
      <RideProvider>
        {/* WRAP THE APP IN MODAL PROVIDER */}
        <ModalProvider>
          <BrowserRouter>
            <div className="bg-black min-h-screen flex justify-center items-center font-sans">
              <div className="w-full max-w-md bg-background h-full max-h-[850px] aspect-[9/19] relative shadow-2xl overflow-hidden text-white border-x border-white/10 rounded-3xl">
                
                <div className="fixed top-0 left-0 w-80 h-80 bg-primary/20 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob pointer-events-none"></div>
                <div className="fixed bottom-0 right-0 w-80 h-80 bg-accent/20 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob animation-delay-2000 pointer-events-none"></div>

                <MainLayout />
              </div>
            </div>
          </BrowserRouter>
        </ModalProvider>
      </RideProvider>
    </UserProvider>
  );
}

const MainLayout = () => {
  const { user } = useUser();
  const location = useLocation();

  return (
    <>
      {/* This checks for gender lock */}
      {user && <GenderModal />}

      <div className="relative z-10 h-full overflow-hidden">
        <AnimatePresence mode="wait">
           <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/rides" element={<ProtectedRoute><RideFeed /></ProtectedRoute>} />
            
            {/* ADD THE JOIN RIDE ROUTE HERE */}
            <Route path="/ride/:id" element={<ProtectedRoute><JoinRide /></ProtectedRoute>} />

            <Route path="/create" element={<ProtectedRoute><CreateRide /></ProtectedRoute>} />
            <Route path="/chats" element={<ProtectedRoute><ChatData /></ProtectedRoute>} /> 
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} /> 
          </Routes>
        </AnimatePresence>
      </div>

      {user && <BottomNav />}
    </>
  );
};

const BottomNav = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] bg-surface/90 backdrop-blur-xl border border-white/10 rounded-3xl p-3 z-50 shadow-2xl">
      <div className="grid grid-cols-5 items-center">
        <NavItem to="/" icon={<HomeIcon size={24} />} label="Home" active={isActive('/')} />
        <NavItem to="/rides" icon={<Search size={24} />} label="Find" active={isActive('/rides')} />
        
        <div className="flex justify-center relative">
            <Link to="/create" className="absolute -top-10 bg-gradient-to-tr from-primary to-secondary p-4 rounded-full shadow-lg shadow-primary/40 hover:scale-105 transition-transform border-4 border-background/50">
            <PlusCircle size={32} className="text-white" />
            </Link>
        </div>

        <NavItem to="/chats" icon={<MessageCircle size={24} />} label="Chat" active={isActive('/chats')} />
        <NavItem to="/profile" icon={<UserIcon size={24} />} label="Profile" active={isActive('/profile')} />
      </div>
    </nav>
  );
};

const NavItem = ({ to, icon, label, active }) => (
  <Link to={to} className={`flex flex-col items-center transition-colors ${active ? 'text-primary' : 'text-gray-400'}`}>
    {icon}
    <span className="text-[10px] font-medium mt-1">{label}</span>
  </Link>
);

export default App;