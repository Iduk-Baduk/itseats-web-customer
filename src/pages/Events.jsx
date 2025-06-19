 import { useNavigate } from "react-router-dom";
import useEventList from "../hooks/useEventList";
import styles from "./Events.module.css";

export default function Events() {
  const navigate = useNavigate();
  const { events } = useEventList();

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>전체보기</h2>

      <div className={styles.eventList}>
        {events.map((event) => (
          <div
            key={event.eventId}
            className={styles.banner}
            onClick={() => navigate(`/events/${event.eventId}`)}
          >
            <img
              src={event.image}
              alt={event.title || "이벤트 배너"}
              className={styles.image}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
