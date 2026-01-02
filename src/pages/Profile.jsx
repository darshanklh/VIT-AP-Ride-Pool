import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useRides } from '../context/RideContext';
import { ShieldCheck, LogOut, Car, Lock } from 'lucide-react'; 
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Profile = () => {
  const { user, logout } = useUser();
  const { rides } = useRides();
  const [activeTab, setActiveTab] = useState('stats');
  const [gender, setGender] = useState(''); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
        if(!user) return;
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            setGender(docSnap.data().gender || '');
        }
    };
    fetchUserData();
  }, [user]);

  // --- LOGIC: RIDE EXPIRY (Used to determine History) ---
  const isRideExpired = (ride) => {
    if (!ride.date || !ride.time) return false;
    const [year, month, day] = ride.date.split('-');
    const rideDate = new Date(year, month - 1, day);
    const [timeStr, period] = ride.time.split(' ');
    let [hours, minutes] = timeStr.split(':');
    hours = parseInt(hours);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    rideDate.setHours(hours, parseInt(minutes), 0, 0);
    const oneHourLater = new Date(rideDate.getTime() + 60 * 60 * 1000);
    return new Date() > oneHourLater;
  };

  const saveGender = async (selectedGender) => {
    if (gender) return; 
    if(!window.confirm(`Confirm you are ${selectedGender}? This cannot be changed later.`)) return;

    setLoading(true);
    try {
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            gender: selectedGender
        }, { merge: true });
        
        setGender(selectedGender);
    } catch (error) {
        console.error("Error saving profile:", error);
        alert("Failed to save. Check your connection.");
    }
    setLoading(false);
  };

  const hostedRides = rides.filter(r => r.hostId === user.uid).length;
  const joinedRides = rides.filter(r => r.passengers && r.passengers.some(p => p.uid === user.uid)).length;

  // HISTORY = RIDES INVOLVED IN + EXPIRED
  const historyRides = rides.filter(r => {
    const involved = r.hostId === user.uid || (r.passengers && r.passengers.some(p => p.uid === user.uid));
    const expired = isRideExpired(r);
    return involved && expired;
  });

  const isLocked = !!gender; 

  return (
    <div className="p-6 pt-10 pb-32 h-full overflow-y-auto scrollbar-thin">
      <h2 className="text-3xl font-bold text-white mb-6">My Profile</h2>

      <div className="bg-surface border border-white/10 rounded-3xl p-6 flex flex-col items-center relative overflow-hidden mb-6">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary/20 to-secondary/20"></div>
        <div className="relative z-10 -mt-4 mb-4">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=random&color=fff`} 
              alt="Profile" 
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-full border-4 border-background shadow-2xl object-cover"
            />
            <div className="absolute bottom-0 right-0 bg-green-500 p-1.5 rounded-full border-2 border-background"><ShieldCheck size={16} className="text-white" /></div>
        </div>
        <h3 className="text-xl font-bold text-white">{user.displayName}</h3>
        <p className="text-gray-400 text-sm mb-4">{user.email}</p>

        <div className="w-full bg-black/20 p-4 rounded-xl border border-white/5 relative">
            <div className="flex justify-between items-center mb-3">
                <label className="text-xs text-gray-400 uppercase font-bold">Identify Gender</label>
                {isLocked && <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded"><Lock size={10} /> Locked</div>}
            </div>
            
            <div className="flex gap-2">
                <button 
                    disabled={isLocked}
                    onClick={() => saveGender('Male')} 
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${gender === 'Male' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-transparent border-white/10 text-gray-400'} ${isLocked && gender !== 'Male' ? 'opacity-20' : ''} ${!isLocked ? 'hover:bg-white/5' : 'cursor-default'}`}
                >
                    Male
                </button>
                <button 
                    disabled={isLocked}
                    onClick={() => saveGender('Female')} 
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${gender === 'Female' ? 'bg-pink-600 border-pink-500 text-white' : 'bg-transparent border-white/10 text-gray-400'} ${isLocked && gender !== 'Female' ? 'opacity-20' : ''} ${!isLocked ? 'hover:bg-white/5' : 'cursor-default'}`}
                >
                    Female
                </button>
            </div>
            {!gender && <p className="text-[10px] text-orange-400 mt-2">* Select once. Cannot be changed later.</p>}
        </div>
      </div>

      <div className="flex p-1 bg-surface rounded-xl mb-6 border border-white/10">
        <button onClick={() => setActiveTab('stats')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition ${activeTab === 'stats' ? 'bg-primary text-white shadow' : 'text-gray-400'}`}>Stats</button>
        <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition ${activeTab === 'history' ? 'bg-secondary text-white shadow' : 'text-gray-400'}`}>History</button>
      </div>

      {activeTab === 'stats' ? (
        <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-black/20 p-6 rounded-2xl text-center border border-white/5">
                <div className="text-3xl font-bold text-primary mb-1">{hostedRides}</div>
                <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Hosted</div>
            </div>
            <div className="bg-black/20 p-6 rounded-2xl text-center border border-white/5">
                <div className="text-3xl font-bold text-secondary mb-1">{joinedRides}</div>
                <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Joined</div>
            </div>
        </div>
      ) : (
        <div className="space-y-3">
            {historyRides.length > 0 ? historyRides.map(ride => (
                <div key={ride.id} className="bg-surface p-4 rounded-xl border border-white/5 flex justify-between items-center opacity-70">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-full"><Car size={16} className="text-gray-400"/></div>
                        <div>
                            <div className="text-sm font-bold text-white">{ride.to}</div>
                            <div className="text-xs text-gray-500">{new Date(ride.date).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div className="text-xs font-bold text-gray-500">Completed</div>
                </div>
            )) : <p className="text-gray-500 text-center py-4">No past rides.</p>}
        </div>
      )}

      <button onClick={logout} className="w-full mt-8 bg-red-500/10 text-red-400 border border-red-500/20 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition"><LogOut size={20} /> Sign Out</button>
    </div>
  );
};

export default Profile;