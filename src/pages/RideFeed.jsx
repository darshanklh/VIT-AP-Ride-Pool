import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRides } from '../context/RideContext';
import { useUser } from '../context/UserContext';
import { useModal } from '../context/ModalContext'; 
import { Trash2, Filter, Plus, UserPlus, LogOut, ArrowRight, Car, Info, MessageCircle, X, Share2, Shield, Clock, PauseCircle, PlayCircle, Ban, Unlock, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDoc } from 'firebase/firestore'; 
import { db } from '../firebase';

const RideFeed = () => {
  const navigate = useNavigate();
  const { rides, deleteRide, toggleRidePause, toggleForceAllow } = useRides();
  const { user } = useUser();
  const { showModal } = useModal(); 
  
  const [filterDate, setFilterDate] = useState('');
  const [filterDest, setFilterDest] = useState('All');
  const [viewMembers, setViewMembers] = useState(null);
  const [userGender, setUserGender] = useState(null);

  const locations = ['All', 'VIT-AP Campus', 'Vijayawada Railway Station', 'PNBS Bus Stand', 'Gannavaram Airport'];

  useEffect(() => {
    const fetchGender = async () => {
        if(!user) return;
        try {
            const userRef = doc(db, "users", user.uid);
            const snap = await getDoc(userRef);
            if(snap.exists()) setUserGender(snap.data().gender);
        } catch (e) {
            console.error("Gender fetch error", e);
        }
    };
    fetchGender();
  }, [user]);

  // --- TIME HELPERS ---
  const getRideDateTime = (ride) => {
    if (!ride.date || !ride.time) return null;
    const [year, month, day] = ride.date.split('-').map(Number);
    const [timeStr, period] = ride.time.split(' ');
    let [hours, minutes] = timeStr.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  };

  // Logic: Ride is expired if current time > Ride Time + 1 Hour
  const isRideExpired = (ride) => {
    const rideDate = getRideDateTime(ride);
    if (!rideDate) return false;
    const oneHourLater = new Date(rideDate.getTime() + 60 * 60 * 1000); 
    return new Date() > oneHourLater;
  };

  // Logic: Is the current time strictly past the scheduled time?
  const isPastScheduledTime = (ride) => {
    const rideDate = getRideDateTime(ride);
    if (!rideDate) return false;
    return new Date() > rideDate;
  };

  const getAvatar = (name, photo) => photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random&color=fff`;

  const getSafePassengers = (ride) => {
    if (!ride.passengers) return [];
    const uniquePassengers = [];
    ride.passengers.forEach(p => {
      if (typeof p === 'object' && p !== null && p.uid) {
        if (!uniquePassengers.some(up => up.uid === p.uid)) {
          uniquePassengers.push(p);
        }
      }
    });
    return uniquePassengers;
  };

  // --- LOGIC HANDLERS ---
  const handleMessageClick = (targetUser, ride) => {
    if (targetUser.uid === user.uid) return;
    const isHost = ride.hostId === user.uid;
    const isPassenger = ride.passengers?.some(p => p.uid === user.uid);

    if (!isHost && !isPassenger) {
        showModal({
            title: "Locked Chat",
            message: "🔒 Restricted: You must JOIN this ride to message its members.",
            type: "alert"
        });
        return;
    }
    navigate('/chats', { state: { startChat: { type: 'private', uid: targetUser.uid, name: targetUser.name, photo: targetUser.photo } } });
  };

  const toggleViewMembers = (ride) => {
    if (viewMembers === ride.id) {
        setViewMembers(null);
        return;
    }
    if (ride.ladiesOnly && userGender !== 'Female') {
        showModal({
            title: "Security Check",
            message: "🔒 Security: Only verified female users can view the member list of a Ladies Only ride.",
            type: "alert"
        });
        return;
    }
    setViewMembers(ride.id);
  };

  const handleShare = (ride) => {
    const shareUrl = `${window.location.origin}/ride/${ride.id}`;
    const cleanText = `Join my ride from ${ride.from} to ${ride.to} on ${ride.date} at ${ride.time}!`;

    if (navigator.share) {
        navigator.share({ title: 'Join VIT-AP Ride', text: cleanText, url: shareUrl }).catch(console.error);
    } else {
        navigator.clipboard.writeText(`${cleanText} Click here to join: ${shareUrl}`);
        showModal({ title: "Link Copied", message: "Ride link copied to clipboard!", type: "alert" });
    }
  };

  const handleJoin = async (ride) => {
    if (!user) return;

    // Time Check
    if (isPastScheduledTime(ride) && !ride.forceAllow) {
        showModal({
            title: "Ride Departed",
            message: "This ride's scheduled time has passed. You cannot join unless the host enables 'Late Join'.",
            type: "alert"
        });
        return;
    }

    // Gender Check
    if (ride.ladiesOnly && userGender !== 'Female') {
        showModal({ title: "Access Denied", message: "⛔ Restriction: This ride is marked as Ladies Only.", type: "alert" });
        return;
    }

    // Join Confirmation
    showModal({
        title: "Join Ride?",
        message: `Confirm joining ride to ${ride.to}? The host will see your details.`,
        type: "confirm",
        onConfirm: async () => {
            const rideRef = doc(db, "rides", ride.id);
            const passengerData = { uid: user.uid, name: user.displayName, photo: user.photoURL };
            await updateDoc(rideRef, { passengers: arrayUnion(passengerData) });
        }
    });
  };

  const handleJoinWaitlist = async (ride) => {
    if (!user) return;
    if (ride.ladiesOnly && userGender !== 'Female') {
        showModal({ title: "Access Denied", message: "⛔ Restriction: This ride is marked as Ladies Only.", type: "alert" });
        return;
    }
    const rideRef = doc(db, "rides", ride.id);
    const passengerData = { uid: user.uid, name: user.displayName, photo: user.photoURL };
    await updateDoc(rideRef, { waitlist: arrayUnion(passengerData) });
    showModal({ title: "Success", message: "Joined Waitlist! If a spot opens, you will be next.", type: "alert" });
  };

  const handleLeave = async (ride) => {
    showModal({
        title: "Leave Ride?",
        message: "Are you sure you want to leave this ride?",
        type: "danger",
        onConfirm: async () => {
            const rideRef = doc(db, "rides", ride.id);
            const currentList = ride.passengers || [];
            const passengerToRemove = currentList.find(p => p.uid === user.uid);
            if(passengerToRemove) {
              await updateDoc(rideRef, { passengers: arrayRemove(passengerToRemove) });
            }
        }
    });
  };

  const handleRemovePassenger = async (ride, passenger) => {
    if (!user || user.uid !== ride.hostId) return; 
    showModal({
        title: "Remove Passenger?",
        message: `Are you sure you want to remove ${passenger.name} from this ride?`,
        type: "danger",
        onConfirm: async () => {
            const rideRef = doc(db, "rides", ride.id);
            await updateDoc(rideRef, { passengers: arrayRemove(passenger) });
        }
    });
  };

  const handleHostLeave = async (ride) => {
    showModal({
        title: "Resign as Host?",
        message: "⚠️ A new host will be assigned randomly. If no one else is in the ride, it will be deleted.",
        type: "danger",
        onConfirm: async () => {
            const safeList = getSafePassengers(ride);
            if (safeList.length === 0) {
              await deleteRide(ride.id);
            } else {
              const randomIndex = Math.floor(Math.random() * safeList.length);
              const newHost = safeList[randomIndex];
              const updatedPassengers = safeList.filter(p => p.uid !== newHost.uid);
              const rideRef = doc(db, "rides", ride.id);
              await updateDoc(rideRef, {
                host: newHost.name,
                hostId: newHost.uid,
                hostPhoto: newHost.photo,
                passengers: updatedPassengers
              });
            }
        }
    });
  };

  const handleDelete = async (id) => {
    showModal({
        title: "Delete Ride?",
        message: "This action cannot be undone. Delete this ride permanently?",
        type: "danger",
        onConfirm: async () => {
            await deleteRide(id);
        }
    });
  };

  // --- NEW: PAUSE/RESUME HANDLER ---
  const handlePauseResume = (ride) => {
    const action = ride.isPaused ? "Resume" : "Pause";
    showModal({
        title: `${action} Booking?`,
        message: ride.isPaused 
            ? "This will allow users to join your ride again." 
            : "This will temporarily stop new users from joining.",
        type: "confirm",
        onConfirm: () => toggleRidePause(ride.id, ride.isPaused)
    });
  };

  // --- NEW: FORCE ALLOW HANDLER ---
  const handleForceAllowToggle = (ride) => {
    const action = ride.forceAllow ? "Close" : "Open";
    showModal({
        title: `${action} Late Boarding?`,
        message: ride.forceAllow 
            ? "This will strictly stop anyone from joining since the time has passed." 
            : "⚠️ The scheduled time has passed. Enabling this will allow users to join despite the delay.",
        type: "confirm",
        onConfirm: () => toggleForceAllow(ride.id, ride.forceAllow)
    });
  };

  const filteredRides = rides.filter(ride => {
    const matchesDest = filterDest === 'All' || ride.to === filterDest || ride.from === filterDest;
    const matchesDate = filterDate === '' || ride.date === filterDate;
    const isValidRoute = ride.from !== ride.to; 
    const notExpired = !isRideExpired(ride);
    return matchesDest && matchesDate && isValidRoute && notExpired;
  });

  const formatDate = (dateStr) => {
    if(!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="px-4 pt-6 h-full flex flex-col relative bg-background">
      
      {/* FILTER HEADER */}
      <div className="bg-surface p-4 rounded-2xl border border-white/10 shadow-lg mb-4 flex-none sticky top-0 z-20 backdrop-blur-md bg-surface/90">
        <div className="flex items-center gap-2 mb-3 text-primary font-bold">
          <Filter size={18} />
          <span>Find your ride</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
           <select 
             className="bg-black/20 text-white p-2 rounded-lg border border-white/10 text-sm outline-none focus:border-primary"
             value={filterDest} onChange={(e) => setFilterDest(e.target.value)}
           >
             {locations.map(loc => <option key={loc} value={loc} className="text-black">{loc}</option>)}
           </select>
           <input 
             /* --- FIX APPLIED HERE --- */
             type="text"
             placeholder="dd / mm / yyyy"
             onFocus={(e) => (e.target.type = "date")}
             onBlur={(e) => {
                if (!e.target.value) e.target.type = "text";
             }}
             /* ------------------------ */
             className="bg-black/20 text-white placeholder-gray-500 p-2 rounded-lg border border-white/10 text-sm outline-none focus:border-primary [color-scheme:dark]"
             value={filterDate} 
             onChange={(e) => setFilterDate(e.target.value)}
           />
        </div>
      </div>

      {/* FEED LIST */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-32 scrollbar-thin">
        {filteredRides.length > 0 ? (
          filteredRides.map((ride) => {
            const isHost = user && user.uid === ride.hostId;
            const passengerList = getSafePassengers(ride);
            const isPassenger = passengerList.some(p => p.uid === user?.uid);
            
            const totalSeats = ride.vehicleType === 'Auto' ? 8 : 6;
            const totalHumans = 1 + passengerList.length;
            const seatsLeft = totalSeats - totalHumans;
            const isToday = new Date(ride.date).toDateString() === new Date().toDateString();
            const onWaitlist = ride.waitlist?.some(p => p.uid === user?.uid);
            
            // Logic Constants
            const isLate = isPastScheduledTime(ride);
            const canJoinLate = ride.forceAllow;

            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                key={ride.id} 
                className="bg-surface p-5 rounded-2xl border border-white/5 shadow-md relative"
              >
                {isToday && (
                  <div className="absolute -top-1 -left-1 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-br-xl rounded-tl-2xl shadow-lg z-10 animate-pulse">
                    LEAVING SOON
                  </div>
                )}

                <div className="absolute top-4 right-4 flex gap-2">
                      <button onClick={() => handleShare(ride)} className="text-blue-400 p-2 bg-blue-500/10 rounded-full hover:bg-blue-500/20"><Share2 size={16} /></button>
                      {isHost && (
                        <button onClick={() => handleDelete(ride.id)} className="text-red-400 p-2 bg-red-500/10 rounded-full hover:bg-red-500/20"><Trash2 size={16} /></button>
                      )}
                </div>
                
                {/* RIDE INFO SECTION */}
                <div className="flex gap-2 mb-2 mt-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded inline-block ${ride.vehicleType === 'Auto' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>{ride.vehicleType || 'Ride'}</span>
                    {ride.ladiesOnly && (
                        <span className="text-[10px] uppercase font-bold px-2 py-1 rounded inline-flex items-center gap-1 bg-pink-500/20 text-pink-400">
                            <Shield size={10} /> Ladies Only
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 text-white font-bold text-lg mb-1">
                   <span>{ride.from}</span> <ArrowRight size={14} className="text-gray-500"/> <span>{ride.to}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
                   <img src={getAvatar(ride.host, ride.hostPhoto)} referrerPolicy="no-referrer" className="w-5 h-5 rounded-full object-cover" alt="host" />
                   <span>Hosted by {isHost ? "You" : (ride.host ? ride.host.split(' ')[0] : 'User')}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 border-y border-white/5 py-3 mb-3">
                   <div className="text-center flex flex-col justify-center">
                      <div className="text-gray-500 text-[10px] uppercase mb-0.5">When</div>
                      <div className="text-white font-bold">{ride.time}</div>
                      <div className="text-xs text-primary font-medium">{formatDate(ride.date)}</div>
                   </div>
                   
                   <div className="text-center border-l border-white/5 flex flex-col justify-center">
                      <div className="text-gray-500 text-[10px] uppercase">Seats</div>
                      <div className={`${seatsLeft > 0 ? 'text-white' : 'text-red-400'} font-semibold`}>
                        {seatsLeft > 0 ? `${seatsLeft} Left` : 'FULL'}
                      </div>
                   </div>

                   <div onClick={() => toggleViewMembers(ride)} className="text-center border-l border-white/5 cursor-pointer hover:bg-white/5 transition flex flex-col justify-center">
                      <div className="text-gray-500 text-[10px] uppercase flex items-center justify-center gap-1">Members <Info size={10}/></div>
                      <div className="text-primary font-semibold">{totalHumans} Joined</div>
                   </div>
                </div>

                {/* --- SMART BUTTON LOGIC --- */}
                <div className="flex gap-2">
                    {isHost ? (
                       <>
                         {/* HOST CONTROLS */}
                         {seatsLeft > 0 ? (
                             isLate ? (
                                // LATE MODE: Show Force Allow Toggle
                                <button 
                                   onClick={() => handleForceAllowToggle(ride)}
                                   className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                                     ride.forceAllow 
                                       ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' 
                                       : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                   }`}
                                 >
                                   {ride.forceAllow ? <Lock size={16} /> : <Unlock size={16} />}
                                   {ride.forceAllow ? "Close Late Joins" : "Enable Late Join"}
                                 </button>
                             ) : (
                                // NORMAL MODE: Pause/Resume
                                <button 
                                   onClick={() => handlePauseResume(ride)}
                                   className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                                     ride.isPaused 
                                       ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                                       : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                   }`}
                                 >
                                   {ride.isPaused ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                                   {ride.isPaused ? "Resume" : "Pause"}
                                 </button>
                             )
                         ) : (
                             // Logic fix: Host cannot pause/resume a full ride
                             <div className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gray-500/10 text-gray-500 cursor-not-allowed border border-gray-500/20">
                                 Ride Full
                             </div>
                         )}

                         <button onClick={() => handleHostLeave(ride)} className="flex-1 bg-white/5 text-gray-400 py-3 rounded-xl font-bold text-sm hover:bg-red-500/10 hover:text-red-400 transition flex items-center justify-center gap-2">
                            <LogOut size={16} /> Resign
                         </button>
                       </>
                    ) : isPassenger ? (
                       <button onClick={() => handleLeave(ride)} className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><LogOut size={16} /> Leave Ride</button>
                    ) : ride.isPaused ? (
                       <button disabled className="flex-1 bg-gray-500/10 text-gray-500 border border-gray-500/20 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                          <Ban size={16} /> Booking Paused
                       </button>
                    ) : seatsLeft <= 0 ? (
                       onWaitlist ? 
                       <button disabled className="flex-1 bg-orange-500/20 text-orange-400 py-3 rounded-xl font-bold text-sm">On Waitlist</button> :
                       <button onClick={() => handleJoinWaitlist(ride)} className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><Clock size={16} /> Join Waitlist</button>
                    ) : isLate && !canJoinLate ? (
                        // LATE CHECK: If late and NOT forced allowed -> Block
                        <button disabled className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                           <Clock size={16} /> Ride Departed
                        </button>
                    ) : (
                        // Standard Join (Includes Late Join if allowed)
                       <button onClick={() => handleJoin(ride)} className="flex-1 bg-white text-black py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition"><UserPlus size={16} /> {isLate ? "Join Late" : "Join Ride"}</button>
                    )}
                </div>

                {viewMembers === ride.id && (
                    <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="mt-3 bg-black/20 rounded-xl p-3 border border-white/5">
                        <h4 className="text-xs text-gray-400 mb-2 uppercase font-bold flex justify-between">
                          <span>Riders ({totalHumans})</span>
                          <span className="text-[10px] normal-case font-normal opacity-70">Tap name to chat</span>
                        </h4>
                        
                        <div className="flex flex-wrap gap-2">
                            <div 
                              onClick={() => handleMessageClick({uid: ride.hostId, name: ride.host, photo: ride.hostPhoto}, ride)}
                              className={`flex items-center gap-2 bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-xs border border-primary/30 cursor-pointer hover:bg-primary/30 transition`}
                            >
                                <img src={getAvatar(ride.host, ride.hostPhoto)} referrerPolicy="no-referrer" className="w-4 h-4 rounded-full object-cover" />
                                <span className="font-bold">Host</span>
                                {ride.hostId !== user.uid && <MessageCircle size={12} />}
                            </div>

                            {passengerList.map(p => (
                                <div 
                                  key={p.uid} 
                                  onClick={() => handleMessageClick(p, ride)}
                                  className={`group flex items-center gap-2 bg-surface border border-white/20 text-white px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition`}
                                >
                                    <img src={getAvatar(p.name, p.photo)} referrerPolicy="no-referrer" className="w-4 h-4 rounded-full object-cover" />
                                    <span>{p.name ? p.name.split(' ')[0] : 'User'}</span>
                                    {!isHost && p.uid !== user.uid && <MessageCircle size={12} className="opacity-70" />}
                                    {isHost && (
                                      <div 
                                        onClick={(e) => {
                                          e.stopPropagation(); 
                                          handleRemovePassenger(ride, p);
                                        }}
                                        className="ml-1 pl-2 border-l border-white/20 text-red-400 hover:text-red-300"
                                      >
                                        <X size={14} />
                                      </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setViewMembers(null)} className="w-full text-center text-xs text-gray-500 mt-3 hover:text-white pt-2 border-t border-white/5">Close List</button>
                    </motion.div>
                )}
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-10 bg-white/5 rounded-2xl border border-dashed border-white/10 mx-2">
            <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Car size={32} className="text-gray-400" /></div>
            <h3 className="text-white font-bold text-lg mb-1">No rides found</h3>
            <p className="text-gray-400 text-xs mb-4">Try changing filters or create a new pool.</p>
            <div onClick={() => navigate('/create')} className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg cursor-pointer hover:bg-blue-600 transition">
              <Plus size={18} /> Create Ride
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RideFeed;