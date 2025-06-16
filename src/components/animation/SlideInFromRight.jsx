import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function SlideInFromRight({ children }) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 250);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      style={{
        backgroundColor: "#ffffff",
        overflow: isAnimating ? "hidden" : "unset",
      }}
    >
      {children}
    </motion.div>
  );
}
