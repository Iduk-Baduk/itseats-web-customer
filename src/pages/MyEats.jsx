import React, { useState } from "react";
import Button from "../components/common/basic/Button";
import LineButton from "../components/common/basic/LineButton";
import TextInput from "../components/common/basic/TextInput";
import CheckBox from "../components/common/basic/CheckBox";
import styles from "./MyEats.module.css";
import { useNavigate } from "react-router-dom";

export default function MyEats() {
  const navigate = useNavigate();
  const [isChecked, setIsChecked] = useState(true);

  return (
    <div className={styles.container}>
      <div style={{ marginTop: "20px" }}>
        <h1>마이페이지 화면 (버튼 테스트)</h1>

        <div style={{ marginTop: "20px" }}>
          <TextInput
            placeholder="아이디(이메일)를 입력하세요"
            onChange={() => {}}
          />
        </div>

        <div style={{ marginTop: "20px" }}>
          <TextInput
            placeholder="비밀번호를 입력하세요"
            type="password"
            onChange={() => {}}
          />
        </div>

        <div style={{ marginTop: "20px" }}>
          <Button
            className={styles.fullButton}
            onClick={() => navigate("/stack-test")}
          >
            로그인
          </Button>
        </div>
        <div style={{ marginTop: "12px" }}>
          <LineButton
            className={styles.testButton}
            onClick={() => navigate("/stack-test")}
          >
            쿠팡 아이디(이메일)로 로그인
          </LineButton>
        </div>
        <div style={{ marginTop: "20px" }}>
          <CheckBox
            id="agree"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            label="이용약관 동의"
          />
        </div>
      </div>
    </div>
  );
}
