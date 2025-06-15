import { Outlet } from "react-router-dom";
import NavigationBar from "../components/common/NavigationBar";
import styles from "./Layout.module.css";

export default function Layout() {
  return (
    <>
      <div className={styles.app}>
        <main className={styles.main}>
          <Outlet />
        </main>
        <NavigationBar />
      </div>
    </>
  );
}
