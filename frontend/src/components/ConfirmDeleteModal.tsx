import React from "react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  filename?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onDontAskAgain: () => void;
  itemType?: "delete" | "unshare";
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  filename,
  onConfirm,
  onCancel,
  onDontAskAgain,
  itemType = "delete",
}) => {
  if (!isOpen) return null;

  const cleanedFilename = filename?.replace(/^\d+-/, "") ?? "this file";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm text-center space-y-4">
        <p className="text-lg font-semibold">
          Are you sure you want to {itemType}{" "}
          <span className="text-black-600 font-bold">{cleanedFilename}</span>?
        </p>

        <div className="flex justify-between gap-3 mt-4">
          <button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg w-full"
          >
            Yes
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg w-full"
          >
            No
          </button>
        </div>

        <button
          onClick={onDontAskAgain}
          className="text-sm text-blue-600 hover:underline"
        >
          Don’t ask again
        </button>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
