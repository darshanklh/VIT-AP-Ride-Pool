import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../context/UserContext';
import { useModal } from '../context/ModalContext';
import { ArrowRight, Calendar, Clock, MapPin, Shield, UserPlus, Car, Ban } from 'lucide-react';
import { motion } from 'framer-motion';

const JoinRide = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { showModal } = useModal();
  
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userGender, setUserGender] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rideSnap = await getDoc(doc(db, "rides", id));
        if (rideSnap.exists()) {
          setRide({ id: rideSnap.id, ...rideSnap.data() });
        } else {
          alert("Ride not found or has expired.");
          navigate('/rides');
        }
        if (user) {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists()) setUserGender(userSnap.data().gender);
        }
      } catch (error) {
        console.error("Error:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, [id, user, navigate]);

  // TIME HELPER
  const isPastScheduledTime = (rideData) => {
    if (!rideData.date || !rideData.time) return false;
    const [year, month, day] = rideData.date.split('-').map(Number);
    const [timeStr, period] = rideData.time.split(' ');
    let [hours, minutes] = timeStr.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const rideDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return new Date() > rideDate;
  };

  const handleJoin = async () => {
    if (!user || !ride) return;

    // 1. PAUSED CHECK
    if (ride.isPaused) {
       showModal({ title: "Booking Paused", message: "Host has paused new requests.", type: "alert" });
       return;
    }

    // 2. TIME CHECK
    if (isPastScheduledTime(ride) && !ride.forceAllow) {
        showModal({ title: "Ride Departed", message: "Scheduled time passed. You cannot join unless the host enables 'Late Join'.", type: "alert" });
        return;
    }

    // 3. GENDER CHECK
    if (ride.ladiesOnly && userGender !== 'Female') {
        showModal({ title: "Access Denied", message: "Ladies Only ride.", type: "alert" });
        return;
    }

    // 4. CONFIRM
    showModal({
        title: "Join Ride?",
        message: `Confirm joining ride to ${ride.to}?`,
        type: "confirm",
        onConfirm: async () => {
            const rideRef = doc(db, "rides", ride.id);
            const passengerData = { uid: user.uid, name: user.displayName, photo: user.photoURL };
            await updateDoc(rideRef, { passengers: arrayUnion(passengerData) });
            navigate('/rides');
        }
    });
  };

  if (loading) return <div className="text-white text-center mt-20">Loading...</div>;
  if (!ride) return null;

  const passengerList = ride.passengers || [];
  const totalSeats = ride.vehicleType === 'Auto' ? 8 : 6;
  const seatsLeft = totalSeats - (1 + passengerList.length);
  const isHost = user && user.uid === ride.hostId;
  const isPassenger = passengerList.some(p => p.uid === user?.uid);
  const isLate = isPastScheduledTime(ride);

  return (
    <div className="p-6 pt-10 h-full flex flex-col items-center justify-center">
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="bg-surface p-6 rounded-3xl border border-white/10 shadow-2xl w-full max-w-sm relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10"></div>
            
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Join This Ride</h2>
            
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-2">
                    <span className="bg-white/10 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase">
                        {ride.vehicleType}
                    </span>
                    {ride.ladiesOnly && (
                        <span className="bg-pink-500/20 text-pink-400 px-3 py-1 rounded-lg text-xs font-bold uppercase flex items-center gap-1">
                            <Shield size={12} /> Ladies Only
                        </span>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-3 text-white font-bold text-xl mb-6">
                <span>{ride.from}</span> 
                <ArrowRight className="text-gray-500"/> 
                <span>{ride.to}</span>
            </div>

            <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-gray-300">
                    <Calendar size={18} className="text-primary"/>
                    <span>{new Date(ride.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                    <Clock size={18} className="text-secondary"/>
                    <span>{ride.time}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                    <Car size={18} className="text-green-400"/>
                    <span className={seatsLeft > 0 ? "text-white" : "text-red-400"}>
                        {seatsLeft > 0 ? `${seatsLeft} Seats Left` : "Ride Full"}
                    </span>
                </div>
            </div>

            {/* ACTION BUTTONS LOGIC HIERARCHY: Host -> Passenger -> Paused -> Full -> Late -> Open */}
            {isHost ? (
                <button 
                    onClick={() => navigate('/rides')} 
                    className="w-full py-4 rounded-xl font-bold bg-white/10 text-white"
                >
                    You are the Host
                </button>
            ) : isPassenger ? (
                <button 
                    onClick={() => navigate('/rides')} 
                    className="w-full py-4 rounded-xl font-bold bg-green-500/20 text-green-400 border border-green-500/50"
                >
                    Already Joined
                </button>
            ) : ride.isPaused ? (
                <button 
                    disabled 
                    className="w-full py-4 rounded-xl font-bold bg-gray-500/10 text-gray-500 border border-gray-500/20 cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <Ban size={18} /> Host Paused Requests
                </button>
            ) : seatsLeft <= 0 ? (
                <button 
                    disabled 
                    className="w-full py-4 rounded-xl font-bold bg-red-500/10 text-red-500 cursor-not-allowed"
                >
                    Ride Full
                </button>
            ) : isLate && !ride.forceAllow ? (
                <button 
                    disabled 
                    className="w-full py-4 rounded-xl font-bold bg-red-500/10 text-red-500 cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <Clock size={18} /> Ride Departed
                </button>
            ) : (
                <button 
                    onClick={handleJoin} 
                    className="w-full py-4 rounded-xl font-bold bg-white text-black hover:bg-gray-200 transition flex items-center justify-center gap-2 shadow-lg"
                >
                    <UserPlus size={20} /> {isLate ? "Join Late" : "Join Now"}
                </button>
            )}
            
            <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">Hosted by {ride.host}</p>
            </div>
        </motion.div>
    </div>
  );
};

export default JoinRide;