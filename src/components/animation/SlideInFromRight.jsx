import { motion } from "framer-motion";
import styles from "../../layouts/Layout.module.css";

export default function SlideInFromRight({ children }) {
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
        overflow: "hidden",
      }}
    >
      {children}
    </motion.div>
  );
}
