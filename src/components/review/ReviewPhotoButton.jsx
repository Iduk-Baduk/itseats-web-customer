import LineButton from "../common/basic/LineButton";

import styles from "./ReviewPhotoButton.module.css";

const CameraIcon = ({ className }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3.2" fill="#01AFFF" />
      <path
        fill="#01AFFF"
        d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5s5 2.24 5 5s-2.24 5-5 5"
      />
    </svg>
  );
};

export default function PhotoButton({ onClick, className }) {
  return (
    <div className={className}>
      <LineButton className={styles.lineButton} onClick={onClick}>
        <CameraIcon className={styles.icon} />
        <p>사진 추가 ({0}/5)</p>
      </LineButton>
    </div>
  );
}
