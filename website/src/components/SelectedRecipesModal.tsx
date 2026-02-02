"use client";

import { useMemo } from "react";
import { Recipe, Category } from "@/types";

interface SelectedRecipesModalProps {
  recipes: Recipe[];
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onRemove: (recipeName: string) => void;
  onClearAll: () => void;
  onGeneratePdf: () => void;
}

export default function SelectedRecipesModal({
  recipes,
  categories,
  isOpen,
  onClose,
  onRemove,
  onClearAll,
  onGeneratePdf,
}: SelectedRecipesModalProps) {
  if (!isOpen) return null;

  const getCategoryData = (categoryName: string | undefined) => {
    return categories.find(c => c.name === categoryName);
  };

  // Rezepte alphabetisch nach Kategorie sortieren
  const sortedRecipes = useMemo(() => {
    return [...recipes].sort((a, b) => {
      const catA = a.category || "";
      const catB = b.category || "";
      if (catA !== catB) {
        // Ohne Kategorie ans Ende
        if (!catA) return 1;
        if (!catB) return -1;
        return catA.localeCompare(catB, "de");
      }
      // Innerhalb einer Kategorie nach Name sortieren
      return a.name.localeCompare(b.name, "de");
    });
  }, [recipes]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            Ausgewählte Rezepte ({recipes.length})
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Rezeptliste */}
        <div className="flex-1 overflow-y-auto p-4">
          {recipes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-4">📋</div>
              <p>Keine Rezepte ausgewählt</p>
              <p className="text-sm mt-2">Wähle Rezepte in der Übersicht aus, um sie hier zu sehen.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {sortedRecipes.map((recipe) => {
                const categoryData = getCategoryData(recipe.category);
                return (
                  <li
                    key={recipe.name}
                    className="flex items-center justify-between bg-amber-50 rounded-lg px-4 py-3 border border-amber-200 group hover:bg-amber-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-amber-900 truncate block">
                        {recipe.name}
                      </span>
                      {categoryData && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1"
                          style={{
                            backgroundColor: `${categoryData.color}20`,
                            color: categoryData.color,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: categoryData.color }}
                          />
                          {categoryData.name}
                        </span>
                      )}
                      <span className="text-xs text-amber-600 ml-2">
                        {recipe.ingredients.length} Zutat{recipe.ingredients.length !== 1 ? "en" : ""}
                      </span>
                    </div>
                    <button
                      onClick={() => onRemove(recipe.name)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Aus Auswahl entfernen"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer mit Aktionen */}
        <div className="border-t border-amber-200 px-6 py-4 bg-amber-50 flex justify-between items-center gap-4">
          <button
            onClick={onClearAll}
            disabled={recipes.length === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              recipes.length > 0
                ? "text-red-600 hover:bg-red-100"
                : "text-gray-400 cursor-not-allowed"
            }`}
          >
            Alle entfernen
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Schließen
            </button>
            <button
              onClick={() => {
                onGeneratePdf();
                onClose();
              }}
              disabled={recipes.length === 0}
              className={`px-5 py-2 rounded-lg font-medium transition-colors shadow-md flex items-center gap-2 ${
                recipes.length > 0
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              PDF erstellen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
