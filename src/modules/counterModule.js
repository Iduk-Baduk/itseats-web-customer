import { createActions, handleActions } from "redux-actions";

// 초기 상태
const initialState = {
  count: 0,
};

// 액션 타입 정의
const INCREASE = "counter/INCREASE";
const DECREASE = "counter/DECREASE";

// 액션 생성 함수
export const { counter: { increase, decrease } } = createActions({
  COUNTER: {
    INCREASE: () => {},
    DECREASE: () => {},
  },
});

// 리듀서 정의
const counterReducer = handleActions(
  {
    [INCREASE]: (state) => ({ count: state.count + 1 }),
    [DECREASE]: (state) => ({ count: state.count - 1 }),
  },
  initialState
);

export default counterReducer;
