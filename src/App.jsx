import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./layouts/Layout";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Favorite from "./pages/Favorite";
import Order from "./pages/Order";
import MyEats from "./pages/MyEats";
import StackTest from "./pages/StackTest";

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/favorites" element={<Favorite />} />
            <Route path="/orders" element={<Order />} />
            <Route path="/my-eats" element={<MyEats />} />
            <Route path="/stack-test" element={<StackTest />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}
