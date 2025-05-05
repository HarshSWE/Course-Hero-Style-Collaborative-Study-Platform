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
}

const ProfileImageContext = createContext<ProfileImageContextType | undefined>(
  undefined
);

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

  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        const res = await fetch("http://localhost:5000/user/profile-picture", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          console.log("Fetched on load:", data.profilePictureUrl);
          setImage(data.profilePictureUrl);
        }
      } catch (err) {
        console.error("Error fetching profile picture:", err);
      }
    };

    fetchProfilePicture();
  }, []);

  return (
    <ProfileImageContext.Provider value={{ image, setImage }}>
      {children}
    </ProfileImageContext.Provider>
  );
};
