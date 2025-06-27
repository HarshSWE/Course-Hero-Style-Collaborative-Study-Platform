import { useEffect, useState } from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import InsertCommentIcon from "@mui/icons-material/InsertComment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark as farBookmark } from "@fortawesome/free-regular-svg-icons";
import { faBookmark } from "@fortawesome/free-solid-svg-icons";
import CommentsModal from "../Modals/CommentsModal";

interface File {
  _id: string;
  originalname: string;
  filename: string;
  course: string;
  school: string;
}

const Recommendations = () => {
  const [recommendedFiles, setRecommendedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [bookmarkedFiles, setBookmarkedFiles] = useState<Set<string>>(
    new Set()
  );

  // useEffect runs once on component mount to fetch recommended files
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Step 1: Fetch user's saved/bookmarked files from backend API
        const res = await fetch("http://localhost:5000/bookmarks/all", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const savedFiles = await res.json();

        // Extract only necessary metadata (id, course, school) from saved files
        const fileMetadata = savedFiles.map((file: any) => ({
          _id: file._id,
          course: file.course,
          school: file.school,
        }));

        // Send saved files metadata to Flask recommendation API to get recommended metadata
        const flaskRes = await fetch("http://localhost:8000/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ saved_files: fileMetadata }),
        });

        const recommendedMetadata = await flaskRes.json();
        console.log("Recommended metadata from Flask:", recommendedMetadata);

        // Send recommended metadata back to backend to get full file details
        const matchedRes = await fetch("http://localhost:5000/file/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recommendations: recommendedMetadata }),
        });

        // Store the fully matched recommended files in state
        const fullFiles = await matchedRes.json();
        setRecommendedFiles(fullFiles);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  // Function to toggle bookmarking/unbookmarking a file
  const toggleBookmark = async (fileId: string) => {
    const isBookmarked = bookmarkedFiles.has(fileId);
    const url = `http://localhost:5000/bookmarks/${fileId}`;
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
  if (loading)
    return (
      <div className="text-center p-4 mr-56">Loading recommendations...</div>
    );

  if (recommendedFiles.length === 0)
    return (
      <div className="text-center p-4 mr-64">
        No recommendations found yet, start searching and saving documents!
      </div>
    );
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Recommended for You</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendedFiles.map((file) => {
          const fileUrl = `http://localhost:5000/uploads/${file.filename}`;

          return (
            <div
              key={file._id}
              className="relative border border-gray-300 rounded-lg shadow hover:shadow-lg transition cursor-pointer hover:border-blue-500"
              onClick={() => {
                setSelectedFile(file);
                setIsModalOpen(true);
                setShowComments(false);
              }}
            >
              <div className="p-4">
                <p className="font-semibold text-lg">{file.originalname}</p>
                <p className="text-sm text-black-500">
                  {file.course} · {file.school}
                </p>
                <p className="text-sm text-black-500 mt-2">
                  {file.filename.split("-").slice(1).join("-")}
                </p>
              </div>
              {file.filename.endsWith(".pdf") ? (
                <iframe
                  src={fileUrl}
                  title={file.originalname}
                  className="w-11/12 h-80 object-contain border-t mx-auto"
                />
              ) : file.filename.match(/\.(jpg|jpeg|png|gif)$/i) ? (
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
        })}
      </div>
      {/* Modal popup for file details, preview, bookmarks, and comments */}
      {isModalOpen && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-5xl h-[90vh] relative flex flex-col">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmark(selectedFile._id);
              }}
              className="absolute top-2 left-2 text-2xl text-blue-500"
              title="Bookmark"
            >
              {bookmarkedFiles.has(selectedFile._id) ? (
                <FontAwesomeIcon icon={faBookmark} />
              ) : (
                <FontAwesomeIcon icon={farBookmark} />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(true);
              }}
              className="absolute top-2 left-1/2 transform -translate-x-1/2 text-blue-500"
              title="View Comments"
            >
              <InsertCommentIcon fontSize="large" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(false);
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
            >
              &times;
            </button>
            <div className="mb-4 mt-8 text-center">
              <h2 className="text-xl font-semibold">
                {selectedFile.originalname}
              </h2>
            </div>
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

export default Recommendations;
