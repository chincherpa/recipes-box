"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { jsPDF } from "jspdf";
import RecipeEditor from "@/components/RecipeEditor";
import RecipeCard from "@/components/RecipeCard";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import CategoryFilter from "@/components/CategoryFilter";
import CategoryManager from "@/components/CategoryManager";
import { Recipe, Category } from "@/types";

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

  // Category manager state
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  // Rezepte laden
  const loadRecipes = useCallback(async () => {
    try {
      const response = await fetch("/api/recipes");
      if (!response.ok) throw new Error("Fehler beim Laden");
      const data = await response.json();
      setRecipes(data);
    } catch {
      setError("Rezepte konnten nicht geladen werden");
    }
  }, []);

  // Kategorien laden
  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Fehler beim Laden");
      const data = await response.json();
      setCategories(data);
    } catch {
      setError("Kategorien konnten nicht geladen werden");
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadRecipes(), loadCategories()]);
      setLoading(false);
      setError("");
    };
    loadAll();
  }, [loadRecipes, loadCategories]);

  // Rezept-Counts pro Kategorie
  const recipeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    recipes.forEach((recipe) => {
      const cat = recipe.category || "Ohne Kategorie";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [recipes]);

  // Neues Rezept erstellen
  const handleNewRecipe = () => {
    setEditingRecipe(null);
    setEditorOpen(true);
  };

  // Rezept bearbeiten
  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setEditorOpen(true);
  };

  // Rezept speichern
  const handleSave = async (recipe: Recipe, originalName?: string) => {
    try {
      setSaving(true);
      setError("");

      const isEdit = !!originalName;
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit
        ? JSON.stringify({ originalName, recipe })
        : JSON.stringify(recipe);

      const response = await fetch("/api/recipes", {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Fehler beim Speichern");
      }

      setEditorOpen(false);
      await loadRecipes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  // Löschen vorbereiten
  const handleDeleteClick = (recipe: Recipe) => {
    setRecipeToDelete(recipe);
    setDeleteModalOpen(true);
  };

  // Löschen bestätigen
  const handleDeleteConfirm = async () => {
    if (!recipeToDelete) return;

    try {
      setSaving(true);
      const response = await fetch("/api/recipes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: recipeToDelete.name }),
      });

      if (!response.ok) throw new Error("Fehler beim Löschen");

      setDeleteModalOpen(false);
      setRecipeToDelete(null);
      await loadRecipes();
    } catch {
      setError("Rezept konnte nicht gelöscht werden");
    } finally {
      setSaving(false);
    }
  };

  // Kategorie speichern
  const handleSaveCategory = async (category: Category, originalId?: string) => {
    const isEdit = !!originalId;
    const method = isEdit ? "PUT" : "POST";
    const body = isEdit
      ? JSON.stringify({ originalId, category })
      : JSON.stringify(category);

    const response = await fetch("/api/categories", {
      method,
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Fehler beim Speichern");
    }

    // Wenn Kategorie umbenannt wurde, Rezepte aktualisieren
    if (isEdit) {
      const oldCategory = categories.find(c => c.id === originalId);
      if (oldCategory && oldCategory.name !== category.name) {
        await fetch("/api/recipes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldCategory: oldCategory.name,
            newCategory: category.name,
          }),
        });
        await loadRecipes();
      }
    }

    await loadCategories();
  };

  // Kategorie löschen
  const handleDeleteCategory = async (id: string, categoryName: string) => {
    const response = await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Fehler beim Löschen");
    }

    // Rezepte dieser Kategorie auf leer setzen
    await fetch("/api/recipes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oldCategory: categoryName,
        newCategory: "",
      }),
    });

    if (selectedCategory === categoryName) {
      setSelectedCategory(null);
    }

    await Promise.all([loadCategories(), loadRecipes()]);
  };

  // PDF generieren
  const generatePDF = () => {
    const cardWidth = 120;
    const cardHeight = 90;
    const margin = 5;
    const lineHeight = 4;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const offsetX = 28.5;
    const offsetY = 15;

    const cardPositions = [
      { x: offsetX, y: offsetY },
      { x: offsetX + cardWidth, y: offsetY },
      { x: offsetX, y: offsetY + cardHeight },
      { x: offsetX + cardWidth, y: offsetY + cardHeight },
    ];

    const drawCard = (recipe: Recipe, offsetX: number, offsetY: number) => {
      const leftCol = offsetX + margin;
      const rightCol = offsetX + cardWidth / 2 + 2;
      const colWidth = cardWidth / 2 - margin - 2;

      let y = offsetY + margin * 2;

      doc.setDrawColor(0);
      doc.setLineWidth(0.2);
      doc.rect(offsetX, offsetY, cardWidth, cardHeight);

      // Kategorie + Name als Titel
      const titleText = recipe.category
        ? `${recipe.category} - ${recipe.name}`
        : recipe.name;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      const titleLines = doc.splitTextToSize(titleText, cardWidth - margin * 2);
      doc.text(titleLines, offsetX + cardWidth / 2, y, { align: "center" });
      y += titleLines.length * 5 + 2;

      doc.setDrawColor(0);
      doc.setLineWidth(0.4);
      doc.line(offsetX + margin, y, offsetX + cardWidth - margin, y);
      y += 4;

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Zutat", leftCol, y);
      doc.text("Zubereitung", rightCol, y);
      y += 4;

      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);

      recipe.ingredients.forEach((ing) => {
        if (y > offsetY + cardHeight - margin - 4) return;

        doc.setFont("helvetica", "normal");
        const ingredientText = `${ing.menge} ${ing.zutat}`;
        const ingLines = doc.splitTextToSize(ingredientText, colWidth);

        doc.setFont("helvetica", "italic");
        const actionLines = doc.splitTextToSize(ing.taetigkeit || "", colWidth);

        const maxLines = Math.max(ingLines.length, actionLines.length);

        doc.setFont("helvetica", "normal");
        doc.text(ingLines, leftCol, y);

        doc.setFont("helvetica", "italic");
        doc.text(actionLines, rightCol, y);

        y += maxLines * lineHeight + 1;
      });
    };

    filteredRecipes.forEach((recipe, index) => {
      const positionOnPage = index % 4;

      if (index > 0 && positionOnPage === 0) {
        doc.addPage();
      }

      const pos = cardPositions[positionOnPage];
      drawCard(recipe, pos.x, pos.y);
    });

    doc.save("rezepte-kaertchen.pdf");
  };

  // Gefilterte Rezepte
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === null || r.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [recipes, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-600 to-orange-500 text-white py-8 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-2">Rezeptbox</h1>
          <p className="text-center text-amber-100">
            Verwalte deine Lieblingsrezepte und erstelle PDF-Kärtchen
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4">
        {/* Fehleranzeige */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleNewRecipe}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Neues Rezept
            </button>

            <button
              onClick={() => setCategoryManagerOpen(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              Kategorien
            </button>

            {recipes.length > 0 && (
              <button
                onClick={generatePDF}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
                PDF ({filteredRecipes.length})
              </button>
            )}
          </div>

          {/* Suche */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rezepte suchen..."
              className="w-full pl-10 pr-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:outline-none text-gray-800"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Kategorie-Filter */}
        {!loading && categories.length > 0 && (
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            recipeCounts={recipeCounts}
          />
        )}

        {/* Ladezustand */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent"></div>
            <p className="mt-4 text-amber-700">Rezepte werden geladen...</p>
          </div>
        )}

        {/* Leerer Zustand */}
        {!loading && recipes.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-2xl font-bold text-amber-900 mb-2">
              Keine Rezepte vorhanden
            </h2>
            <p className="text-amber-700 mb-6">
              Füge dein erstes Rezept hinzu, um loszulegen!
            </p>
            <button
              onClick={handleNewRecipe}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-colors"
            >
              Erstes Rezept erstellen
            </button>
          </div>
        )}

        {/* Keine Suchergebnisse */}
        {!loading && recipes.length > 0 && filteredRecipes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-amber-700">
              Keine Rezepte gefunden
              {searchTerm && ` für "${searchTerm}"`}
              {selectedCategory && ` in Kategorie "${selectedCategory}"`}
            </p>
            {(searchTerm || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory(null);
                }}
                className="mt-4 text-amber-600 hover:text-amber-800 font-medium"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        )}

        {/* Rezeptliste */}
        {!loading && filteredRecipes.length > 0 && (
          <>
            <div className="mb-4 text-amber-700">
              {filteredRecipes.length} Rezept{filteredRecipes.length !== 1 ? "e" : ""}
              {searchTerm && ` für "${searchTerm}"`}
              {selectedCategory && ` in "${selectedCategory}"`}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.name}
                  recipe={recipe}
                  categories={categories}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Editor Modal */}
      <RecipeEditor
        recipe={editingRecipe}
        categories={categories}
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        recipeName={recipeToDelete?.name || ""}
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setRecipeToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />

      {/* Category Manager Modal */}
      <CategoryManager
        categories={categories}
        isOpen={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        onSave={handleSaveCategory}
        onDelete={handleDeleteCategory}
        recipeCounts={recipeCounts}
      />

      {/* Saving Overlay */}
      {saving && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 shadow-xl flex items-center gap-4">
            <div className="animate-spin rounded-full h-6 w-6 border-3 border-amber-500 border-t-transparent"></div>
            <span className="text-amber-900">Wird gespeichert...</span>
          </div>
        </div>
      )}
    </div>
  );
}
