
export const loadCart = () => {
  try {
    const serialized = localStorage.getItem("cart");
    return serialized ? JSON.parse(serialized) : [];
  } catch (err) {
    console.error("❌ Failed to load cart from localStorage:", err);
    return [];
  }
};

export const saveCart = (cart) => {
  try {
    const serialized = JSON.stringify(cart);
    localStorage.setItem("cart", serialized);
  } catch (err) {
    console.error("❌ Failed to save cart to localStorage:", err);
  }
};

export const saveCount = (count) => {
  try {
    localStorage.setItem("count", count.toString());
  } catch (err) {
    console.error("❌ Failed to save count to localStorage:", err);
  }
};