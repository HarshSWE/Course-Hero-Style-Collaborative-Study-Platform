import React from "react";
import Checkbox from "@mui/material/Checkbox";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

interface Friend {
  _id: string;
  name: string;
  profilePictureUrl?: string;
}

interface AddFriendsProps {
  friends: Friend[];
  selectedFriendIds: string[];
  handleToggleFriend: (friendId: string) => void;
  handleAddFriendsToGroup: () => void;
}

const AddFriends: React.FC<AddFriendsProps> = ({
  friends,
  selectedFriendIds,
  handleToggleFriend,
  handleAddFriendsToGroup,
}) => {
  return (
    <div className="overflow-y-auto px-4 py-3 space-y-3 max-h-[calc(100%-4rem)]">
      <div className="font-medium text-slate-700 flex items-center gap-2">
        <span>Select friends to add</span>
      </div>

      {friends.map((friend) => (
        <div key={friend._id} className="flex items-center gap-2">
          <Checkbox
            checked={selectedFriendIds.includes(friend._id)}
            onChange={() => handleToggleFriend(friend._id)}
          />
          {friend.profilePictureUrl ? (
            <img
              src={friend.profilePictureUrl}
              alt={friend.name}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-slate-600">
              <PersonOutlineIcon fontSize="small" />
            </div>
          )}
          <span className="text-slate-800">{friend.name}</span>
        </div>
      ))}

      <button
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleAddFriendsToGroup}
        disabled={selectedFriendIds.length === 0}
      >
        Add
      </button>
    </div>
  );
};

export default AddFriends;
