import { IconButton } from "@mui/material";
import InsertCommentIcon from "@mui/icons-material/InsertComment";
import DeleteIcon from "@mui/icons-material/Delete";
import { PhotoProvider, PhotoView } from "react-photo-view";

interface File {
  _id: string;
  originalname: string;
  filename: string;
  course: string;
  school: string;
}

type FileCardProps = {
  file: File;
  fileUrl: string;
  onCommentClick: (file: File) => void;
  onDeleteClick?: (file: File) => void;
};

export default function FileCard({
  file,
  fileUrl,
  onCommentClick,
  onDeleteClick,
}: FileCardProps) {
  const ext = file.filename.split(".").pop()?.toLowerCase();

  return (
    <div className="relative border rounded-lg overflow-hidden shadow-sm">
      {/* Top icon */}
      {onDeleteClick ? (
        <>
          <InsertCommentIcon
            fontSize="small"
            className="absolute top-2 left-1/2 transform -translate-x-1/2 text-blue-500 cursor-pointer hover:text-blue-600"
            onClick={() => onCommentClick(file)}
          />
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(file);
            }}
            className="absolute top-2 right-2 text-red-500 hover:text-red-600"
            size="small"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ) : (
        <InsertCommentIcon
          fontSize="small"
          className="absolute top-2 right-2 text-blue-500 cursor-pointer hover:text-blue-600"
          onClick={() => onCommentClick(file)}
        />
      )}

      <div className="p-4">
        <p className="font-semibold text-lg">{file.originalname}</p>
        <p className="text-sm text-black-500">
          {file.filename.replace(/^\d+-/, "")}
        </p>
        <p className="text-sm text-black-500">
          {file.course} · {file.school}
        </p>
      </div>

      {ext === "pdf" ? (
        <iframe
          src={fileUrl}
          title={file.originalname}
          className="w-11/12 h-80 object-contain border-t mx-auto"
        />
      ) : ext?.match(/(jpg|jpeg|png|gif)/i) ? (
        <PhotoProvider>
          <PhotoView src={fileUrl}>
            <div>
              <img src={fileUrl} alt={file.originalname} />
            </div>
          </PhotoView>
        </PhotoProvider>
      ) : (
        <div className="p-4 text-gray-500 text-sm border-t">
          No preview available for this file type
        </div>
      )}
    </div>
  );
}
