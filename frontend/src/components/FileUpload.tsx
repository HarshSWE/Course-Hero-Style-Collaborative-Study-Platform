import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloseIcon from "@mui/icons-material/Close";
import Home from "./Home";

const FileUpload = () => {
  const [files, setFiles] = useState<
    { url: string; name: string; type: string }[]
  >([]);

  const handleFileChange = (file: File) => {
    const fileUrl = URL.createObjectURL(file);
    setFiles((prev) => [
      ...prev,
      { url: fileUrl, name: file.name, type: file.type },
    ]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles([]);
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
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100">
      <div
        {...getRootProps()}
        className="relative w-[80%] max-w-[1000px] h-[600px] bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 shadow-lg hover:border-blue-500 transition overflow-y-auto"
      >
        {/* Close icon which will lead to home page */}
        <button className="absolute top-4 left-4 text-gray-500 hover:text-gray-700">
          <CloseIcon />
        </button>

        <button
          onClick={clearAllFiles}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600"
        >
          Clear All
        </button>

        <input {...getInputProps()} multiple />

        <div className="w-full h-full flex flex-col items-center justify-start text-center">
          {files.length === 0 ? (
            <div className="mt-[155px] p-8 cursor-pointer transition w-full">
              <UploadFileIcon style={{ fontSize: 64, color: "#1e40af" }} />
              <p className="mt-4 text-lg text-gray-600">
                Drag and drop files or click anywhere to upload
              </p>
            </div>
          ) : (
            <div className="mt-6 w-full overflow-x-auto flex space-x-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="relative flex flex-col items-center bg-gray-50 rounded-lg p-2 shadow text-center min-w-[120px]"
                >
                  {/* Individual file remove feature */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="absolute top-1 left-1 text-gray-500 hover:text-red-500"
                  >
                    <CloseIcon style={{ fontSize: 10 }} />
                  </button>

                  {file.type.startsWith("image/") ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={file.url}
                        alt={file.name}
                        className="max-w-[100px] h-[100px] object-cover rounded"
                        onClick={(e) => e.stopPropagation()} // Prevent triggering dropzone when clicking image
                      />
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm mt-2 underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open
                      </a>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-4xl">📄</div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open PDF
                      </a>
                    </div>
                  )}

                  {/* Truncated file name with ellipsis */}
                  <p className="mt-2 text-xs break-words max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
