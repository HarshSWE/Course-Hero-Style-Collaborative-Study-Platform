import React from "react";

interface FileType {
  _id: string;
  filename: string;
  course: string;
  school: string;
}

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showDropdown: boolean;
  searchResults: FileType[];
  setSelectedFile: (file: FileType) => void;
  setIsModalOpen: (value: boolean) => void;
  setShowDropdown: (value: boolean) => void;
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  setSearchTerm,
  showDropdown,
  searchResults,
  setSelectedFile,
  setIsModalOpen,
  setShowDropdown,
  searchContainerRef,
}) => {
  return (
    <div
      ref={searchContainerRef}
      className="relative w-full flex justify-center"
    >
      <div className="w-full max-w-xl">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search documents by course, school and/or file name…"
          className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition ml-12"
        />
        {showDropdown && searchResults.length > 0 && (
          <div
            className={`absolute left-1/2 transform -translate-x-1/2 mt-1 w-full max-w-xl bg-white border border-gray-300 rounded-md shadow-lg z-50 transition-all duration-300 ml-12 ease-out ${
              showDropdown
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2"
            }`}
          >
            {searchResults.map((file: FileType) => {
              const fileName = file.filename.split("-").slice(-1).join("-");
              return (
                <div
                  key={file._id}
                  onClick={async () => {
                    setSelectedFile(file);
                    setIsModalOpen(true);
                    setShowDropdown(false);
                    try {
                      await fetch(
                        `http://localhost:5000/file/${file._id}/view`,
                        {
                          method: "PUT",
                        }
                      );
                    } catch (error) {
                      console.error("Failed to increment view count", error);
                    }
                  }}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                >
                  <div className="font-medium">{fileName}</div>
                  <div className="text-sm text-gray-500">
                    {file.course} · {file.school}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
