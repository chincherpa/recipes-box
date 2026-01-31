"use client";

import { Recipe, Category } from "@/types";

interface RecipeCardProps {
  recipe: Recipe;
  categories: Category[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
}

export default function RecipeCard({ recipe, categories, onEdit, onDelete }: RecipeCardProps) {
  const categoryData = categories.find(c => c.name === recipe.category);

  return (
    <div className="bg-white rounded-xl shadow-md border border-amber-200 overflow-hidden group hover:shadow-lg transition-shadow">
      {/* Header mit Aktionen */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-3 flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-amber-900 text-lg truncate">
            {recipe.name}
          </h3>
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
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <button
            onClick={() => onEdit(recipe)}
            className="p-2 hover:bg-amber-200 rounded-lg transition-colors"
            title="Bearbeiten"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-700" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(recipe)}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
            title="Löschen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Zutaten */}
      <div className="p-4">
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="text-sm">
              <div className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <div>
                  <span className="font-medium text-gray-800">
                    {ing.menge} {ing.zutat}
                  </span>
                  {ing.taetigkeit && (
                    <p className="text-amber-600 italic text-xs mt-0.5">
                      {ing.taetigkeit}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-600">
        {recipe.ingredients.length} Zutat{recipe.ingredients.length !== 1 ? "en" : ""}
      </div>
    </div>
  );
}
