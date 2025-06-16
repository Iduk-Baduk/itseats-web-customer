import React from "react";
import { useNavigate } from "react-router-dom";
import LineButton from "../components/common/basic/LineButton";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <div>
        <h1>홈 화면</h1>

        <div style={{ marginTop: "20px" }}>
          <LineButton onClick={() => navigate("/stack-test")}>
            새 페이지 열기 테스트
          </LineButton>
        </div>
      </div>
    </div>
  );
}
