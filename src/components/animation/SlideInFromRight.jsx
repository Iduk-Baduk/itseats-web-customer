import { motion } from "framer-motion";

export default function SlideInFromRight({ children }) {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed top-0 left-0 w-full h-full bg-white z-50 shadow-lg"
    >
      {children}
    </motion.div>
  );
}
