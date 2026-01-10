import { createContext, useState, useEffect, useContext } from 'react';
import { db } from '../firebase'; 
// FIX: Merged all imports into one line to prevent "duplicate declaration" errors
import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';

const RideContext = createContext();

export const RideProvider = ({ children }) => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. REAL-TIME LISTENER (With Error Logging)
  useEffect(() => {
    // We order by createdAt so newest rides show first
    const q = query(collection(db, "rides"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ridesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log("✅ Rides Fetched Successfully:", ridesData); 
      setRides(ridesData);
      setLoading(false);
    }, (error) => {
      console.error("❌ FIREBASE READ ERROR:", error.message);
      if (error.message.includes("index")) {
        console.log("👉 Open the link in the error message above to create the index!");
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. ADD RIDE
  const addRide = async (rideDetails) => {
    try {
      await addDoc(collection(db, "rides"), {
        ...rideDetails,
        createdAt: new Date(),
        passengers: [],
        isPaused: false, // Initialize pause state
        forceAllow: false // Initialize force allow state (New Feature)
      });
    } catch (error) {
      console.error("Error adding ride: ", error);
    }
  };

  // 3. DELETE RIDE
  const deleteRide = async (rideId) => {
    try {
      await deleteDoc(doc(db, "rides", rideId));
    } catch (error) {
      console.error("Error deleting ride:", error);
    }
  };

  // 4. TOGGLE PAUSE
  const toggleRidePause = async (rideId, currentStatus) => {
    try {
      const rideRef = doc(db, "rides", rideId);
      await updateDoc(rideRef, { 
        isPaused: !currentStatus 
      });
    } catch (error) {
      console.error("Error toggling pause:", error);
    }
  };

  // 5. TOGGLE FORCE ALLOW (New Feature)
  const toggleForceAllow = async (rideId, currentStatus) => {
    try {
        const rideRef = doc(db, "rides", rideId);
        await updateDoc(rideRef, { 
          forceAllow: !currentStatus 
        });
      } catch (error) {
        console.error("Error toggling force allow:", error);
      }
  };

  return (
    <RideContext.Provider value={{ 
      rides, 
      addRide, 
      deleteRide, 
      toggleRidePause, 
      toggleForceAllow, // <--- Export this
      loading 
    }}>
      {children}
    </RideContext.Provider>
  );
};

export const useRides = () => useContext(RideContext);