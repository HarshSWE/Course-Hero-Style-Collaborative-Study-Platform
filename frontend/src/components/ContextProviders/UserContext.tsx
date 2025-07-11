import { jwtDecode } from "jwt-decode";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

interface DecodedToken {
  id: string;
  name: string;
  exp: number;
  iat: number;
}

interface User {
  _id: string;
  name: string;
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  refreshUser: () => Promise<void>;
  isAuthenticated: () => boolean;
}

// Create a React context to hold user-related state and actions.
const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  const isAuthenticated = () => !!user;

  // Function to refresh and fetch user data from token and API
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      return;
    }

    try {
      // Decode JWT token to extract user ID
      const decoded: DecodedToken = jwtDecode(token);
      console.log("Decoded token:", decoded);

      const userId = decoded.id;

      if (!userId) throw new Error("User ID missing in token");

      // Fetch user details from API using the decoded user ID
      const res = await fetch(`http://localhost:5000/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      setUser({ _id: decoded.id, name: data.name });
    } catch (err) {
      console.error("Error decoding or fetching user:", err);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <UserContext.Provider
      value={{ user, setUser, refreshUser, isAuthenticated }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to access the UserContext.
// Throws an error if called outside of a UserProvider to ensure valid usage.
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
