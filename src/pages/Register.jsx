import RegistForm from "../components/RegistForm"
import styles from "./Register.module.css";

export default function Register() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>회원가입</h1>
      <p className={styles.description}>회원가입을 위해 아래 정보를 입력해주세요.</p>
      <RegistForm className={styles.form}/>
    </div>
  );
}