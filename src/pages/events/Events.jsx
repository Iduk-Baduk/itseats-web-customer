import { useNavigate } from "react-router-dom";
import useEventList from "../../hooks/useEventList";
import Header from "../../components/common/Header";
import OptimizedImage from "../../components/common/OptimizedImage";
import styles from "./Events.module.css";

export default function Events() {
  const navigate = useNavigate();
  const { events } = useEventList();

  return (
    <div className={styles.container}>
      <Header
        title="진행 중인 이벤트"
        leftButtonAction={() => {
          navigate(-1);
        }}
        rightIcon=""
      />
      <div className={styles.eventList}>
        {events.map((event, index) => (
          <div
            key={event.eventId}
            className={styles.banner}
            onClick={() => navigate(`/events/${event.eventId}`)}
          >
            <OptimizedImage
              src={event.image}
              alt={event.title || "이벤트 배너"}
              className={styles.image}
              priority={index < 2} // 상위 2개 이벤트만 우선 로딩
              width={350}
              height={200}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
