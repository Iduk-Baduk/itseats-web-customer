import { createStore } from "redux";
import rootReducer from "./modules"; // modules/index.js

const store = createStore(rootReducer);

export default store;
