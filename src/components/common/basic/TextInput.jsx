import styles from "./TextInput.module.css";

export default function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`${styles.input} ${className}`}
    />
  );
}
