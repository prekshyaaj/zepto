#!/usr/bin/env python3
"""
Extract a single core food word from Instacart-style product names.
Heuristic: clean text, strip brands/modifiers, prefer food-lexicon matches, else last substantive token, singularize.
"""

import csv
import re
from pathlib import Path
from typing import List, Optional, Tuple

# Flavor / note tokens — ignored when a non-flavor food word also matches
FLAVOR_LEXICON = {
    "chocolate", "vanilla", "caramel", "mocha", "cinnamon", "cocoa",
    "strawberry", "blueberry", "raspberry", "blackberry", "cranberry",
    "mint", "hazelnut", "peanut", "peanuts", "maple",
}

# Snack / carrier shape — if any match, only these candidates compete
TIER_SNACK_FORM = {
    "chip", "chips", "cracker", "crackers", "cookie", "cookies",
    "cereal", "bar", "bars", "popcorn", "pretzel", "pretzels",
    "wafer", "wafers", "biscuit", "biscuits",
}

# Broader product form — used when no snack-form match
TIER_PRODUCT_FORM = {
    "bread", "bagel", "bagels", "muffin", "muffins", "croissant", "croissants",
    "brioche", "roll", "rolls", "bun", "buns", "cake", "cakes", "brownie", "brownies",
    "donut", "donuts", "doughnut", "pastry", "pie", "pies", "tart", "tarts",
    "danish", "scone", "scones", "waffle", "waffles", "pancake", "pancakes",
    "toast", "granola", "oatmeal", "oats", "yogurt", "yoghurt", "milk", "cream",
    "cheese", "cheddar", "mozzarella", "parmesan", "ricotta", "cottage", "feta",
    "brie", "swiss", "provolone", "gouda", "mascarpone", "marscapone", "butter",
    "egg", "eggs", "pizza", "pasta", "spaghetti", "linguini", "linguine",
    "fettuccini", "fettuccine", "penne", "rigatoni", "orzo", "ravioli", "tortellini",
    "lasagna", "gnocchi", "ziti", "macaroni", "ramen", "noodle", "noodles",
    "udon", "soba", "soup", "broth", "stock", "stew", "sandwich", "sandwiches",
    "sub", "panini", "wrap", "wraps", "burger", "burgers", "taco", "tacos",
    "burrito", "burritos", "enchilada", "taquito", "taquitos", "quesadilla",
    "hotdog", "corndog", "calzone", "empanada", "tortilla", "tortillas",
    "pita", "naan", "flatbread", "sauce", "sauces", "salsa", "dressing",
    "ketchup", "mustard", "mayonnaise", "mayo", "vinegar", "syrup", "jam", "jelly",
    "hummus", "rice", "quinoa", "couscous", "beans", "bean", "lentil", "lentils",
    "chickpea", "chickpeas", "meatball", "meatballs", "sausage", "nugget", "nuggets",
    "wings", "wing", "steak", "ribs", "rib", "brisket", "roast", "filet", "fillet",
    "tea", "coffee", "juice", "cider", "lemonade", "limeade", "smoothie", "shake",
    "wine", "beer", "ale", "lager", "stout", "champagne", "prosecco", "brut",
    "vodka", "whiskey", "whisky", "rum", "gin", "tequila", "liqueur", "sake",
    "kombucha", "kefir", "mate", "oolong", "chai", "matcha", "gelato", "sorbet",
    "sherbet", "icecream", "popsicle", "popsicles",
}

# Words to remove entirely (case-insensitive)
STOP_WORDS = {
    "a", "an", "the", "and", "or", "with", "without", "for", "in", "of", "to", "from",
    "by", "no", "all", "any", "per", "ct", "count", "pack", "packs", "pk", "mini", "maxi",
    "style", "flavored", "flavor", "flavours", "recipe", "recipes", "blend", "mix", "mixes",
    "sliced", "diced", "cut", "chopped", "whole", "halves", "pieces", "piece", "serving",
    "meal", "meals", "kit", "kits", "snack", "snacks", "food", "foods", "product", "products",
    "original", "classic", "traditional", "premium", "deluxe", "family", "single", "multi",
    "super", "ultra", "extra", "lite", "light", "dark", "white", "red", "green", "yellow",
    "blue", "black", "golden", "sweet", "sour", "hot", "mild", "spicy", "smoked", "roasted",
    "baked", "grilled", "fried", "fresh", "frozen", "dried", "organic", "natural", "pure",
    "real", "simple", "healthy", "lean", "low", "high", "free", "reduced", "unsweetened",
    "sweetened", "seasoned", "salted", "unsalted", "cooked", "uncooked", "raw", "ripe",
    "baby", "young", "large", "medium", "small", "jumbo", "thin", "thick", "chunky", "smooth",
    "creamy", "crunchy", "soft", "hard", "fine", "coarse", "wild", "farm", "local", "imported",
    "import", "european", "italian", "french", "mexican", "asian", "california", "new",
    "old", "young", "living", "daily", "instant", "quick", "slow", "oven", "microwave",
    "microwavable", "ready", "heat", "serve", "serving", "restaurant", "homestyle", "home",
    "country", "cafe", "gourmet", "artisan", "select", "choice", "grade", "first", "second",
    "party", "fun", "kids", "kid", "go", "pak", "gopak", "snacking", "drink", "beverage",
    "beverages", "juice", "juices", "water", "tea", "coffee", "soda", "seltzer", "sparkling",
    "still", "energy", "sport", "sports", "vitamin", "probiotic", "fiber", "fibre", "protein",
    "carb", "sugar", "sodium", "calorie", "calories", "kosher", "halal", "vegetarian", "vegan",
    "gluten", "dairy", "lactose", "non", "gmo", "hormone", "antibiotic", "cage", "cagefree",
    "grain", "grains", "fed", "free-range", "freerange", "pasteurized", "homogenized",
    "vitamin", "enriched", "fortified", "unfiltered", "filtered", "distilled", "cold",
    "pressed", "brewed", "brew", "keurig", "k-cup", "kcup", "cups", "cup", "pods", "pod",
    "bites", "bite", "sticks", "stick", "rolls", "roll", "wrap", "wraps",
    "pouch", "pouches", "pouches", "tubes", "tube", "cans", "can", "jar", "jars", "bottle",
    "bottles", "box", "boxes", "bag", "bags", "pouch", "tray", "trays", "multi-pack",
    "multipack", "value", "size", "sizes", "oz", "lb", "lbs", "ml", "l", "g", "kg", "mg",
    "fl", "qt", "pt", "gal", "inch", "inches", "cm", "mm", "percent", "recycled", "aluminum",
    "foil", "plastic", "paper", "wrap", "bag", "bags",
}

# Prefer these as main item when they appear (longest match wins via scan order)
FOOD_LEXICON = [
    # proteins / meat
    "chicken", "turkey", "beef", "pork", "lamb", "duck", "veal", "bacon", "ham", "sausage",
    "salami", "pepperoni", "prosciutto", "soppressata", "brisket", "steak", "ribs", "rib",
    "shank", "burger", "burgers", "nugget", "nuggets", "wings", "wing", "tender",
    "tenders", "cutlet", "cutlets", "roast", "filet", "fillet", "salmon", "tuna", "sardine",
    "sardines", "anchovy", "anchovies", "shrimp", "crab", "lobster", "scallop", "scallops",
    "mussel", "mussels", "clam", "clams", "oyster", "oysters", "squid", "calamari", "fish",
    "gefilte", "meatballs", "meatball",
    # dairy / eggs
    "yogurt", "yoghurt", "milk", "soymilk", "almondmilk", "oat", "cream", "butter", "cheese",
    "cheddar", "mozzarella", "parmesan", "ricotta", "cottage", "feta", "brie", "swiss",
    "provolone", "gouda", "mascarpone", "marscapone", "queso", "quesadilla", "egg", "eggs",
    "mayonnaise", "mayo",
    # bakery / grains
    "bread", "bagel", "bagels", "muffin", "muffins", "croissant", "croissants", "brioche",
    "roll", "rolls", "bun", "buns", "tortilla", "tortillas", "pita", "naan", "flatbread",
    "cracker", "crackers", "cookie", "cookies", "wafer", "wafers", "biscuit", "biscuits",
    "cake", "cakes", "brownie", "brownies", "donut", "donuts", "doughnut", "pastry", "pie",
    "pies", "tart", "tarts", "muffin", "danish", "scone", "scones", "pretzel", "pretzels",
    "granola", "cereal", "oatmeal", "oats", "rice", "quinoa", "barley", "bulgur", "couscous",
    "pasta", "spaghetti", "linguini", "linguine", "fettuccini", "fettuccine", "penne", "rigatoni",
    "orzo", "ravioli", "tortellini", "lasagna", "gnocchi", "ziti", "ramen", "noodle", "noodles",
    "udon", "soba", "macaroni", "soup", "broth", "stock", "stew", "chili", "chile",
    "chilli", "beans", "bean", "lentil", "lentils", "chickpea", "chickpeas", "hummus",
    "pizza", "calzone", "empanada", "taquito", "taquitos", "burrito", "burritos", "taco",
    "tacos", "enchilada", "wrap", "sandwich", "sandwiches", "sub", "panini",
    "hotdog", "corn", "dog", "corndog", "waffle", "waffles", "pancake", "pancakes",
    "frenchtoast", "toast", "englishmuffin", "muffin",
    # produce
    "tomato", "tomatoes", "potato", "potatoes", "onion", "onions", "garlic", "ginger",
    "carrot", "carrots", "celery", "broccoli", "cauliflower", "cabbage", "kale", "spinach",
    "lettuce", "arugula", "romaine", "cucumber", "cucumbers", "zucchini", "squash", "pumpkin",
    "eggplant", "pepper", "peppers", "jalapeno", "jalapeño", "habanero", "chile", "chili",
    "mushroom", "mushrooms", "asparagus", "artichoke", "artichokes", "beet", "beets",
    "radish", "radishes", "turnip", "turnips", "leek", "leeks", "scallion", "scallions",
    "shallot", "shallots", "apple", "apples", "banana", "bananas", "orange", "oranges",
    "grape", "grapes", "berry", "berries", "blueberry", "blueberries", "strawberry",
    "strawberries", "raspberry", "raspberries", "blackberry", "blackberries", "cranberry",
    "cranberries", "cherry", "cherries", "peach", "peaches", "pear", "pears", "plum", "plums",
    "apricot", "apricots", "mango", "mangoes", "mangos", "pineapple", "kiwi", "melon",
    "watermelon", "cantaloupe", "honeydew", "grapefruit", "lemon", "lemons", "lime", "limes",
    "clementine", "clementines", "tangerine", "tangerines", "nectarine", "nectarines",
    "avocado", "avocados", "coconut", "pomegranate", "fig", "figs", "date", "dates", "prune",
    "prunes", "raisin", "raisins", "olive", "olives", "pickle", "pickles", "capers",
    # condiments / pantry
    "salt", "pepper", "spice", "spices", "herb", "herbs", "seasoning", "sauce", "sauces",
    "salsa", "ketchup", "mustard", "mayonnaise", "vinegar", "oil", "dressing", "marinade",
    "teriyaki", "soy", "miso", "tahini", "pesto", "syrup", "honey", "maple", "molasses",
    "jam", "jelly", "preserves", "spread", "butter", "margarine", "shortening", "lard",
    "flour", "sugar", "stevia", "yeast", "baking", "cocoa", "chocolate", "candy", "candies",
    "gum", "mints", "mint", "chips", "chip", "bar", "bars", "popcorn", "pretzel", "nuts", "nut", "almond",
    "almonds", "walnut", "walnuts", "pecan", "pecans", "cashew", "cashews", "pistachio",
    "pistachios", "hazelnut", "hazelnuts", "macadamia", "peanut", "peanuts", "sesame",
    "chia", "flax", "hemp", "sunflower", "pumpkinseed", "trailmix",
    # beverages
    "tea", "coffee", "juice", "cider", "lemonade", "limeade", "smoothie", "shake", "wine",
    "beer", "ale", "lager", "stout", "champagne", "prosecco", "brut", "rosé", "rose", "porto",
    "vodka", "whiskey", "whisky", "rum", "gin", "tequila", "liqueur", "sake", "mate",
    "kombucha", "kefir",
    # frozen desserts
    "icecream", "gelato", "sorbet", "sherbet", "popsicle", "popsicles",
    # misc
    "tofu", "tempeh", "seitan", "kimchi", "sauerkraut", "kraut", "nori", "seaweed", "wasabi",
    "sushi", "sashimi", "pho", "curry", "tikka", "masala", "ghee", "paneer", "naan",
    "chai", "matcha", "oolong", "herbal", "rooibos", "yerba",
]

IRREGULAR_PLURAL = {
    "tomatoes": "tomato",
    "potatoes": "potato",
    "berries": "berry",
    "cherries": "cherry",
    "peaches": "peach",
    "mangoes": "mango",
    "mangos": "mango",
    "leaves": "leaf",
    "wolves": "wolf",
    "knives": "knife",
    "cookies": "cookie",
    "brownies": "brownie",
    "brownie": "brownie",
    "clementines": "clementine",
    "tangerines": "tangerine",
    "nectarines": "nectarine",
    "sardines": "sardine",
    "sardine": "sardine",
    "anchovies": "anchovy",
    "raspberries": "raspberry",
    "blackberries": "blackberry",
    "blueberries": "blueberry",
    "strawberries": "strawberry",
    "cranberries": "cranberry",
    "gooseberries": "gooseberry",
    "avocados": "avocado",
}


def singularize_word(w: str) -> str:
    w = w.lower().strip()
    if len(w) <= 2:
        return w
    if w in IRREGULAR_PLURAL:
        return IRREGULAR_PLURAL[w]
    if w.endswith("ies") and len(w) > 4 and w[-4] not in "aeiou":
        return w[:-3] + "y"
    if w.endswith("oes") and w not in {"does", "goes"}:
        return w[:-2]
    if w.endswith("ves") and w[:-3] + "f" in ("wolf",):  # rare
        pass
    if w.endswith("s") and not w.endswith("ss") and len(w) > 3:
        if w.endswith("ches") or w.endswith("shes") or w.endswith("xes") or w.endswith("zes"):
            return w[:-2]
        return w[:-1]
    return w


def _collect_lexicon_matches(
    joined: str, lexicon_set: set
) -> List[Tuple[int, int, str]]:
    """All (length, end, word) whole-word hits."""
    out: List[Tuple[int, int, str]] = []
    for word in lexicon_set:
        for m in re.finditer(r"\b" + re.escape(word) + r"\b", joined):
            out.append((len(word), m.end(), word))
    return out


def best_lexicon_match(
    joined: str, lexicon_set: set, lexicon_to_canon: dict
) -> Optional[str]:
    """
    Prefer snack/carrier form, then broader product form, then other lexicon hits.
    Drop flavor tokens when a non-flavor hit exists; drop 'sandwich' when cookie(s) hit.
    Among finalists: longest word, then rightmost span.
    """
    matches = _collect_lexicon_matches(joined, lexicon_set)
    if not matches:
        return None

    words_hit = {w for _, _, w in matches}
    if "cookie" in words_hit or "cookies" in words_hit:
        matches = [m for m in matches if m[2] != "sandwich"]

    def has_non_flavor(ms: List[Tuple[int, int, str]]) -> bool:
        return any(m[2] not in FLAVOR_LEXICON for m in ms)

    if has_non_flavor(matches):
        matches = [m for m in matches if m[2] not in FLAVOR_LEXICON]

    if not matches:
        return None

    snack = [m for m in matches if m[2] in TIER_SNACK_FORM]
    if snack:
        matches = snack
    else:
        prod = [m for m in matches if m[2] in TIER_PRODUCT_FORM]
        if prod:
            matches = prod

    best = max(matches, key=lambda x: (x[0], x[1]))
    w = best[2]
    return lexicon_to_canon.get(w, singularize_word(w))


def tokenize_name(name: str):
    # Unify quotes and commas
    s = name.replace('"', " ").replace("'", " ")
    s = re.sub(r"[^\w\s\-&]", " ", s)
    s = s.replace("&", " ")
    s = re.sub(r"\s+", " ", s).strip().lower()
    # Remove numbers and common unit tokens
    s = re.sub(r"\b\d+[\d./]*\s*%?\b", " ", s)
    s = re.sub(
        r"\b(oz|lb|lbs|g|kg|mg|ml|l|qt|pt|gal|fl|ct|count|pack|pk|pcs)\b",
        " ",
        s,
        flags=re.I,
    )
    s = re.sub(r"\s+", " ", s).strip()
    tokens = []
    for part in s.split():
        for sub in re.split(r"[-]", part):
            sub = sub.strip()
            if sub:
                tokens.append(sub)
    return tokens


def extract_one_word(name: str, lexicon_set: set, lexicon_to_canon: dict) -> str:
    tokens = tokenize_name(name)
    if not tokens:
        return "unknown"

    # Filter stop words from ends first — keep meaningful sequence
    filtered = [t for t in tokens if t not in STOP_WORDS and len(t) >= 2]

    joined = " ".join(tokens)
    hit = best_lexicon_match(joined, lexicon_set, lexicon_to_canon)
    if hit:
        return hit

    # Fallback: last non-stop token from filtered
    candidates = [t for t in filtered if t not in STOP_WORDS]
    if not candidates:
        candidates = [t for t in tokens if len(t) >= 3]
    if not candidates:
        return singularize_word(tokens[-1])

    last = candidates[-1]
    # Skip purely numeric leftovers
    if last.isdigit():
        last = candidates[-2] if len(candidates) > 1 else last
    return singularize_word(last)


def main():
    base = Path(__file__).resolve().parent
    inp = base / "food_products.csv"
    out = base / "food_products_main_ingredient.csv"

    lexicon_set = set()
    lexicon_to_canon = {}
    for w in FOOD_LEXICON:
        lw = w.lower()
        lexicon_set.add(lw)
        lexicon_to_canon[lw] = singularize_word(lw)

    rows_out = []
    with inp.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pid = row["product_id"].strip()
            pname = row["product_name"].strip()
            one = extract_one_word(pname, lexicon_set, lexicon_to_canon)
            rows_out.append({"product_id": pid, "product_name": pname, "new_name": one})

    with out.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f, fieldnames=["product_id", "product_name", "new_name"]
        )
        w.writeheader()
        w.writerows(rows_out)

    print(f"Wrote {len(rows_out)} rows to {out}")


if __name__ == "__main__":
    main()
