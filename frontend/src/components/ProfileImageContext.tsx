import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";

// Context type with refreshProfilePicture added
interface ProfileImageContextType {
  image: string | null;
  setImage: (image: string | null) => void;
  refreshProfilePicture: () => Promise<void>;
}

// Create context
const ProfileImageContext = createContext<ProfileImageContextType | undefined>(
  undefined
);

// Custom hook for easy access
export const useProfileImage = () => {
  const context = useContext(ProfileImageContext);
  if (!context) {
    throw new Error(
      "useProfileImage must be used within a ProfileImageProvider"
    );
  }
  return context;
};

// Provider component
export const ProfileImageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [image, setImage] = useState<string | null>(null);

  // Fetch function to get profile picture
  const fetchProfilePicture = async () => {
    try {
      const res = await fetch("http://localhost:5000/user/profile-picture", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        console.log("Fetched profile picture:", data.profilePictureUrl);
        setImage(data.profilePictureUrl);
      }
    } catch (err) {
      console.error("Error fetching profile picture:", err);
    }
  };

  // Fetch on initial mount
  useEffect(() => {
    fetchProfilePicture();
  }, []);

  // Provide state, setter, and refresh function
  return (
    <ProfileImageContext.Provider
      value={{ image, setImage, refreshProfilePicture: fetchProfilePicture }}
    >
      {children}
    </ProfileImageContext.Provider>
  );
};
