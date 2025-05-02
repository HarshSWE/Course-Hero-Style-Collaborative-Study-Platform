import React, { useEffect, useRef, useState } from "react";
import FileUpload from "./FileUpload";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark } from "@fortawesome/free-solid-svg-icons";
import { faBookmark as farBookmark } from "@fortawesome/free-regular-svg-icons";
import InsertCommentIcon from "@mui/icons-material/InsertComment";
import CommentsModal from "./CommentsModal";

const Home = () => {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookmarkedFiles, setBookmarkedFiles] = useState<Set<string>>(
    new Set()
  );
  const [showComments, setShowComments] = useState(false);

  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    const fetchBookmarkedFileIds = async () => {
      try {
        const res = await fetch("http://localhost:5000/bookmarked-files", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        const ids = data.map((file: any) => file._id);
        setBookmarkedFiles(new Set(ids));
      } catch (err) {
        console.error("Error fetching bookmarks:", err);
      }
    };

    fetchBookmarkedFileIds();
  }, []);

  const debouncedSearch = useRef(
    debounce(async (term: string) => {
      if (!term.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:5000/search?q=${encodeURIComponent(term)}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!res.ok) throw new Error("Search failed");

        const data = await res.json();
        setSearchResults(data);
        setShowDropdown(true);
      } catch (error) {
        console.error("Search error:", error);
      }
    }, 300)
  ).current;

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleBookmark = async (fileId: string) => {
    const isBookmarked = bookmarkedFiles.has(fileId);
    const url = isBookmarked
      ? `http://localhost:5000/unbookmark/${fileId}`
      : `http://localhost:5000/bookmark/${fileId}`;
    const method = isBookmarked ? "DELETE" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) throw new Error("Failed to toggle bookmark");

      setBookmarkedFiles((prev) => {
        const newSet = new Set(prev);
        isBookmarked ? newSet.delete(fileId) : newSet.add(fileId);
        return newSet;
      });
    } catch (error) {
      console.error("Bookmark toggle error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full bg-white shadow px-6 py-4 flex items-center justify-between">
        <div
          ref={searchContainerRef}
          className="relative w-full flex justify-center"
        >
          <div className="w-full max-w-xl">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for Documents..."
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute left-1/2 transform -translate-x-1/2 mt-1 w-full max-w-xl bg-white border border-gray-300 rounded-md shadow-lg z-50">
                {searchResults.map((file: any) => {
                  const fileName = file.filename.split("-").slice(-1).join("-");
                  return (
                    <div
                      key={file._id}
                      onClick={() => {
                        setSelectedFile(file);
                        setIsModalOpen(true);
                        setShowDropdown(false);
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

        <button
          onClick={handleLogout}
          className="text-gray-700 font-semibold hover:text-red-600 transition"
        >
          Logout
        </button>
      </div>

      <div className="flex px-8 py-6">
        <div className="space-y-4 mr-10">
          <button
            onClick={() => setShowFileUpload(true)}
            className="w-44 h-12 bg-white shadow transform -skew-x-6 flex items-center justify-center border border-gray-300 hover:bg-blue-100 transition font-medium text-black"
            style={{ transform: "skewX(-12deg)" }}
          >
            <span className="transform skew-x-12 flex flex-col items-center leading-tight">
              <span>Share to</span>
              <span>Community</span>
            </span>
          </button>

          <button
            onClick={() => setShowFileUpload(false)}
            className="w-44 h-12 bg-white shadow transform -skew-x-6 flex items-center justify-center border border-gray-300 hover:bg-gray-100 transition font-medium"
            style={{ transform: "skewX(-12deg)" }}
          >
            <span className="transform skew-x-12">Saved</span>
          </button>

          <button
            onClick={() => alert("Shared documents clicked")}
            className="w-44 h-12 bg-white shadow transform -skew-x-6 flex items-center justify-center border border-gray-300 hover:bg-gray-100 transition font-medium"
            style={{ transform: "skewX(-12deg)" }}
          >
            <span className="transform skew-x-12">Shared</span>
          </button>
        </div>

        <div className="flex-1">
          {showFileUpload ? <FileUpload inlineMode /> : null}
        </div>
      </div>

      {isModalOpen && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-5xl h-[90vh] relative flex flex-col">
            {/* Bookmark Button */}
            <button
              onClick={() => toggleBookmark(selectedFile._id)}
              className="absolute top-2 left-2 text-2xl text-blue-500"
              title="Bookmark"
            >
              {bookmarkedFiles.has(selectedFile._id) ? (
                <FontAwesomeIcon icon={faBookmark} />
              ) : (
                <FontAwesomeIcon icon={farBookmark} />
              )}
            </button>

            {/* Comments Button */}
            <button
              onClick={() => setShowComments(true)}
              className="absolute top-2 left-1/2 transform -translate-x-1/2 text-blue-500"
              title="View Comments"
            >
              <InsertCommentIcon fontSize="large" />
            </button>

            {/* Close Modal Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
            >
              &times;
            </button>

            <div className="mb-4 mt-8 text-center">
              <h2 className="text-xl font-semibold">
                {selectedFile.originalname}
              </h2>
            </div>

            {/* File preview and CommentSection overlay */}
            <div className="relative flex-1 overflow-hidden">
              {selectedFile.filename.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={`http://localhost:5000/uploads/${selectedFile.filename}`}
                  className="w-full h-full"
                  title="PDF Preview"
                />
              ) : selectedFile.filename.match(/\.(jpg|jpeg|png|gif)$/) ? (
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={`http://localhost:5000/uploads/${selectedFile.filename}`}
                    alt="Uploaded file"
                    className="object-contain max-h-full max-w-full"
                  />
                </div>
              ) : (
                <p>Preview not available for this file type.</p>
              )}

              {/* Overlay Comment Section */}
              {showComments && (
                <div className="absolute inset-0 bg-white bg-opacity-80 overflow-y-auto">
                  <CommentsModal
                    isOpen={true}
                    fileURL={`http://localhost:5000/uploads/${selectedFile.filename}`}
                    onClose={() => setShowComments(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
