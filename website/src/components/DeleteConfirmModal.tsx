"use client";

interface DeleteConfirmModalProps {
  recipeName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  recipeName,
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-red-500 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Rezept löschen</h2>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-red-100 rounded-full p-3 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-gray-800">
                Möchtest du das Rezept <strong>&quot;{recipeName}&quot;</strong> wirklich löschen?
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-md"
            >
              Löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
