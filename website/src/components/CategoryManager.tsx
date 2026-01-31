"use client";

import { useState, ReactNode } from "react";
import { Category } from "@/types";

interface CategoryManagerProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Category, originalId?: string) => Promise<void>;
  onDelete: (id: string, categoryName: string) => Promise<void>;
  recipeCounts: Record<string, number>;
}

const availableIcons = [
  { id: "potato", label: "Kartoffel" },
  { id: "pasta", label: "Pasta" },
  { id: "casserole", label: "Auflauf" },
  { id: "beans", label: "Bohnen" },
  { id: "soup", label: "Suppe" },
  { id: "salad", label: "Salat" },
];

const availableColors = [
  "#D97706", // Amber
  "#DC2626", // Red
  "#7C3AED", // Purple
  "#059669", // Green
  "#0891B2", // Cyan
  "#65A30D", // Lime
  "#DB2777", // Pink
  "#2563EB", // Blue
  "#EA580C", // Orange
  "#4F46E5", // Indigo
];

const iconComponents: Record<string, ReactNode> = {
  potato: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <ellipse cx="12" cy="12" rx="9" ry="7" />
      <circle cx="8" cy="10" r="1" fill="white" opacity="0.5" />
      <circle cx="14" cy="9" r="0.8" fill="white" opacity="0.5" />
      <circle cx="10" cy="14" r="0.6" fill="white" opacity="0.5" />
    </svg>
  ),
  pasta: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M4 6c0 0 2-2 8-2s8 2 8 2" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M4 10c0 0 2-2 8-2s8 2 8 2" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M4 14c0 0 2-2 8-2s8 2 8 2" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M6 18c0 0 1.5 2 6 2s6-2 6-2" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  ),
  casserole: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <rect x="3" y="8" width="18" height="10" rx="2" />
      <rect x="2" y="6" width="20" height="3" rx="1" />
      <circle cx="6" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </svg>
  ),
  beans: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <ellipse cx="8" cy="10" rx="4" ry="6" transform="rotate(-20 8 10)" />
      <ellipse cx="16" cy="14" rx="4" ry="6" transform="rotate(20 16 14)" />
      <path d="M6 8 Q8 12, 6 14" stroke="white" strokeWidth="0.5" fill="none" opacity="0.5" />
      <path d="M14 10 Q16 14, 14 18" stroke="white" strokeWidth="0.5" fill="none" opacity="0.5" />
    </svg>
  ),
  soup: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M4 10 Q4 18, 12 18 Q20 18, 20 10 Z" />
      <rect x="3" y="8" width="18" height="3" rx="1" />
      <path d="M8 4 Q9 6, 8 7" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M12 3 Q13 5, 12 6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M16 4 Q17 6, 16 7" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
    </svg>
  ),
  salad: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M4 12 Q4 20, 12 20 Q20 20, 20 12 Z" />
      <ellipse cx="12" cy="12" rx="8" ry="3" fill="white" opacity="0.3" />
      <circle cx="9" cy="11" r="2" fill="white" opacity="0.4" />
      <circle cx="15" cy="12" r="1.5" fill="white" opacity="0.4" />
      <circle cx="12" cy="14" r="1" fill="white" opacity="0.4" />
    </svg>
  ),
};

export default function CategoryManager({
  categories,
  isOpen,
  onClose,
  onSave,
  onDelete,
  recipeCounts,
}: CategoryManagerProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("casserole");
  const [color, setColor] = useState(availableColors[0]);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);

  const resetForm = () => {
    setName("");
    setIcon("casserole");
    setColor(availableColors[0]);
    setError("");
    setEditingCategory(null);
    setIsCreating(false);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setIcon(category.icon);
    setColor(category.color);
    setIsCreating(true);
    setError("");
  };

  const handleNew = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Bitte gib einen Namen ein");
      return;
    }

    const id = editingCategory?.id || name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 20);
    const category: Category = {
      id,
      name: name.trim(),
      icon,
      color,
    };

    try {
      await onSave(category, editingCategory?.id);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    try {
      await onDelete(confirmDelete.id, confirmDelete.name);
      setConfirmDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Löschen");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            Kategorien verwalten
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Kategorie erstellen/bearbeiten */}
          {isCreating ? (
            <form onSubmit={handleSubmit} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 mb-6 border-2 border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                {editingCategory ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Kategorie bearbeiten
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Neue Kategorie
                  </>
                )}
              </h3>

              {/* Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-purple-800 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none text-gray-800"
                  placeholder="z.B. Desserts"
                />
              </div>

              {/* Icon */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-purple-800 mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {availableIcons.map((iconOption) => (
                    <button
                      key={iconOption.id}
                      type="button"
                      onClick={() => setIcon(iconOption.id)}
                      className={`
                        p-3 rounded-lg border-2 transition-all
                        ${icon === iconOption.id
                          ? "border-purple-500 bg-purple-100 scale-110"
                          : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                        }
                      `}
                      title={iconOption.label}
                      style={{ color }}
                    >
                      {iconComponents[iconOption.id]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Farbe */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-purple-800 mb-2">Farbe</label>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((colorOption) => (
                    <button
                      key={colorOption}
                      type="button"
                      onClick={() => setColor(colorOption)}
                      className={`
                        w-10 h-10 rounded-full transition-all border-4
                        ${color === colorOption
                          ? "scale-110 border-gray-800 shadow-lg"
                          : "border-transparent hover:scale-105 hover:border-gray-300"
                        }
                      `}
                      style={{ backgroundColor: colorOption }}
                    />
                  ))}
                </div>
              </div>

              {/* Vorschau */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-purple-800 mb-2">Vorschau</label>
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-white"
                  style={{ backgroundColor: color }}
                >
                  <span style={{ color: "white" }}>
                    {iconComponents[icon]}
                  </span>
                  {name || "Kategorie"}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-purple-700 hover:bg-purple-100 rounded-lg font-medium transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-md"
                >
                  {editingCategory ? "Speichern" : "Erstellen"}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={handleNew}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all mb-6 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Neue Kategorie erstellen
            </button>
          )}

          {/* Kategorienliste */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 mb-3">Bestehende Kategorien</h3>
            {categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Keine Kategorien vorhanden
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: category.color }}
                    >
                      <span style={{ color: "white" }}>
                        {iconComponents[category.icon] || iconComponents.casserole}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">{category.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({recipeCounts[category.name] || 0} Rezepte)
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                      title="Bearbeiten"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setConfirmDelete(category)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      title="Löschen"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Lösch-Bestätigung */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Kategorie löschen?</h3>
                <p className="text-sm text-gray-600">
                  &quot;{confirmDelete.name}&quot; mit {recipeCounts[confirmDelete.name] || 0} Rezepten
                </p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Wenn du diese Kategorie löschst, werden alle zugehörigen Rezepte auf &quot;Ohne Kategorie&quot; gesetzt.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-md"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
