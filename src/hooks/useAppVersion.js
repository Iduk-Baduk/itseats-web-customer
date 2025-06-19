import { useState, useEffect } from "react";

export default function useAppVersion() {
  const [version, setVersion] = useState("-");

  useEffect(() => {
    // 실제 배포 시에는 fetch나 import.meta.env 등을 사용할 수 있습니다
    setTimeout(() => {
      setVersion("1.5.23"); // 예시 버전
    }, 200);
  }, []);

  return { version };
}
