import React, { useEffect, useState } from "react";

interface File {
  _id: string;
  originalname: string;
  filename: string;
  path: string;
  userId: string;
  course: string;
  school: string;
}

const Saved = () => {
  const [bookmarkedFiles, setBookmarkedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarkedFiles = async () => {
      try {
        const res = await fetch("http://localhost:5000/bookmarked-files", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        setBookmarkedFiles(data);
      } catch (err) {
        console.error("Error fetching bookmarked files:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedFiles();
  }, []);

  const unbookmarkFile = async (fileId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/unbookmark/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to unbookmark");
      }

      setBookmarkedFiles((prev) => prev.filter((file) => file._id !== fileId));
    } catch (err) {
      console.error("Error unbookmarking file:", err);
    }
  };

  if (loading)
    return <div className="text-center p-4">Loading saved files...</div>;

  if (bookmarkedFiles.length === 0)
    return (
      <div className="text-center p-4">
        You haven’t bookmarked any files yet.
      </div>
    );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Saved Files</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookmarkedFiles.map((file) => {
          const fileUrl = `http://localhost:5000/uploads/${file.filename}`;

          return (
            <div
              key={file._id}
              className="relative border rounded-lg shadow hover:shadow-lg transition cursor-pointer"
              onClick={() => window.open(fileUrl, "_blank")}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  unbookmarkFile(file._id);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs rounded hover:bg-red-600"
              >
                Unbookmark
              </button>

              <div className="p-4">
                <p className="font-semibold text-lg">{file.originalname}</p>
                <p className="text-sm text-gray-500">
                  Stored as: {file.filename}
                </p>
                <p className="text-sm text-gray-500">
                  {file.course} · {file.school}
                </p>
              </div>

              {file.filename.endsWith(".pdf") ? (
                <iframe
                  src={fileUrl}
                  title={file.originalname}
                  className="w-full h-64 border-t"
                />
              ) : file.filename.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img
                  src={fileUrl}
                  alt={file.originalname}
                  className="w-full h-64 object-cover border-t"
                />
              ) : (
                <div className="p-4 text-gray-500 text-sm border-t">
                  No preview available for this file type
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Saved;
