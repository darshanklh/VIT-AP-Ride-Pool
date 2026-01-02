import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { motion } from "framer-motion";
import { MapPin, Car, Users, ArrowRight } from "lucide-react";

const Login = () => {
  const { googleSignIn } = useUser();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await googleSignIn();
      navigate("/"); 
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-background">
      <div className="absolute top-[-20%] left-[-20%] w-[150%] h-[60%] bg-gradient-to-b from-primary/30 to-transparent rounded-[100%] blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
        
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-32 h-32 mb-10"
        >
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          <div className="absolute inset-2 bg-gradient-to-tr from-primary to-secondary rounded-full flex items-center justify-center shadow-xl shadow-primary/30">
            <Car size={48} className="text-white" />
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 border border-white/10 rounded-full border-dashed"
          />
        </motion.div>

        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-black text-white tracking-tighter">
            VIT-AP <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">RidePool</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-[260px] mx-auto">
            Connect with peers leaving campus at the same time. Save money on Rickshaws & Cabs to Vijayawada.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogin}
          className="w-full max-w-xs bg-white group hover:bg-gray-50 text-slate-900 py-4 rounded-xl font-bold text-lg shadow-xl shadow-white/5 flex items-center justify-center gap-3 transition-all"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="w-5 h-5"
          />
          <span>Continue with Google</span>
          <ArrowRight size={18} className="text-gray-400 group-hover:text-primary transition-colors" />
        </motion.button>
      </div>

      <div className="p-6 grid grid-cols-2 gap-4 border-t border-white/5 bg-white/5 backdrop-blur-lg">
        <div className="flex flex-col items-center text-center">
            <Users size={20} className="text-secondary mb-1" />
            <span className="text-xs text-gray-500">Student Community</span>
            <span className="font-bold text-white">Verified</span>
        </div>
        <div className="flex flex-col items-center text-center">
            <MapPin size={20} className="text-primary mb-1" />
            <span className="text-xs text-gray-500">Destinations</span>
            <span className="font-bold text-white">Vijayawada & More</span>
        </div>
      </div>
    </div>
  );
};

export default Login;