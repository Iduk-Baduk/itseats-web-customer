import { combineReducers } from "redux";
import counter from "./counterModule"; // ← 만든 리듀서들 import

const rootReducer = combineReducers({
  counter, // state.counter로 접근 가능
});

export default rootReducer;
