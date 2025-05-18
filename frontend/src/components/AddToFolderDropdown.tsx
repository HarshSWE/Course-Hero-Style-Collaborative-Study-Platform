import { useState, useEffect } from "react";

interface Folder {
  _id: string;
  name: string;
}

interface AddToFolderDropdownProps {
  fileId: string;
  onFileAdded?: () => void;
}

const AddToFolderDropdown: React.FC<AddToFolderDropdownProps> = ({
  fileId,
  onFileAdded,
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/folders/all", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setFolders(data);
    } catch (err) {
      console.error("Error fetching folders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleAddToFolder = async (folderId: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/folders/${folderId}/file`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ fileId }),
        }
      );

      if (!res.ok) throw new Error("Failed to add file to folder");

      if (onFileAdded) onFileAdded();
    } catch (err) {
      console.error("Error adding file to folder:", err);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <div className="absolute z-50 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
        {loading ? (
          <div className="p-4 text-base text-black font-medium text-center">
            Loading folders...
          </div>
        ) : folders.filter((f) => f._id && f.name).length === 0 ? (
          <div className="p-4 text-base text-black font-medium text-center">
            No folders found
          </div>
        ) : (
          folders
            .filter((folder) => folder._id && folder.name)
            .map((folder) => (
              <button
                key={folder._id}
                onClick={() => handleAddToFolder(folder._id)}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
              >
                {folder.name}
              </button>
            ))
        )}
      </div>
    </div>
  );
};

export default AddToFolderDropdown;
