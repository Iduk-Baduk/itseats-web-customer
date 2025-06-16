import { Outlet } from "react-router-dom";
import NavigationBar from "../components/common/NavigationBar";
import styles from "./Layout.module.css";

export default function Layout({ navVisible = true }) {
  return (
    <>
      <div className={`${styles.app} ${!navVisible ? styles.noNav : ""}`}>
        <main className={styles.main}>
          <Outlet />
        </main>
        {navVisible && <NavigationBar />}
      </div>
    </>
  );
}
