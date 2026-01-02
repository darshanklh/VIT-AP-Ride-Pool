import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider } from "../firebase"; // Import from your bridge file
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Listen for login/logout changes automatically
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Login Function
  const googleSignIn = () => {
    return signInWithPopup(auth, googleProvider);
  };

  // 3. Logout Function
  const logout = () => {
    return signOut(auth);
  };

  return (
    <UserContext.Provider value={{ user, googleSignIn, logout }}>
      {!loading && children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);