import { Apple, Beef, Coffee, Cookie, Croissant, Milk, SprayCan, Wheat } from "lucide-react";

export type Product = {
  id: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  discountPercent: number;
  category: string;
  department: string;
  aisle: string;
  weight: string;
  rating: number;
  delivery: string;
  description: string;
  orders?: number;
};

export type Category = {
  id: string;
  label: string;
  icon: typeof Apple;
};

export const categories: Category[] = [
  { id: "fruits", label: "Fruits", icon: Apple },
  { id: "dairy", label: "Dairy", icon: Milk },
  { id: "bakery", label: "Bakery", icon: Croissant },
  { id: "snacks", label: "Snacks", icon: Cookie },
  { id: "beverages", label: "Drinks", icon: Coffee },
  { id: "staples", label: "Staples", icon: Wheat },
  { id: "fresh", label: "Fresh", icon: Beef },
  { id: "home-care", label: "Home", icon: SprayCan }
];

export const banners = [
  {
    id: "fresh-drop",
    title: "Fresh drops in 10 minutes",
    subtitle: "Fruits, dairy and snacks for the week",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "breakfast",
    title: "Breakfast in a flash",
    subtitle: "Bakery, spreads and morning essentials",
    image: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "party",
    title: "Snack stack weekend",
    subtitle: "Top picks for movies, matches and guests",
    image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=900&q=80"
  }
];

export const recentSearches = ["milk", "paneer", "breakfast", "chips"];
export const filterChips = ["All", "Price", "Rating"];
