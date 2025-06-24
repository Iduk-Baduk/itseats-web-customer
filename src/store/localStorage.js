
export const loadCart = () => {
  try {
    const serialized = localStorage.getItem("cart");
    return serialized ? JSON.parse(serialized) : [];
  } catch (err) {
    console.error("Failed to load cart", err);
    return [];
  }
};

export const saveCart = (cart) => {
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
  } catch (err) {
    console.error("Failed to save cart", err);
  }
};

export const saveCount = (count) => {
  try {
    localStorage.setItem("count", count.toString());
  } catch (err) {
    console.error("❌ Failed to save count to localStorage:", err);
  }
};