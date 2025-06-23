import { getIconByLabel } from "../../utils/addressUtils";
import CommonMap from "../../components/common/CommonMap";
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
      <div className={styles.mapContainer}>
        <CommonMap lat={address.lat || 37.5665} lng={address.lng || 126.978} />
        <button className={styles.pinButton}>핀 조정하기</button>
      </div>

      {address && (
        <div className={styles.iconWithContent}>
          <img
            src={"/icons/location/mapmarkerIcon.svg"}
            alt="address-icon"
            className={styles.labelIcon}
          />
          <div className={styles.addressTextGroup}>
            <p className={styles.primaryAddress}>{address.address}</p>
            <p className={styles.secondaryAddress}>{address.roadAddress}</p>
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
        placeholder="길 안내 (예: 1층에 올리브영이 있는 오피스텔)"
      />

      <div className={styles.labelButtonGroup}>
        {["집", "회사", "기타"].map((label) => (
          <button
            key={label}
            className={`${styles.labelButton} ${
              currentLabel === label ? styles.selected : ""
            }`}
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
