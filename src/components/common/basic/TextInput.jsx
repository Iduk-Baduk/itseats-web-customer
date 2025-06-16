import styles from "./TextInput.module.css";

export default function TextInput({
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}) {
  return (
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`${styles.input} ${className}`}
    />
  );
}
