import { combineReducers } from "redux";
import counter from "./counterModule";

const rootReducer = combineReducers({
  counter, // state.counter로 접근 가능
});

export default rootReducer;
