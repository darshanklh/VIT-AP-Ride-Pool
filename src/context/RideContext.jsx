import { createContext, useState, useEffect, useContext } from 'react';
import { db } from '../firebase'; 
import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';

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
      console.log("✅ Rides Fetched Successfully:", ridesData); // Check your Console for this
      setRides(ridesData);
      setLoading(false);
    }, (error) => {
      // THIS IS THE IMPORTANT PART
      console.error("❌ FIREBASE READ ERROR:", error.message);
      
      // Common fix for Index error:
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
        // Add passengers array for the Chat feature
        passengers: [] 
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

  return (
    <RideContext.Provider value={{ rides, addRide, deleteRide, loading }}>
      {children}
    </RideContext.Provider>
  );
};

export const useRides = () => useContext(RideContext);