import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";

interface ProfileImageContextType {
  image: string | null;
  setImage: (image: string | null) => void;
  refreshProfilePicture: () => Promise<void>;
}

// Create a React context to hold state and actions related to a user's profile image
const ProfileImageContext = createContext<ProfileImageContextType | undefined>(
  undefined
);

// Custom hook to access the ProfileImageContext
// Throws an error if called outside of a ProfileImageProvider to ensure valid usage.
export const useProfileImage = () => {
  const context = useContext(ProfileImageContext);
  if (!context) {
    throw new Error(
      "useProfileImage must be used within a ProfileImageProvider"
    );
  }
  return context;
};

export const ProfileImageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [image, setImage] = useState<string | null>(null);

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

  useEffect(() => {
    fetchProfilePicture();
  }, []);

  return (
    <ProfileImageContext.Provider
      value={{ image, setImage, refreshProfilePicture: fetchProfilePicture }}
    >
      {children}
    </ProfileImageContext.Provider>
  );
};
