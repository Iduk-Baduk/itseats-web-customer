import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { increase, decrease } from "../modules/counterModule";

const Counter = () => {
  const count = useSelector((state) => state.counter.count);
  const dispatch = useDispatch();

const isFirstRender = useRef(true);

useEffect(() => {
  if (isFirstRender.current) {
    isFirstRender.current = false;
    return; // ✅ 첫 렌더링은 저장하지 마!
  }

  localStorage.setItem("count", count.toString());
  console.log("💾 저장된 값:", count);
}, [count]);

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>🔢 Counter</h2>
      <h1>{count}</h1>
      <button onClick={() => dispatch(increase())}>+ 증가</button>
      <button onClick={() => dispatch(decrease())} style={{ marginLeft: "10px" }}>
        - 감소
      </button>
    </div>
  );
};

export default Counter;
