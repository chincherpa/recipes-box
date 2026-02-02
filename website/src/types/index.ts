export interface Ingredient {
  zutat: string;
  menge: string;
  taetigkeit: string;
}

export interface Recipe {
  name: string;
  category: string;
  ingredients: Ingredient[];
  bemerkung?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}
