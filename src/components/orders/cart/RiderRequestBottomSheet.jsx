import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./RiderRequestBottomSheet.module.css";

const OPTIONS = [
  { key: "직접 받을게요 (부재 시 문 앞)", label: "직접 받을게요 (부재 시 문 앞)" },
  { key: "문 앞에 놔주세요 (초인종 O)", label: "문 앞에 놔주세요 (초인종 O)" },
  { key: "문 앞에 놔주세요 (초인종 X)", label: "문 앞에 놔주세요 (초인종 X)" },
  { key: "도착하면 전화해주세요", label: "도착하면 전화해주세요" },
  { key: "도착하면 문자해주세요", label: "도착하면 문자해주세요" },
  { key: "직접 입력하기", label: "직접 입력하기" },
];

export function getSortLabel(sortKey) {
  const option = OPTIONS.find((opt) => opt.key === sortKey);
  return option ? option.label : "정렬";
}

export default function RiderRequestBottomSheet({
  isOpen,
  request,
  onClose,
  onSelect,
}) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.backdrop}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className={styles.sheet}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className={styles.header}>
              <span className={styles.title}>요청사항</span>
              <button className={styles.close} onClick={onClose}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275t.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275z"
                  />
                </svg>
              </button>
            </div>
            <ul className={styles.optionList}>
              {OPTIONS.map((opt) => (
                <li
                  key={opt.key}
                  className={styles.optionItem}
                  onClick={() => {
                    onSelect(opt.key);
                    onClose();
                  }}
                >
                  {request === opt.key && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      className={styles.checkIcon}
                    >
                      <path
                        fill="currentColor"
                        d="M9 16.17L4.83 12l-1.41 1.41L9 19 21 7l-1.41-1.41z"
                      />
                    </svg>
                  )}
                  {opt.label}
                </li>
              ))}
            </ul>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
