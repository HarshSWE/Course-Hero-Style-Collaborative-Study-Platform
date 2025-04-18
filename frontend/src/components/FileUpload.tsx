import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteIcon from "@mui/icons-material/Delete";

type FileUploadProps = {
  inlineMode?: boolean;
};

type UploadedFile = {
  file: File;
  serverFilename?: string;
};

const FileUpload: React.FC<FileUploadProps> = ({ inlineMode = false }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [shared, setShared] = useState(false);

  const handleFileChange = (file: File) => {
    setFiles((prev) => [...prev, { file }]);
  };

  const removeFile = async (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles([]);
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    setShared(true);
    e.stopPropagation();

    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(({ file }) => {
      formData.append("files", file);
    });

    const token = localStorage.getItem("token");

    if (!token) {
      console.error("No token found");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/fileupload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setShared(true);
        setTimeout(() => setShared(false), 3000);
      } else {
        console.error("Upload failed", await response.text());
      }
    } catch (error) {
      console.error("Error during upload:", error);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      acceptedFiles.forEach((file) => handleFileChange(file));
    },
    accept: {
      "image/*": [],
      "application/pdf": [],
    },
    multiple: true,
  });

  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <div
        {...getRootProps()}
        className="relative w-[90%] max-w-[1200px] h-[650px] bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 shadow-lg hover:border-blue-500 transition overflow-y-auto"
      >
        <input {...getInputProps()} multiple />

        <button
          onClick={handleShareClick}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
        >
          Share
        </button>

        <button
          onClick={clearAllFiles}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600"
        >
          Clear All
        </button>

        {shared && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-800 px-4 py-2 rounded shadow">
            Files Successfully Shared!
          </div>
        )}

        <div className="w-full h-full flex flex-col items-center justify-start text-center">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full w-full p-8 cursor-pointer transition">
              <UploadFileIcon style={{ fontSize: 64, color: "#1e40af" }} />
              <p className="mt-4 text-lg text-gray-600">
                Drag and drop files or click anywhere to upload
              </p>
            </div>
          ) : (
            <div className="mt-6 w-full flex flex-wrap gap-x-4 gap-y-6 justify-start items-start">
              {files.map(({ file }, index) => {
                const fileUrl = URL.createObjectURL(file);
                return (
                  <div
                    key={index}
                    className="relative flex flex-col items-center bg-gray-50 rounded-lg p-2 shadow text-center min-w-[120px]"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="absolute -top-2 -right-2 bg-white border rounded-full shadow p-1 hover:text-red-500"
                    >
                      <DeleteIcon style={{ fontSize: 14 }} />
                    </button>

                    {file.type.startsWith("image/") ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={fileUrl}
                          alt={file.name}
                          className="max-w-[100px] h-[100px] object-cover rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm mt-2 underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open Image
                        </a>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-[80px] h-[108px] flex items-center justify-center bg-white border rounded text-4xl">
                          📄
                        </div>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open PDF
                        </a>
                      </div>
                    )}

                    <p className="mt-2 text-xs break-words max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {file.name}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
