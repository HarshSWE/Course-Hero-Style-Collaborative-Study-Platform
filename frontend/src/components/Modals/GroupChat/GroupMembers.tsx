import React from "react";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

interface GroupMember {
  _id: string;
  name: string;
  email: string;
  profilePictureUrl?: string;
}

interface GroupMembersProps {
  groupMembers: GroupMember[];
  onBack: () => void;
}

const GroupMembers: React.FC<GroupMembersProps> = ({
  groupMembers,
  onBack,
}) => {
  return (
    <div className="overflow-y-auto px-4 py-3 space-y-3 max-h-[calc(100%-4rem)]">
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium text-slate-700">Group Members</div>
        <IconButton onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>
      </div>

      {groupMembers.map((member) => (
        <div key={member._id} className="flex items-center gap-2">
          {member.profilePictureUrl ? (
            <img
              src={member.profilePictureUrl}
              alt={member.name}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-slate-600">
              <PersonOutlineIcon fontSize="small" />
            </div>
          )}
          <span className="text-slate-800">{member.name}</span>
          <span className="text-sm text-slate-500 ml-2">{member.email}</span>
        </div>
      ))}
    </div>
  );
};

export default GroupMembers;
