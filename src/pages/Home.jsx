import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser } from '../context/UserContext';

const Home = () => {
  const { user } = useUser();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="h-full flex flex-col px-6 pt-10 pb-40"
    >
      <motion.div variants={item} className="flex-none mb-4">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          VIT-AP Ride Pool
        </h1>
        <p className="text-gray-400 text-lg mt-1">
          Hello, <span className="text-primary font-semibold">{user?.displayName?.split(' ')[0]}</span> 👋
        </p>
      </motion.div>

      <div className="flex-1 flex flex-col justify-center gap-6 min-h-[300px]">
        <Link to="/rides">
          <motion.div 
            variants={item}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-surface border border-white/5 p-6 rounded-3xl shadow-xl relative overflow-hidden group h-32 flex items-center"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative w-full flex items-center justify-between z-10">
              <div>
                <h3 className="font-bold text-2xl text-white mb-1">Find a Ride</h3>
                <p className="text-gray-400 text-sm font-medium">Join an existing group</p>
              </div>
              <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm border border-white/10">
                <ArrowRight className="text-white" size={24} />
              </div>
            </div>
          </motion.div>
        </Link>

        <Link to="/create">
          <motion.div 
            variants={item}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-surface border border-white/5 p-6 rounded-3xl shadow-xl relative overflow-hidden group h-32 flex items-center"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative w-full flex items-center justify-between z-10">
              <div>
                <h3 className="font-bold text-2xl text-white mb-1">Offer a Ride</h3>
                <p className="text-gray-400 text-sm font-medium">I have a cab booked</p>
              </div>
              <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm border border-white/10">
                <ArrowRight className="text-white" size={24} />
              </div>
            </div>
          </motion.div>
        </Link>
      </div>

      <motion.div variants={item} className="flex-none mt-6">
        <div className="bg-gradient-to-br from-gray-900 to-black p-5 rounded-2xl border border-white/10 shadow-lg">
          <h4 className="font-semibold text-gray-200 mb-2 flex items-center gap-2">
            <MapPin size={16} className="text-green-400" />
            Why Pool?
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Save up to <strong className="text-white">₹300</strong> per trip. 
            Split the fare and travel safely with friends.
          </p>
        </div>
      </motion.div>

    </motion.div>
  );
};

export default Home;