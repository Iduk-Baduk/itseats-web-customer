// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux"; // ✅ 추가
import store from "./store"; // ✅ store import
import Root from "./Root";

export default function App() {
  return (
    <Provider store={store}> {/* ✅ Redux Provider로 감싸기 */}
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </Provider>
  );
}