import { createActions, handleActions } from "redux-actions";

// 초기 상태
const initialState = {
  count: 0,
};

// 액션 타입 정의
const INCREASE = "COUNTER/INCREASE";
const DECREASE = "COUNTER/DECREASE";

// 액션 생성 함수
const SET = "COUNTER/SET";

export const { counter: { increase, decrease, set } } = createActions({
  COUNTER: {
    INCREASE: () => 1,
    DECREASE: () => 1,
    SET: (value) => value,
  },
});

const counterReducer = handleActions(
  {
    [INCREASE]: (state) => ({ count: state.count + 1 }),
    [DECREASE]: (state) => ({ count: state.count - 1 }),
    [SET]: (state, action) => ({ count: action.payload }),
  },
  initialState
);

export default counterReducer;
