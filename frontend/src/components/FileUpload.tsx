import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import { motion, AnimatePresence } from "framer-motion";

type FileUploadProps = {
  inlineMode?: boolean;
};

type UploadedFile = {
  file: File;
  serverFilename?: string;
  course: string;
  school: string;
};

const FileUpload: React.FC<FileUploadProps> = ({ inlineMode = false }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [shared, setShared] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = (file: File) => {
    setFiles((prev) => [...prev, { file, course: "", school: "" }]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles([]);
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  const handleInputChange = (
    index: number,
    field: "course" | "school",
    value: string
  ) => {
    setFiles((prev) =>
      prev.map((file, i) => (i === index ? { ...file, [field]: value } : file))
    );
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const { course, school } = files[i];
      if (!course || !school) {
        setErrorMessage("Please enter both course and school for each file");
        setTimeout(() => setErrorMessage(""), 3000);
        return;
      }
    }

    const formData = new FormData();
    files.forEach(({ file, course, school }) => {
      formData.append("files", file);
      formData.append("courses", course!);
      formData.append("schools", school!);
    });

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/file/upload", {
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

        <AnimatePresence>
          {shared && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute top-6 left-[38%] z-60"
            >
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded shadow">
                Files Successfully Shared!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute top-6 left-[33%] z-60"
            >
              <div className="bg-red-100 text-red-800 px-4 py-2 rounded shadow">
                {errorMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
              {files.map(({ file, course, school }, index) => {
                const fileUrl = URL.createObjectURL(file);
                const isImage = file.type.startsWith("image/");
                const isExpanded = expandedIndex === index;

                return (
                  <div
                    key={index}
                    className="relative flex flex-col items-center bg-gray-50 rounded-lg p-4 shadow-md text-center w-[140px] min-h-[220px] overflow-hidden"
                  >
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="absolute top-1 left-1 bg-red-500 text-white w-5 h-5 rounded-full shadow-md hover:bg-red-600 flex items-center justify-center z-10"
                      title="Delete file"
                    >
                      <DeleteIcon style={{ fontSize: 12 }} />
                    </IconButton>

                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(index);
                      }}
                      className="absolute top-1 right-1 bg-blue-500 text-white w-5 h-5 rounded-full shadow-md hover:bg-blue-600 flex items-center justify-center z-10"
                      title="Add details"
                    >
                      <AddIcon style={{ fontSize: 13 }} />
                    </IconButton>

                    {isImage ? (
                      <div className="flex flex-col items-center pt-6">
                        <img
                          src={fileUrl}
                          alt={file.name}
                          className="max-w-[100px] h-[100px] object-cover rounded"
                        />
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm mt-1 underline"
                        >
                          Open Image
                        </a>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-6">
                        <div className="w-[80px] h-[108px] flex items-center justify-center bg-white border rounded text-4xl">
                          📄
                        </div>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm mt-1 underline"
                        >
                          Open PDF
                        </a>
                      </div>
                    )}

                    <p className="mt-2 text-xs break-words max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {file.name}
                    </p>

                    {isExpanded && (
                      <div
                        className="mt-2 w-full flex flex-col gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          placeholder="Course"
                          value={course || ""}
                          onChange={(e) =>
                            handleInputChange(index, "course", e.target.value)
                          }
                          className="text-xs px-2 py-1 border rounded w-full"
                        />
                        <input
                          type="text"
                          placeholder="School"
                          value={school || ""}
                          onChange={(e) =>
                            handleInputChange(index, "school", e.target.value)
                          }
                          className="text-xs px-2 py-1 border rounded w-full"
                        />
                      </div>
                    )}
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
