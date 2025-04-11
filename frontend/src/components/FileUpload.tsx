import UploadFileIcon from "@mui/icons-material/UploadFile";

const FileUpload = () => {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-[400px] h-[600px] bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-lg hover:border-blue-500 transition">
        <UploadFileIcon style={{ fontSize: 64, color: "#1e40af" }} />
        <p className="mt-6 text-xl">
          Drag and drop or{" "}
          <span className="text-blue-600 underline cursor-pointer hover:text-blue-800">
            upload
          </span>{" "}
          your study document
        </p>
      </div>
    </div>
  );
};

export default FileUpload;
