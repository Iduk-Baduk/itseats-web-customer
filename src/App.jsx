import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./layouts/Layout";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Favorite from "./pages/Favorite";
import Order from "./pages/Order";
import MyEats from "./pages/MyEats";
import StackTest from "./pages/StackTest";
import { AnimatePresence } from "framer-motion";
import Login from "./pages/Login";

function Root() {
  const location = useLocation();

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/favorites" element={<Favorite />} />
            <Route path="/orders" element={<Order />} />
            <Route path="/my-eats" element={<MyEats />} />
          </Route>
          <Route path="/" element={<Layout navVisible={false} />}>
            <Route path="/stack-test" element={<StackTest />} />
            <Route path="/login" element={<Login />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  );
}
