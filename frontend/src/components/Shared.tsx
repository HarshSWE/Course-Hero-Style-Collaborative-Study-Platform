import React, { useState, useEffect } from "react";

const Shared = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [confirmUnshare, setConfirmUnshare] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:5000/myfiles", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch files");
        }

        const data = await response.json();
        setFiles(data);
        console.log("Fetched files:", data);
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };

    fetchFiles();
  }, []);

  const getPreview = (file: any) => {
    const fileExtension = file.filename.split(".").pop()?.toLowerCase();
    const previewSize = {
      width: "150px",
      height: "150px",
    };

    if (
      fileExtension === "png" ||
      fileExtension === "jpg" ||
      fileExtension === "jpeg"
    ) {
      return (
        <img
          src={`http://localhost:5000/uploads/${file.filename}`}
          alt={file.filename}
          style={{
            ...previewSize,
            objectFit: "cover",
            borderRadius: "8px",
            display: "block",
            margin: "0 auto",
          }}
        />
      );
    }

    if (fileExtension === "pdf") {
      return (
        <iframe
          src={`http://localhost:5000/uploads/${file.filename}`}
          width={previewSize.width}
          height={previewSize.height}
          title={file.filename}
          style={{
            borderRadius: "8px",
            display: "block",
            margin: "0 auto",
          }}
        />
      );
    }

    return <p>{file.filename}</p>;
  };

  const cleanFileName = (filename: string) => {
    return filename.replace(/^\d+-/, "");
  };

  const handleUnshare = async (filename: string) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`http://localhost:5000/file/${filename}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to unshare file");
      }

      // Remove the deleted file from state
      setFiles((prevFiles) =>
        prevFiles.filter((file) => file.filename !== filename)
      );
      setConfirmUnshare(null);
    } catch (error) {
      console.error("Error unsharing file:", error);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "20px",
          padding: "10px 0",
        }}
      >
        {files.length === 0 ? (
          <p>No files publicly shared yet.</p>
        ) : (
          files.map((file) => (
            <div
              key={file._id}
              style={{
                backgroundColor: "#f9f9f9",
                borderRadius: "8px",
                padding: "10px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div>{getPreview(file)}</div>
              <div
                style={{
                  marginTop: "10px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "150px",
                  fontWeight: "bold",
                  color: "#007BFF",
                  textAlign: "center",
                }}
              >
                <a
                  href={`http://localhost:5000/uploads/${file.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#007BFF",
                    textDecoration: "none",
                  }}
                >
                  {cleanFileName(file.filename)}
                </a>
              </div>

              {confirmUnshare === file.filename ? (
                <div style={{ marginTop: "10px" }}>
                  <p style={{ marginBottom: "8px" }}>
                    Are you sure you want to delete this file?
                  </p>
                  <button
                    onClick={() => handleUnshare(file.filename)}
                    style={{
                      marginRight: "10px",
                      padding: "6px 12px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmUnshare(null)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmUnshare(file.filename)}
                  style={{
                    marginTop: "10px",
                    padding: "6px 12px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Unshare File
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Shared;
