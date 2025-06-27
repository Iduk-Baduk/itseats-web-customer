// src/Root.jsx
import React, { Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { Routes, Route, useLocation } from "react-router-dom";

import Layout from "./layouts/Layout";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ErrorBoundary from "./components/common/ErrorBoundary";

// 즉시 로딩 (핵심 페이지)
import Home from "./pages/Home";

// 지연 로딩 (나머지 페이지들)
const Search = React.lazy(() => import("./pages/search/Search"));
const SearchResults = React.lazy(() => import("./pages/search/SearchResults"));
const Favorite = React.lazy(() => import("./pages/Favorite"));
const Order = React.lazy(() => import("./pages/orders/Order"));
const OrderStatus = React.lazy(() => import("./pages/orders/OrderStatus"));
const Review = React.lazy(() => import("./pages/orders/Review"));
const Address = React.lazy(() => import("./pages/address/Address"));
const AddressSearch = React.lazy(() => import("./pages/address/AddressSearch"));
const AddressEdit = React.lazy(() => import("./pages/address/AddressEdit"));
const AddressNew = React.lazy(() => import("./pages/address/AddressNew"));
const AddressCurrentLocation = React.lazy(() => import("./pages/address/AddressCurrentLocation"));
const StoreList = React.lazy(() => import("./pages/stores/StoreList"));
const StoreDetail = React.lazy(() => import("./pages/stores/StoreDetail"));
const StoreInfo = React.lazy(() => import("./pages/stores/StoreInfo"));
const MenuDetail = React.lazy(() => import("./pages/stores/MenuDetail"));
const Cart = React.lazy(() => import("./pages/orders/Cart"));
const Register = React.lazy(() => import("./pages/Register"));
const Login = React.lazy(() => import("./pages/Login"));
const MyPage = React.lazy(() => import("./pages/mypage/MyPage"));
const MyPageDetails = React.lazy(() => import("./pages/mypage/MyPageDetails"));
const Coupons = React.lazy(() => import("./pages/coupons/Coupons"));
const Events = React.lazy(() => import("./pages/events/Events"));
const EventsDetails = React.lazy(() => import("./pages/events/EventsDetails"));
const Settings = React.lazy(() => import("./pages/mypage/Settings"));
const Payments = React.lazy(() => import("./pages/payments/Payments"));
const AddPaymentMethod = React.lazy(() => import("./pages/payments/AddPaymentMethod"));
const AddCard = React.lazy(() => import("./pages/payments/AddCard"));
const AddAccount = React.lazy(() => import("./pages/payments/AddAccount"));
const PaymentSuccess = React.lazy(() => import("./pages/payments/PaymentSuccess"));
const PaymentFailure = React.lazy(() => import("./pages/payments/PaymentFailure"));
const CouponHistory = React.lazy(() => import("./pages/coupons/CouponHistory"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Counter = React.lazy(() => import("./components/Counter"));
const TestOrder = React.lazy(() => import("./pages/TestOrder"));

// 페이지별 최적화된 로딩 메시지
const getLoadingMessage = (pathname) => {
  if (pathname.includes('/stores')) return '매장 정보를 불러오는 중...';
  if (pathname.includes('/orders')) return '주문 정보를 불러오는 중...';
  if (pathname.includes('/cart')) return '장바구니를 불러오는 중...';
  if (pathname.includes('/mypage')) return '마이페이지를 불러오는 중...';
  if (pathname.includes('/address')) return '주소 정보를 불러오는 중...';
  if (pathname.includes('/payments')) return '결제 정보를 불러오는 중...';
  return '페이지를 불러오는 중...';
};

// 지연 로딩 래퍼 컴포넌트
const LazyPageWrapper = ({ children }) => {
  const location = useLocation();
  
  return (
    <Suspense fallback={<LoadingSpinner message={getLoadingMessage(location.pathname)} />}>
      {children}
    </Suspense>
  );
};

export default function Root() {
  const location = useLocation();

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* 즉시 로딩 - 홈 페이지 */}
          <Route 
            path="/" 
            element={
              <Layout>
                <Home />
              </Layout>
            } 
          />

          {/* 지연 로딩 - 검색 관련 */}
          <Route 
            path="/search" 
            element={
              <Layout>
                <LazyPageWrapper>
                  <Search />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/search-result" 
            element={
              <Layout>
                <LazyPageWrapper>
                  <SearchResults />
                </LazyPageWrapper>
              </Layout>
            } 
          />

          {/* 지연 로딩 - 매장 관련 */}
          <Route 
            path="/stores" 
            element={
              <Layout>
                <LazyPageWrapper>
                  <StoreList />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/stores/:storeId" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <StoreDetail />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/stores/:storeId/info" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <StoreInfo />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/stores/:storeId/menus/:menuId" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <MenuDetail />
                </LazyPageWrapper>
              </Layout>
            } 
          />

          {/* 지연 로딩 - 주문 관련 */}
          <Route 
            path="/cart" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <Cart />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/orders" 
            element={
              <Layout>
                <LazyPageWrapper>
                  <Order />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/orders/:orderId" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <OrderStatus />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/orders/:orderId/status" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <OrderStatus />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/orders/:orderId/review" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <Review />
                </LazyPageWrapper>
              </Layout>
            } 
          />

          {/* 지연 로딩 - 주소 관련 */}
          <Route 
            path="/address" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <Address />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/address/search" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <AddressSearch />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/address/edit/:id" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <AddressEdit />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/address/new" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <AddressNew />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/address/current-location" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <AddressCurrentLocation />
                </LazyPageWrapper>
              </Layout>
            } 
          />

          {/* 지연 로딩 - 마이페이지 관련 */}
          <Route 
            path="/mypage" 
            element={
              <Layout>
                <LazyPageWrapper>
                  <MyPage />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/mypage/details" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <MyPageDetails />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/mypage/settings" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <Settings />
                </LazyPageWrapper>
              </Layout>
            } 
          />

          {/* 지연 로딩 - 결제 관련 */}
          <Route 
            path="/payments" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <Payments />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/payments/add" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <AddPaymentMethod />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/payments/add/card" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <AddCard />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/payments/add/account" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <AddAccount />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/payments/success" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <PaymentSuccess />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/payments/failure" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <PaymentFailure />
                </LazyPageWrapper>
              </Layout>
            } 
          />

          {/* 지연 로딩 - 기타 페이지들 */}
          <Route 
            path="/favorites" 
            element={
              <Layout>
                <LazyPageWrapper>
                  <Favorite />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/coupons" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <Coupons />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/coupons/history" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <CouponHistory />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/events" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <Events />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/events/:eventId" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <EventsDetails />
                </LazyPageWrapper>
              </Layout>
            } 
          />

          {/* 지연 로딩 - 인증 관련 */}
          <Route 
            path="/login" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <Login />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/register" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <Register />
                </LazyPageWrapper>
              </Layout>
            } 
          />

          {/* 지연 로딩 - 개발/테스트 페이지들 */}
          <Route 
            path="/counter" 
            element={
              <Layout>
                <LazyPageWrapper>
                  <Counter />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/test-order" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <TestOrder />
                </LazyPageWrapper>
              </Layout>
            } 
          />

          {/* 404 페이지 - 모든 라우트의 마지막에 위치 */}
          <Route 
            path="*" 
            element={
              <LazyPageWrapper>
                <NotFound />
              </LazyPageWrapper>
            } 
          />
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  );
}
