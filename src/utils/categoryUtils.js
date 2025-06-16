export const CATEGORIES = [
  { name: "한식", category: "korean" },
  { name: "중식", category: "chinese" },
  { name: "피자", category: "pizza" },
  { name: "찜/탕", category: "stew" },
  { name: "치킨", category: "chicken" },
  { name: "분식", category: "bunsik" },
  { name: "돈까스", category: "porkcutlet" },
  { name: "족발/보쌈", category: "pigfeet" },
  { name: "구이", category: "grill" },
  { name: "일식", category: "japanese" },
  { name: "회/해물", category: "seafood" },
  { name: "양식", category: "western" },
  { name: "커피/차", category: "cafe" },
  { name: "디저트", category: "dessert" },
  { name: "간식", category: "snack" },
  { name: "아시안", category: "asian" },
  { name: "샌드위치", category: "sandwich" },
  { name: "샐러드", category: "salad" },
  { name: "버거", category: "burger" },
  { name: "멕시칸", category: "mexican" },
  { name: "도시락", category: "lunchbox" },
  { name: "죽", category: "porridge" },
  { name: "포장", category: "takeout" },
  { name: "1인분", category: "single" },
];

export function getCategoryName(categoryValue) {
  const match = CATEGORIES.find((item) => item.category === categoryValue);
  return match ? match.name : "";
}