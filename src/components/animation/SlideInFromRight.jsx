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
        height: "100dvh",
        backgroundColor: "#ffffff",
        boxShadow:
          "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
        overflow: isAnimating ? "hidden" : "unset",
      }}
    >
      {children}
    </motion.div>
  );
}
