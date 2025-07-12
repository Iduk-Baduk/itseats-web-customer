import NavigationBar from "../components/common/NavigationBar";
import styles from "./Layout.module.css";

export default function Layout({ children, navVisible = true }) {
  return (
    <>
      <div className={`${styles.app} ${!navVisible ? styles.noNav : ""}`}>
        <main className={styles.main}>
          {children}
        </main>
        {navVisible && <NavigationBar />}
      </div>
    </>
  );
}
