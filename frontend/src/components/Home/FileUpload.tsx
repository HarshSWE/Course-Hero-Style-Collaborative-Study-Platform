import React, { useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import WebViewer from "@pdftron/webviewer";
import { motion, AnimatePresence } from "framer-motion";

type FileUploadProps = {
  inlineMode?: boolean;
};

type UploadedFile = {
  id: string;
  file: File;
  serverFilename?: string;
  course: string;
  school: string;
};

const FileUpload: React.FC<FileUploadProps> = ({ inlineMode = false }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [shared, setShared] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingFile, setEditingFile] = useState<UploadedFile | null>(null);

  const viewerRef = useRef<HTMLDivElement>(null);

  // Handle file selection from dropzone
  const handleFileChange = (file: File) => {
    const newFile: UploadedFile = {
      id: crypto.randomUUID(),
      file,
      course: "",
      school: "",
    };
    setFiles((prev) => [...prev, newFile]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const clearAllFiles = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles([]);
  };

  // Toggle expand/collapse of course/school inputs
  const toggleExpand = (id: string) => {
    setExpandedIndex((prev) => (prev === id ? null : id));
  };

  // Update course or school value for a file
  const handleInputChange = (
    id: string,
    field: "course" | "school",
    value: string
  ) => {
    setFiles((prev) =>
      prev.map((file) => (file.id === id ? { ...file, [field]: value } : file))
    );
  };

  // Share/upload files to backend after validation
  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (files.length === 0) return;
    // Validate required fields for each file
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

  // Initialize dropzone config
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

  const convertImageToPDF = async (imageFile: File): Promise<File> => {
    const img = new Image();
    img.src = URL.createObjectURL(imageFile);

    await new Promise((resolve) => (img.onload = resolve));

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(img, 0, 0);

    return new Promise<File>((resolve) => {
      canvas.toBlob(async (blob) => {
        const pdfBlob = await createPdfFromImageBlob(blob!);
        resolve(
          new File([pdfBlob], imageFile.name.replace(/\.\w+$/, ".pdf"), {
            type: "application/pdf",
          })
        );
      }, "image/jpeg");
    });
  };

  const createPdfFromImageBlob = async (blob: Blob): Promise<Blob> => {
    const pdfLib = await import("pdf-lib");
    const { PDFDocument } = pdfLib;

    const pdfDoc = await PDFDocument.create();
    const imageBytes = await blob.arrayBuffer();
    const jpgImage = await pdfDoc.embedJpg(imageBytes);

    const page = pdfDoc.addPage([jpgImage.width, jpgImage.height]);
    page.drawImage(jpgImage, { x: 0, y: 0 });

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
  };

  // Initialize WebViewer when a file is being edited
  useEffect(() => {
    if (!editingFile || !viewerRef.current) return;

    const loadFile = editingFile.file;
    const fileUrl = URL.createObjectURL(loadFile);
    console.log("Loading file in WebViewer:", loadFile);

    let viewerInstance: any;

    WebViewer(
      {
        path: "/lib/webviewer",
        initialDoc: fileUrl,
        licenseKey: process.env.REACT_APP_PDFTRON_KEY,
        ui: "legacy",
      },
      viewerRef.current
    ).then((instance) => {
      viewerInstance = instance;

      instance.UI.loadDocument(fileUrl, {
        filename: loadFile.name,
      });

      instance.UI.setHeaderItems((header) => {
        header.push({
          type: "actionButton",
          img: '<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M17 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zM12 19c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>',
          title: "Save",
          onClick: async () => {
            const { documentViewer, annotationManager } = instance.Core;
            const xfdfString = await annotationManager.exportAnnotations();
            const doc = await documentViewer.getDocument().getFileData({
              xfdfString,
              downloadType: "pdf",
            });

            const annotatedBlob = new Blob([doc], { type: "application/pdf" });
            const updatedFile = new File(
              [annotatedBlob],
              editingFile!.file.name,
              {
                type: "application/pdf",
              }
            );

            setFiles((prev) =>
              prev.map((f) =>
                f.id === editingFile!.id ? { ...f, file: updatedFile } : f
              )
            );

            setEditingFile(null);
          },
        });
      });
    });

    return () => {
      if (viewerInstance) {
        viewerInstance.UI.closeDocument();
      }
      URL.revokeObjectURL(fileUrl);
    };
  }, [editingFile]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      {/* Dropzone container */}

      <div
        {...getRootProps()}
        className="relative w-[90%] max-w-[1200px] h-[650px] bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 shadow-lg hover:border-blue-500 transition overflow-y-auto"
      >
        {/* Invisible file input hooked to dropzone */}
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
        {/*Success notification for file sharing */}
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
        {/* Error notification */}
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

        {/* Upload instructions or list of uploaded files */}
        <div className="w-full h-full flex flex-col items-center justify-start text-center">
          {/* If no files uploaded */}
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full w-full p-8 cursor-pointer transition">
              <UploadFileIcon style={{ fontSize: 64, color: "#1e40af" }} />
              <p className="mt-4 text-lg text-gray-600">
                Drag and drop files or click anywhere to upload
              </p>
            </div>
          ) : (
            // If files exist, show file cards
            <div className="mt-6 w-full flex flex-wrap gap-x-4 gap-y-6 justify-start items-start">
              {files.map(({ id, file, course, school }, index) => {
                const fileUrl = URL.createObjectURL(file);
                const isImage = file.type.startsWith("image/");
                const isExpanded = expandedIndex === id;

                return (
                  // Individual file card
                  <div
                    key={index}
                    className="relative flex flex-col items-center bg-gray-50 rounded-lg p-4 shadow-md text-center w-[140px] min-h-[220px] overflow-hidden"
                  >
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(id);
                      }}
                      className="absolute top-1 left-1 bg-red-500 text-white w-5 h-5 rounded-full shadow-md hover:bg-red-600 flex items-center justify-center z-10"
                      title="Delete file"
                    >
                      <DeleteIcon style={{ fontSize: 12 }} />
                    </IconButton>

                    {/* Edit/annotate file button */}
                    <IconButton
                      onClick={async (e) => {
                        e.stopPropagation();
                        const fileItem = files[index];
                        if (fileItem.file.type.startsWith("image/")) {
                          const pdfFile = await convertImageToPDF(
                            fileItem.file
                          );
                          setEditingFile({ ...fileItem, file: pdfFile });

                          setFiles((prev) =>
                            prev.map((f, i) =>
                              i === index ? { ...f, file: pdfFile } : f
                            )
                          );
                        } else {
                          setEditingFile(fileItem);
                        }
                      }}
                      className="absolute top-1 left-15 bg-green-500 text-white w-5 h-5 rounded-full shadow-md hover:bg-green-600 flex items-center justify-center z-10"
                      title="Edit file"
                    >
                      <EditIcon style={{ fontSize: 12 }} />
                    </IconButton>

                    {/* Toggle add course/school details */}
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(id);
                      }}
                      className="absolute top-1 right-1 bg-blue-500 text-white w-5 h-5 rounded-full shadow-md hover:bg-blue-600 flex items-center justify-center z-10"
                      title="Add details"
                    >
                      <AddIcon style={{ fontSize: 13 }} />
                    </IconButton>

                    {/*If image file, show image preview */}
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
                      // Otherwise show PDF icon
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

                    {/* Expanded input fields for course and school for a file */}
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
                            handleInputChange(id, "course", e.target.value)
                          }
                          className="text-xs px-2 py-1 border rounded w-full"
                        />
                        <input
                          type="text"
                          placeholder="School"
                          value={school || ""}
                          onChange={(e) =>
                            handleInputChange(id, "school", e.target.value)
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

      {/* WebViewer overlay modal when editing a file */}
      {editingFile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setEditingFile(null)}
        >
          <div
            className="w-[90vw] h-[90vh] bg-white rounded-lg overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div ref={viewerRef} className="w-full h-full" />
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
