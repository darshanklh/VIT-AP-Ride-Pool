import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useRides } from '../context/RideContext';
import { useUser } from '../context/UserContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { Send, ArrowLeft, Users, MessageSquare } from 'lucide-react';

const ChatData = () => {
  const { rides } = useRides();
  const { user } = useUser();
  const location = useLocation(); 
  
  const [activeTab, setActiveTab] = useState('group'); 
  const [selectedChat, setSelectedChat] = useState(null);

  const getAvatar = (name, photo) => photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random&color=fff`;

  // --- SAME EXPIRY LOGIC (Hides old chats) ---
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

  useEffect(() => {
    if (location.state?.startChat) {
      setSelectedChat(location.state.startChat);
      if (location.state.startChat.type === 'private') {
        setActiveTab('private');
      }
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // FILTER: Only show NON-EXPIRED rides in chat
  const myRides = rides.filter(ride => {
    const safePassengers = Array.isArray(ride.passengers) ? ride.passengers : [];
    const isPassenger = safePassengers.some(p => {
        if (typeof p === 'object' && p !== null) return p.uid === user.uid;
        return p === user.uid;
    });
    const isExpired = isRideExpired(ride);
    // Logic: Must be involved AND ride must NOT be expired
    return (ride.hostId === user.uid || isPassenger) && !isExpired; 
  });

  const contacts = [];
  myRides.forEach(ride => {
    if(ride.hostId !== user.uid) {
       if(!contacts.find(c => c.uid === ride.hostId)) {
           contacts.push({uid: ride.hostId, name: ride.host || 'User', photo: ride.hostPhoto});
       }
    }
    if(Array.isArray(ride.passengers)) {
        ride.passengers.forEach(p => {
            if (typeof p === 'object' && p !== null && p.uid) {
                if(p.uid !== user.uid && !contacts.find(c => c.uid === p.uid)) {
                    contacts.push(p);
                }
            }
        });
    }
  });

  return (
    // CHANGED: Removed px-4 and pb-32 from here. Added h-[100dvh] for better mobile height handling.
    <div className="h-full pt-6 flex flex-col">
      {!selectedChat ? (
        <>
          {/* Header Section - Fixed at top */}
          <div className="px-4 mb-6 flex-none">
            <div className="flex p-1 bg-surface rounded-xl border border-white/10">
                <button onClick={() => setActiveTab('group')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2Ql transition ${activeTab === 'group' ? 'bg-primary text-whiteQl shadow' : 'text-gray-400'}`}>
                    <Users size={16} /> Groups
                </button>
                <button onClick={() => setActiveTab('private')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${activeTab === 'private' ? 'bg-secondary text-white shadow' : 'text-gray-400'}`}>
                    <MessageSquare size={16} /> Private
                </button>
            </div>
          </div>

          {/* List Section - Scrollable Area */}
          {/* CHANGED: Added flex-1, overflow-y-auto, and moved pb-32 here */}
          <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-3">
            {activeTab === 'group' ? (
                myRides.length > 0 ? myRides.map(ride => (
                  <div key={ride.id} onClick={() => setSelectedChat({type: 'group', ...ride})} className="bg-surface p-4 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-white">{ride.to}</h3>
                      <p className="text-xs text-gray-400">{ride.date} • {ride.time}</p>
                    </div>
                    <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold">Open</div>
                  </div>
                )) : <p className="text-gray-500 text-center mt-10">No active ride groups.</p>
            ) : (
                contacts.length > 0 ? contacts.map(contact => (
                    <div key={contact.uid} onClick={() => setSelectedChat({type: 'private', ...contact})} className="bg-surface p-3 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer flex items-center gap-3">
                        <img src={getAvatar(contact.name, contact.photo)} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover" />
                        <div>
                            <h3 className="font-bold text-white">{contact.name}</h3>
                            <p className="text-xs text-gray-400">Tap to message</p>
                        </div>
                    </div>
                )) : <p className="text-gray-500 text-center mt-10">Join a ride to find people.</p>
            )}
          </div>
        </>
      ) : (
        <ChatInterface chat={selectedChat} onBack={() => setSelectedChat(null)} user={user} />
      )}
    </div>
  );
};

const ChatInterface = ({ chat, onBack, user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const getCollectionRef = () => {
      if(chat.type === 'group') {
          return collection(db, "rides", chat.id, "messages");
      } else {
          const chatId = [user.uid, chat.uid].sort().join("_");
          return collection(db, "private_chats", chatId, "messages");
      }
  };

  useEffect(() => {
    const q = query(getCollectionRef(), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [chat]);

  const handleSend = async (e) => {
    e.preventDefault();
    if(!newMessage.trim()) return;
    await addDoc(getCollectionRef(), {
      text: newMessage,
      senderId: user.uid,
      senderName: user.displayName.split(' ')[0],
      createdAt: new Date()
    });
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full px-4 pb-2"> {/* Added padding for chat view */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10 flex-none pt-2">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-white"><ArrowLeft size={20} /></button>
        <div>
          <h3 className="font-bold text-white">{chat.type === 'group' ? chat.to : chat.name}</h3>
          <p className="text-xs text-green-400">{chat.type === 'group' ? 'Group Chat' : 'Private Chat'}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 mb-4 scrollbar-hide">
        {messages.map(msg => {
          const isMe = msg.senderId === user.uid;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-br-none' : 'bg-surface border border-white/10 text-gray-200 rounded-bl-none'}`}>
                {chat.type === 'group' && !isMe && <span className="text-[10px] text-accent block mb-1 font-bold">{msg.senderName}</span>}
                {msg.text}
              </div>
            </div>
          )
        })}
      </div>
      <form onSubmit={handleSend} className="relative flex-none">
        <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="w-full bg-surface border border-white/10 rounded-full py-3 pl-4 pr-12 text-white text-sm focus:outline-none focus:border-primary" />
        <button type="submit" className="absolute right-2 top-2 bg-primary p-1.5 rounded-full text-white"><Send size={16} /></button>
      </form>
    </div>
  );
}

export default ChatData;
