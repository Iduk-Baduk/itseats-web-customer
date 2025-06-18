import styles from "../common/Header.module.css";
import customStyles from "./HeaderMenuDetail.module.css";

export default function HeaderMenuDetail({
  isTransparent = true,
  title = "메뉴 이름",
  backButtonAction,
  shareButtonAction,
}) {
  return (
    <header
      className={`${styles.header} ${
        isTransparent ? customStyles.headerTransparent : ""
      }`}
      style={{ boxShadow: "none" }}
    >
      <button
        className={styles.iconButton}
        aria-label="뒤로가기"
        onClick={backButtonAction}
      >
        {getIconByLabel("back")}
      </button>
      {!isTransparent && (
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>{title}</h1>
        </div>
      )}
      <div className={customStyles.iconButtonContainer}>
        <button
          className={styles.iconButton}
          aria-label="공유"
          onClick={shareButtonAction}
        >
          {getIconByLabel("share")}
        </button>
      </div>
    </header>
  );
}

const getIconByLabel = (label) => {
  switch (label) {
    case "back":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="m7.825 13l4.9 4.9q.3.3.288.7t-.313.7q-.3.275-.7.288t-.7-.288l-6.6-6.6q-.15-.15-.213-.325T4.426 12t.063-.375t.212-.325l6.6-6.6q.275-.275.688-.275t.712.275q.3.3.3.713t-.3.712L7.825 11H19q.425 0 .713.288T20 12t-.288.713T19 13z"
          />
        </svg>
      );
    case "share":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M17 22q-1.25 0-2.125-.875T14 19q0-.15.075-.7L7.05 14.2q-.4.375-.925.588T5 15q-1.25 0-2.125-.875T2 12t.875-2.125T5 9q.6 0 1.125.213t.925.587l7.025-4.1q-.05-.175-.062-.337T14 5q0-1.25.875-2.125T17 2t2.125.875T20 5t-.875 2.125T17 8q-.6 0-1.125-.213T14.95 7.2l-7.025 4.1q.05.175.063.338T8 12t-.012.363t-.063.337l7.025 4.1q.4-.375.925-.587T17 16q1.25 0 2.125.875T20 19t-.875 2.125T17 22m0-2q.425 0 .713-.287T18 19t-.288-.712T17 18t-.712.288T16 19t.288.713T17 20M5 13q.425 0 .713-.288T6 12t-.288-.712T5 11t-.712.288T4 12t.288.713T5 13m12-7q.425 0 .713-.288T18 5t-.288-.712T17 4t-.712.288T16 5t.288.713T17 6m0-1"
          />
        </svg>
      );
    default:
      return <></>;
  }
};
