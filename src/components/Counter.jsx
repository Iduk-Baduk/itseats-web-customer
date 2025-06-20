import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { increase, decrease, set } from "../modules/counterModule";

const Counter = () => {
  const count = useSelector((state) => state.counter.count);
  const dispatch = useDispatch();

  // localStorage 동기화: 상태 저장
  useEffect(() => {
    localStorage.setItem("count", count.toString());
  }, [count]);

  // localStorage 동기화: 초기값 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("count");
    if (saved) {
      dispatch(set(parseInt(saved, 10)));
    }
  }, [dispatch]);
  
  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>🔢 Counter</h2>
      <h1>{count}</h1>
      <button onClick={() => {console.log("clicked +"); dispatch(increase());}}>+ 증가</button>
      <button
        onClick={() => dispatch(decrease())}
        style={{ marginLeft: "10px" }}
      >
        - 감소
      </button>
    </div>
  );
};

export default Counter;
