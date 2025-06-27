import React from "react";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ProfilePicture from "./ProfilePicture";

type ProfileImageModalProps = {
  image: string | null;
  showProfilePic: boolean;
  setShowProfilePic: React.Dispatch<React.SetStateAction<boolean>>;
};

const ProfileImageModal: React.FC<ProfileImageModalProps> = ({
  image,
  showProfilePic,
  setShowProfilePic,
}) => {
  return (
    <div className="relative mr-10">
      <button
        onClick={() => setShowProfilePic((prev) => !prev)}
        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer"
        title="Profile Picture"
      >
        {image ? (
          <img
            src={image}
            alt="Profile"
            className="object-cover w-full h-full rounded-full"
          />
        ) : (
          <PersonOutlineIcon className="text-black w-6 h-6" />
        )}
      </button>

      {showProfilePic && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10">
          <ProfilePicture />
        </div>
      )}
    </div>
  );
};

export default ProfileImageModal;
