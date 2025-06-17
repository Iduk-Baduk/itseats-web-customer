import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./layouts/Layout";
import Home from "./pages/Home";
import Search from "./pages/search/Search";
import SearchResults from "./pages/search/SearchResults";
import Favorite from "./pages/Favorite";
import Order from "./pages/Order";
import MyEats from "./pages/MyEats";
import Address from "./pages/address/Address";
import AddressSearch from "./pages/address/AddressSearch";
import CompanyAdd from "./pages/address/CompanyAdd";
import AddressEdit from "./pages/address/AddressEdit";
import AddressNew from "./pages/address/AddressNew";
import StoreList from "./pages/stores/StoreList";
import StoreDetail from "./pages/stores/StoreDetail";
import MenuDetail from "./pages/stores/MenuDetail";
import StackTest from "./pages/StackTest";
import Register from "./pages/register";
import Login from "./pages/Login";
import { AnimatePresence } from "framer-motion";

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
            <Route path="/search-result" element={<SearchResults />} />
          </Route>
          <Route path="/" element={<Layout navVisible={false} />}>
            <Route path="/address" element={<Address />} />
            <Route path="/address/new" element={<AddressNew />} />
            <Route path="/address/edit/:id" element={<AddressEdit />} />
            <Route path="/address/search" element={<AddressSearch />} />
            <Route path="/address/company-add" element={<CompanyAdd />} />
            <Route path="/stores/list" element={<StoreList />} />
            <Route path="/stores/:storeId" element={<StoreDetail />} />
            <Route path="/stores/:storeId/menus/:menuId" element={<MenuDetail />} />
            <Route path="/stack-test" element={<StackTest />} />
            <Route path="/regist" element={<Register />} />
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
