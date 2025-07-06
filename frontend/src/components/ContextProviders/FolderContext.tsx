import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface Folder {
  _id: string;
  name: string;
}

type FolderContextType = {
  folders: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  folderName: string;
  setFolderName: React.Dispatch<React.SetStateAction<string>>;
  fetchFolders: () => Promise<void>;
};

// Create a React context to hold folder-related state and actions
const FolderContext = createContext<FolderContextType | undefined>(undefined);

// Custom hook to access the FolderContext
// Throws an error if used outside of a FolderProvider to ensure valid usage
export const useFolderContext = () => {
  const context = useContext(FolderContext);
  if (!context) {
    throw new Error("useFolderContext must be used within a FolderProvider");
  }
  return context;
};

type FolderProviderProps = {
  children: ReactNode;
};

export const FolderProvider: React.FC<FolderProviderProps> = ({ children }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderName, setFolderName] = useState("");

  const fetchFolders = async () => {
    try {
      const res = await fetch("http://localhost:5000/folders/all", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      console.log("Fetched folders:", data);

      setFolders(data);
    } catch (err) {
      console.error("Error fetching folders:", err);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  return (
    <FolderContext.Provider
      value={{ folders, setFolders, folderName, setFolderName, fetchFolders }}
    >
      {children}
    </FolderContext.Provider>
  );
};
