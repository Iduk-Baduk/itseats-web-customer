import { useState, useEffect } from "react";

export default function useEventList() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    setEvents([
      {
        eventId: 1,
        image: "icons/banners/event1.jpg",
        title: "던킨 여름 복권",
        endDate: "2025/06/22",
      },
      {
        eventId: 2,
        image: "icons/banners/event2.jpg",
        title: "두찜 박스 할인",
        endDate: "2025/06/22",
      },
    ]);
  }, []);

  return { events };
}