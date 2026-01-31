"use client";

import { ReactNode } from "react";
import { Category } from "@/types";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryName: string | null) => void;
  recipeCounts: Record<string, number>;
}

const categoryIcons: Record<string, ReactNode> = {
  potato: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <ellipse cx="12" cy="12" rx="9" ry="7" />
      <circle cx="8" cy="10" r="1" fill="white" opacity="0.5" />
      <circle cx="14" cy="9" r="0.8" fill="white" opacity="0.5" />
      <circle cx="10" cy="14" r="0.6" fill="white" opacity="0.5" />
    </svg>
  ),
  pasta: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M4 6c0 0 2-2 8-2s8 2 8 2" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M4 10c0 0 2-2 8-2s8 2 8 2" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M4 14c0 0 2-2 8-2s8 2 8 2" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M6 18c0 0 1.5 2 6 2s6-2 6-2" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  ),
  casserole: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <rect x="3" y="8" width="18" height="10" rx="2" />
      <rect x="2" y="6" width="20" height="3" rx="1" />
      <circle cx="6" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </svg>
  ),
  beans: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <ellipse cx="8" cy="10" rx="4" ry="6" transform="rotate(-20 8 10)" />
      <ellipse cx="16" cy="14" rx="4" ry="6" transform="rotate(20 16 14)" />
      <path d="M6 8 Q8 12, 6 14" stroke="white" strokeWidth="0.5" fill="none" opacity="0.5" />
      <path d="M14 10 Q16 14, 14 18" stroke="white" strokeWidth="0.5" fill="none" opacity="0.5" />
    </svg>
  ),
  soup: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M4 10 Q4 18, 12 18 Q20 18, 20 10 Z" />
      <rect x="3" y="8" width="18" height="3" rx="1" />
      <path d="M8 4 Q9 6, 8 7" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M12 3 Q13 5, 12 6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M16 4 Q17 6, 16 7" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
    </svg>
  ),
  salad: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M4 12 Q4 20, 12 20 Q20 20, 20 12 Z" />
      <ellipse cx="12" cy="12" rx="8" ry="3" fill="white" opacity="0.3" />
      <circle cx="9" cy="11" r="2" fill="white" opacity="0.4" />
      <circle cx="15" cy="12" r="1.5" fill="white" opacity="0.4" />
      <circle cx="12" cy="14" r="1" fill="white" opacity="0.4" />
    </svg>
  ),
};

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  recipeCounts,
}: CategoryFilterProps) {
  const totalRecipes = Object.values(recipeCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
        </svg>
        <span className="font-semibold text-amber-900">Kategorien</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Alle anzeigen */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm
            transition-all duration-200 border-2
            ${selectedCategory === null
              ? "bg-amber-500 text-white border-amber-500 shadow-md scale-105"
              : "bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400 hover:bg-amber-100"
            }
          `}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Alle
          <span className={`
            px-2 py-0.5 rounded-full text-xs font-bold
            ${selectedCategory === null ? "bg-white/30" : "bg-amber-200"}
          `}>
            {totalRecipes}
          </span>
        </button>

        {/* Kategorie-Buttons */}
        {categories.map((category) => {
          const isSelected = selectedCategory === category.name;
          const count = recipeCounts[category.name] || 0;
          const icon = categoryIcons[category.icon] || categoryIcons.casserole;

          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(isSelected ? null : category.name)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm
                transition-all duration-200 border-2
                ${isSelected
                  ? "text-white shadow-md scale-105"
                  : "hover:scale-102"
                }
              `}
              style={{
                backgroundColor: isSelected ? category.color : `${category.color}15`,
                borderColor: isSelected ? category.color : `${category.color}40`,
                color: isSelected ? "white" : category.color,
              }}
            >
              <span style={{ color: isSelected ? "white" : category.color }}>
                {icon}
              </span>
              {category.name}
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: isSelected ? "rgba(255,255,255,0.3)" : `${category.color}25`,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
