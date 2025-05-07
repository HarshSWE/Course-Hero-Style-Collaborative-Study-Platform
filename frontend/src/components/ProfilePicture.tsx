import React, { ChangeEvent } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { useProfileImage } from "./ProfileImageContext";

const ProfilePicture: React.FC = () => {
  const { image, setImage } = useProfileImage();

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);

      await uploadImage(file);
    }
  };

  const handleRemove = () => {
    setImage(null);
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("profilePicture", file);

    try {
      const res = await fetch("http://localhost:5000/user/profile-picture", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        console.log("Uploaded:", data.filePath);
      } else {
        console.error("Upload failed:", data.message);
      }
    } catch (err) {
      console.error("Error uploading file:", err);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 border rounded-xl w-64 bg-white">
      <div className="w-32 h-32 rounded-full overflow-hidden border mb-4 flex items-center justify-center bg-gray-100">
        {image ? (
          <img
            src={image}
            alt="Profile"
            className="object-cover w-full h-full"
          />
        ) : (
          <PersonOutlineIcon className="text-black" style={{ fontSize: 60 }} />
        )}
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-1 cursor-pointer text-blue-500 font-medium hover:underline">
          <EditIcon fontSize="small" />
          Change
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>

        <button
          onClick={handleRemove}
          className="flex items-center gap-1 text-red-500 font-medium hover:underline"
        >
          <DeleteIcon fontSize="small" />
          Remove
        </button>
      </div>
    </div>
  );
};

export default ProfilePicture;
