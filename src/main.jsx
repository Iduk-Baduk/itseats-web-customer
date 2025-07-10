import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./Store.js"; // 명시적으로 .js 확장자 포함
import App from "./App.jsx";
import "./index.css";
import "./variables.css";
import "./styles/utilities.css";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <App />
  </Provider>
);
