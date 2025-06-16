import React from "react";
import RegistForm from "../components/RegistForm"

export default function regist() {
  return (
    <div>
      <div style={{ width: "100%", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <h1>회원가입</h1>
        <RegistForm />
      </div>
    </div>
  );
}