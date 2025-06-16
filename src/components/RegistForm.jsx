import useRegistForm from "../hooks/useRegistForm";
import TextInput from "./common/basic/TextInput";
import Checkbox from "./common/basic/Checkbox";
import Button from "./common/basic/Button";
import styles from "./RegistForm.module.css";

const RegistForm = ({ className = "" }) => {
  const { form, error, handleChange, handleSubmit } = useRegistForm();

  return (
    <form onSubmit={handleSubmit} className={className}>
      <TextInput
        name="username"
        type="text"
        placeholder="사용자 ID"
        value={form.username}
        onChange={handleChange}
      />
      <TextInput
        name="password"
        type="password"
        placeholder="비밀번호"
        value={form.password}
        onChange={handleChange}
      />
      <TextInput
        name="nickname"
        type="text"
        placeholder="닉네임"
        value={form.nickname}
        onChange={handleChange}
      />
      <TextInput
        name="email"
        type="email"
        placeholder="이메일"
        value={form.email}
        onChange={handleChange}
      />
      <TextInput
        name="phone"
        type="text"
        placeholder="전화번호"
        value={form.phone}
        onChange={handleChange}
      />
      {error && <p style={{ color: "red" }}>{error}</p>}

      <Checkbox
        name="terms"
        label="이용약관에 동의합니다."
        checked={form.terms}
        onChange={handleChange}
        className={styles.checkbox}
      />

      <Button type="submit" className={styles.button}>
        가입하기
      </Button>
    </form>
  );
};

export default RegistForm;
