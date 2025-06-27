import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { increment, decrement } from "../modules/counterModule";

const Counter = () => {
  const count = useSelector((state) => state.counter.count);
  const dispatch = useDispatch();
  const prevCountRef = useRef();

  useEffect(() => {
    prevCountRef.current = count;
  });

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>🔢 Counter</h2>
      <h1>{count}</h1>
      <button onClick={() => dispatch(increment())}>+ 증가</button>
      <button onClick={() => dispatch(decrement())} style={{ marginLeft: "10px" }}>
        - 감소
      </button>
      <p>이전 값: {prevCountRef.current}</p>
    </div>
  );
};

export default Counter;
