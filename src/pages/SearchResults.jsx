import FilterBar from "../components/common/basic/FilterBar";
import styles from "./SearchResults.module.css";

// 임시 데이터
const dummyData = [
    {
      id: 1,
      name: "맥도날드",
      rating: 4.9,
      reviews: 464,
      distance: "0.7km",
      deliveryFee: "무료배달",
      minOrder: "14,000원",
      time: "34분",
      images: {
        main: "https://source.unsplash.com/420x220/?burger",
        sub1: "https://source.unsplash.com/120x104/?fries",
        sub2: "https://source.unsplash.com/120x104/?coke",
      },
    },
    {
      id: 2,
      name: "롯데리아",
      rating: 4.9,
      reviews: 464,
      distance: "1.3km",
      deliveryFee: "무료배달",
      minOrder: "5,000원",
      time: "34분",
      images: {
        main: "https://source.unsplash.com/420x220/?burger2",
        sub1: "https://source.unsplash.com/120x104/?fries2",
        sub2: "https://source.unsplash.com/120x104/?drink",
      },
    },
  ];

export default function SearchResult() {
  
  return (
    <>
      <FilterBar/>

      {/* 하단 데이터(데이터 추후 교체) */}
      {dummyData && dummyData.map((item) => (
        <div key={item.id} className={styles.card}>
          <div className={styles.imageRow}>
            <img src={item.images.main} alt="메인" className={styles.mainImage}/>
            <div className={styles.subImages}>
              <img src={item.images.sub1} alt="서브1" className={styles.subImage}/>
              <img src={item.images.sub2} alt="서브2" className={styles.subImage}/>
            </div>
          </div>

          <div className={styles.info}>
            <div>
              <div className={styles.storeName}>{item.name}</div>
              <div className={styles.details}>
                ⭐ {item.rating} ({item.reviews}) · {item.distance} ·{" "}
                <b>{item.deliveryFee}</b> · 최소주문 {item.minOrder}
              </div>
            </div>
            <div className={styles.time}>{item.time}</div>
          </div>
        </div>
      ))}
    </>
  );
}