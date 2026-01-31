"use client";

import { useState, useEffect } from "react";
import { Recipe, Category, Ingredient } from "@/types";

interface RecipeEditorProps {
  recipe: Recipe | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: Recipe, originalName?: string) => void;
}

export default function RecipeEditor({
  recipe,
  categories,
  isOpen,
  onClose,
  onSave,
}: RecipeEditorProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (recipe) {
      setName(recipe.name);
      setCategory(recipe.category || "");
      setIngredients([...recipe.ingredients]);
    } else {
      setName("");
      setCategory(categories.length > 0 ? categories[0].name : "");
      setIngredients([{ zutat: "", menge: "", taetigkeit: "" }]);
    }
    setError("");
  }, [recipe, isOpen, categories]);

  const addIngredient = () => {
    setIngredients([...ingredients, { zutat: "", menge: "", taetigkeit: "" }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: string
  ) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Bitte gib einen Rezeptnamen ein");
      return;
    }

    if (!category) {
      setError("Bitte wähle eine Kategorie aus");
      return;
    }

    const validIngredients = ingredients.filter(
      (ing) => ing.zutat.trim() || ing.menge.trim() || ing.taetigkeit.trim()
    );

    if (validIngredients.length === 0) {
      setError("Bitte gib mindestens eine Zutat ein");
      return;
    }

    onSave(
      { name: name.trim(), category, ingredients: validIngredients },
      recipe?.name
    );
  };

  const selectedCategoryData = categories.find(c => c.name === category);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {recipe ? "Rezept bearbeiten" : "Neues Rezept"}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Rezeptname */}
          <div className="mb-6">
            <label className="block text-amber-900 font-semibold mb-2">
              Rezeptname
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:outline-none transition-colors text-gray-800"
              placeholder="z.B. Kartoffelsalat"
            />
          </div>

          {/* Kategorie */}
          <div className="mb-6">
            <label className="block text-amber-900 font-semibold mb-2">
              Kategorie
            </label>
            {categories.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg">
                Keine Kategorien vorhanden. Bitte erstelle zuerst eine Kategorie.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`
                      flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm
                      transition-all duration-200 border-2
                      ${category === cat.name
                        ? "text-white shadow-md scale-[1.02]"
                        : "hover:scale-[1.01]"
                      }
                    `}
                    style={{
                      backgroundColor: category === cat.name ? cat.color : `${cat.color}15`,
                      borderColor: category === cat.name ? cat.color : `${cat.color}40`,
                      color: category === cat.name ? "white" : cat.color,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: category === cat.name ? "white" : cat.color,
                      }}
                    />
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
            {selectedCategoryData && (
              <div className="mt-2 text-sm text-gray-500">
                Ausgewählt: <span className="font-medium" style={{ color: selectedCategoryData.color }}>{selectedCategoryData.name}</span>
              </div>
            )}
          </div>

          {/* Zutaten */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-amber-900 font-semibold">
                Zutaten
              </label>
              <button
                type="button"
                onClick={addIngredient}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                <span className="text-lg">+</span> Zutat hinzufügen
              </button>
            </div>

            <div className="space-y-3">
              {ingredients.map((ing, index) => (
                <div
                  key={index}
                  className="bg-amber-50 rounded-lg p-4 border border-amber-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-3">
                      <label className="block text-xs text-amber-700 mb-1">
                        Menge
                      </label>
                      <input
                        type="text"
                        value={ing.menge}
                        onChange={(e) =>
                          updateIngredient(index, "menge", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-amber-300 rounded-md focus:border-amber-500 focus:outline-none text-gray-800"
                        placeholder="z.B. 500g"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs text-amber-700 mb-1">
                        Zutat
                      </label>
                      <input
                        type="text"
                        value={ing.zutat}
                        onChange={(e) =>
                          updateIngredient(index, "zutat", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-amber-300 rounded-md focus:border-amber-500 focus:outline-none text-gray-800"
                        placeholder="z.B. Kartoffeln"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs text-amber-700 mb-1">
                        Zubereitung
                      </label>
                      <input
                        type="text"
                        value={ing.taetigkeit}
                        onChange={(e) =>
                          updateIngredient(index, "taetigkeit", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-amber-300 rounded-md focus:border-amber-500 focus:outline-none text-gray-800"
                        placeholder="z.B. kochen"
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end justify-center">
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        disabled={ingredients.length <= 1}
                        className="w-10 h-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                        title="Zutat entfernen"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-amber-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-amber-700 hover:bg-amber-100 rounded-lg font-medium transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors shadow-md"
            >
              {recipe ? "Speichern" : "Hinzufügen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
