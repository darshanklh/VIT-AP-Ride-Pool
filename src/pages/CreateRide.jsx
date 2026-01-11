import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRides } from '../context/RideContext';
import { useUser } from '../context/UserContext';
import { useModal } from '../context/ModalContext'; // <--- Import Modal Hook
import { MapPin, Calendar, Clock, ChevronDown, Shield } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from '../firebase'; 

const CreateRide = () => {
  const navigate = useNavigate();
  const { addRide } = useRides(); 
  const { user } = useUser();
  const { showModal } = useModal(); // <--- Get showModal function

  const [userGender, setUserGender] = useState(null);
  const [time, setTime] = useState({ hour: '12', minute: '00', period: 'AM' });

  const [formData, setFormData] = useState({
    vehicleType: 'Auto',
    from: 'VIT-AP Campus', 
    to: 'Vijayawada Railway Station',
    date: '',
    seats: '8', 
    ladiesOnly: false 
  });

  const locations = ['VIT-AP Campus', 'Vijayawada Railway Station', 'PNBS Bus Stand', 'Gannavaram Airport', 'Guntur'];
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  useEffect(() => {
    const checkUserGender = async () => {
        if(!user) return;
        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                setUserGender(userSnap.data().gender);
            }
        } catch (error) {
            console.error("Error fetching gender:", error);
        }
    };
    checkUserGender();
  }, [user]);

  const handleVehicleChange = (type) => {
    setFormData({
      ...formData,
      vehicleType: type,
      seats: type === 'Auto' ? '8' : '6'
    });
  };

  const handleFromChange = (e) => {
    const newFrom = e.target.value;
    let newTo = formData.to;
    
    if (newTo === newFrom) {
      newTo = newFrom === 'VIT-AP Campus' ? 'Vijayawada Railway Station' : 'VIT-AP Campus';
    }
    setFormData({ ...formData, from: newFrom, to: newTo });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- CHECK 1: SAME LOCATION ---
    if (formData.from === formData.to) {
      showModal({
        title: "Invalid Route",
        message: "From and To locations cannot be the same!",
        type: "alert"
      });
      return;
    }

    // --- CHECK 2: PAST TIME VALIDATION ---
    const [year, month, day] = formData.date.split('-').map(Number);
    let rideDate = new Date(year, month - 1, day); 

    let selectedHour = parseInt(time.hour);
    const selectedMinute = parseInt(time.minute);

    if (time.period === 'PM' && selectedHour !== 12) {
      selectedHour += 12;
    }
    if (time.period === 'AM' && selectedHour === 12) {
      selectedHour = 0;
    }

    rideDate.setHours(selectedHour, selectedMinute, 0, 0);

    if (rideDate < new Date()) {
      showModal({
        title: "Invalid Time",
        message: "⚠️ Cannot schedule a ride in the past! Please select a future time.",
        type: "alert" 
      });
      return; 
    }
    // -------------------------------------

    const isLadiesOnly = userGender === 'Female' ? formData.ladiesOnly : false;
    const formattedTime = `${time.hour}:${time.minute} ${time.period}`;

    const newRide = {
      ...formData,
      ladiesOnly: isLadiesOnly, 
      time: formattedTime,
      host: user.displayName,
      hostId: user.uid,
      hostPhoto: user.photoURL,
      price: "Split",
      passengers: [],
      waitlist: [],
      isPaused: false,
      forceAllow: false
    };
    
    await addRide(newRide);
    navigate('/rides');
  };

  return (
    <div className="p-4 pb-32 pt-6 h-full overflow-y-auto scrollbar-thin">
      <h2 className="text-2xl font-bold text-white mb-6">Host a Pool</h2>
      
      <form onSubmit={handleSubmit} className="bg-surface p-6 rounded-3xl border border-white/10 shadow-2xl space-y-6 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Vehicle Selection */}
        <div>
          <label className="text-xs text-gray-400 ml-1 mb-2 block font-medium uppercase tracking-wide">Vehicle Type</label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
            {['Auto', 'Cab'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleVehicleChange(type)}
                className={`py-3 rounded-lg text-sm font-bold transition-all flex flex-col items-center gap-1 ${
                  formData.vehicleType === type 
                  ? 'bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <span>{type}</span>
                <span className="text-[10px] font-normal opacity-80">
                  (Max {type === 'Auto' ? '8' : '6'})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Route */}
        <div className="space-y-4">
            <div className='relative group'>
                 <label className="flex items-center gap-2 text-xs text-gray-400 ml-1 mb-1"><MapPin size={12} className="text-green-400"/> From</label>
                 <div className="relative">
                   <select 
                      className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white focus:border-primary outline-none appearance-none font-medium"
                      value={formData.from}
                      onChange={handleFromChange}
                   >
                      {locations.map(loc => <option key={loc} value={loc} className="text-black">{loc}</option>)}
                   </select>
                   <ChevronDown className="absolute right-4 top-4 text-gray-500 pointer-events-none" size={16} />
                 </div>
            </div>
            <div className='relative group'>
                 <label className="flex items-center gap-2 text-xs text-gray-400 ml-1 mb-1"><MapPin size={12} className="text-red-400"/> To</label>
                 <div className="relative">
                   <select 
                      className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white focus:border-primary outline-none appearance-none font-medium"
                      value={formData.to}
                      onChange={(e) => setFormData({...formData, to: e.target.value})}
                   >
                      {locations.filter(l => l !== formData.from).map(loc => <option key={loc} value={loc} className="text-black">{loc}</option>)}
                   </select>
                   <ChevronDown className="absolute right-4 top-4 text-gray-500 pointer-events-none" size={16} />
                 </div>
            </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="flex items-center gap-2 text-xs text-gray-400 ml-1 mb-1"><Calendar size={12} /> Date</label>
            <input 
              /* --- FIX STARTS HERE --- */
              type="text" 
              placeholder="dd / mm / yyyy" 
              onFocus={(e) => (e.target.type = "date")} 
              onBlur={(e) => {
                if (!e.target.value) e.target.type = "text"; 
              }}
              /* ----------------------- */
              required
              className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-primary [color-scheme:dark] text-sm font-medium"
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs text-gray-400 ml-1 mb-1"><Clock size={12} /> Time</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select 
                  className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none appearance-none text-center font-bold"
                  value={time.hour}
                  onChange={(e) => setTime({...time, hour: e.target.value})}
                >
                  {hours.map(h => <option key={h} value={h} className="text-black">{h}</option>)}
                </select>
              </div>
              <span className="text-white font-bold flex items-center">:</span>
              <div className="relative flex-1">
                <select 
                  className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none appearance-none text-center font-bold"
                  value={time.minute}
                  onChange={(e) => setTime({...time, minute: e.target.value})}
                >
                  {minutes.map(m => <option key={m} value={m} className="text-black">{m}</option>)}
                </select>
              </div>
              <div className="flex bg-black/40 rounded-xl border border-white/10 p-1">
                <button
                  type="button"
                  onClick={() => setTime({...time, period: 'AM'})}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition ${time.period === 'AM' ? 'bg-surface text-primary shadow' : 'text-gray-500 hover:text-white'}`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setTime({...time, period: 'PM'})}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition ${time.period === 'PM' ? 'bg-surface text-primary shadow' : 'text-gray-500 hover:text-white'}`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>
        </div>

        {userGender === 'Female' && (
            <div 
              className="bg-pink-500/10 border border-pink-500/20 p-4 rounded-xl flex items-center justify-between cursor-pointer"
              onClick={() => setFormData({...formData, ladiesOnly: !formData.ladiesOnly})}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${formData.ladiesOnly ? 'bg-pink-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                        <Shield size={18} />
                    </div>
                    <div>
                        <h4 className={`font-bold ${formData.ladiesOnly ? 'text-pink-400' : 'text-gray-400'}`}>Ladies Only</h4>
                        <p className="text-[10px] text-gray-500">Only female passengers allowed</p>
                    </div>
                </div>
                
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.ladiesOnly ? 'bg-pink-500' : 'bg-gray-700'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.ladiesOnly ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
            </div>
        )}

        <button type="submit" className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-200 transition active:scale-95 transform duration-200 mt-2">
          Publish Ride
        </button>

      </form>
    </div>
  );
};

export default CreateRide;