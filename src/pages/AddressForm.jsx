import { getIconByLabel } from "../hooks/useAddressManager";
import styles from "./AddressEdit.module.css";

export default function AddressForm({
  address,
  currentLabel,
  detailAddress,
  guideMessage,
  onChangeDetail,
  onChangeGuide,
  onChangeLabel,
  onSubmit,
}) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>주소 설정</h1>

      <div className={styles.mapContainer}>
        <div className={styles.mapPlaceholder}>지도 영역</div>
        <button className={styles.pinButton}>핀 조정하기</button>
      </div>

      {address && (
        <div className={styles.iconWithContent}>
          <img
            src={getIconByLabel(address.label)}
            alt="address-icon"
            className={styles.labelIcon}
          />
          <div className={styles.addressTextGroup}>
            <p className={styles.primaryAddress}>{address.address.split('\n')[0]}</p>
            <p className={styles.secondaryAddress}>{address.address.split('\n')[1]}</p>
            {address.wowZone && (
              <div className={styles.wowArea}>
                <span className={styles.wow}>WOW</span>
                <span className={styles.wowText}>무료배달 가능 지역</span>
              </div>
            )}
          </div>
        </div>
      )}

      <input
        className={styles.detailInput}
        value={detailAddress}
        onChange={onChangeDetail}
        placeholder="상세주소 (아파트/동/호)"
      />

      <input
        className={styles.detailInput}
        value={guideMessage}
        onChange={onChangeGuide}
        placeholder="길 안내 (예: 1층 올리브영)"
      />

      <div className={styles.labelButtonGroup}>
        {["집", "회사", "기타"].map((label) => (
          <button
            key={label}
            className={`${styles.labelButton} ${currentLabel === label ? styles.selected : ""}`}
            onClick={() => onChangeLabel(label)}
          >
            <img
              src={getIconByLabel(label)}
              alt={`${label}-icon`}
              className={styles.labelIcon}
            />
            {label}
          </button>
        ))}
      </div>

      <button className={styles.submitButton} onClick={onSubmit}>
        완료
      </button>
    </div>
  );
}
