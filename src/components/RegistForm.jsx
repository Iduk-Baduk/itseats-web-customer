import useRegistForm from "../hooks/useRegistForm";
import TextInput from "./common/basic/TextInput";
import CheckBox from "./common/basic/CheckBox";
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
        placeholder="비밀번호 (최소 8자리, 영문자/숫자/특수문자 @$!%*?& 포함)"
        value={form.password}
        onChange={handleChange}
      />
      <TextInput
        name="confirmPassword"
        type="password"
        placeholder="비밀번호 확인"
        value={form.confirmPassword}
        onChange={handleChange}
      />
      <TextInput
        name="name"
        type="text"
        placeholder="이름"
        value={form.name}
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
      
      {error && <div className={styles.errorMessage}>{error}</div>}

      <CheckBox
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
