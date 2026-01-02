import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ShieldCheck, Lock } from 'lucide-react';

const GenderModal = () => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkGender = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        // If user document doesn't exist OR gender field is missing -> OPEN MODAL
        if (!userSnap.exists() || !userSnap.data().gender) {
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Error checking gender:", error);
      }
    };

    checkGender();
  }, [user]);

  const handleSave = async (gender) => {
    // 1. Confirm First
    if (!window.confirm(`Please confirm you are ${gender}. This is for safety and cannot be changed later.`)) return;

    setLoading(true);
    try {
      // 2. Save to Firebase
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        gender: gender
      }, { merge: true });

      // 3. Close Modal
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving gender:", error);
      alert("Failed to save. Please check your internet connection.");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    // Full Screen Blur Overlay (Blocks interaction with the app)
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
      <div className="bg-surface border border-white/20 p-6 rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden">
        
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>

        <div className="text-center mb-6">
          <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30">
            <ShieldCheck size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Complete Profile</h2>
          <p className="text-gray-400 text-sm">
            For the safety of all students, please verify your gender to continue.
          </p>
        </div>

        <div className="space-y-3">
          <button 
            disabled={loading}
            onClick={() => handleSave('Male')}
            className="w-full py-4 rounded-xl font-bold border border-white/10 bg-white/5 hover:bg-blue-600 hover:border-blue-500 transition-all text-white flex items-center justify-center gap-2 group"
          >
            <span>Male</span>
          </button>

          <button 
            disabled={loading}
            onClick={() => handleSave('Female')}
            className="w-full py-4 rounded-xl font-bold border border-white/10 bg-white/5 hover:bg-pink-600 hover:border-pink-500 transition-all text-white flex items-center justify-center gap-2 group"
          >
            <span>Female</span>
          </button>
        </div>

        <div className="mt-6 text-center">
            <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
                <Lock size={10} /> This action happens only once.
            </p>
        </div>

      </div>
    </div>
  );
};

export default GenderModal;