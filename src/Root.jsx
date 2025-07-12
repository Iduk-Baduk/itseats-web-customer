// src/Root.jsx
import React, { Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { Routes, Route, useLocation } from "react-router-dom";

import Layout from "./layouts/Layout";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ErrorBoundary from "./components/common/ErrorBoundary";
import ProtectedRoute from "./components/common/ProtectedRoute";


// 즉시 로딩 (핵심 페이지)
import Home from "./pages/Home";

// 지연 로딩 (나머지 페이지들)
const Search = React.lazy(() => import("./pages/search/Search"));
const SearchResults = React.lazy(() => import("./pages/search/SearchResults"));
const Favorite = React.lazy(() => import("./pages/Favorite"));
const Order = React.lazy(() => import("./pages/orders/Order"));
const OrderStatus = React.lazy(() => import("./pages/orders/OrderStatus"));
const Review = React.lazy(() => import("./pages/orders/Review"));
const ReviewView = React.lazy(() => import("./pages/orders/ReviewView"));
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
const Settings = React.lazy(() => import("./pages/mypage/Settings"));
const Payments = React.lazy(() => import("./pages/payments/Payments"));
const AddPaymentMethod = React.lazy(() => import("./pages/payments/AddPaymentMethod"));
const AddCard = React.lazy(() => import("./pages/payments/AddCard"));
const AddAccount = React.lazy(() => import("./pages/payments/AddAccount"));
const PaymentSuccess = React.lazy(() => import("./pages/payments/PaymentSuccess"));
const PaymentFailure = React.lazy(() => import("./pages/payments/PaymentFailure"));
const TossPaymentSuccess = React.lazy(() => import("./pages/payments/TossPaymentSuccess"));
const TossPayment = React.lazy(() => import("./pages/payments/TossPayment"));
const CouponHistory = React.lazy(() => import("./pages/coupons/CouponHistory"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Counter = React.lazy(() => import("./components/Counter"));
const TestOrder = React.lazy(() => import("./pages/TestOrder"));
const TestBackendIntegration = React.lazy(() => import("./pages/TestBackendIntegration"));
const MyCoupons = React.lazy(() => import("./pages/coupons/MyCoupons"));


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
            path="/stores/list" 
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

          {/* 지연 로딩 - 주문 관련 (인증 필요) */}
          <Route 
            path="/cart" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <Cart />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/orders" 
            element={
              <Layout>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <Order />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/orders/:orderId" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <OrderStatus />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/orders/:orderId/status" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <OrderStatus />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/orders/:orderId/review" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <Review />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/orders/:orderId/review/view" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <ReviewView />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />

          {/* 지연 로딩 - 주소 관련 (인증 필요) */}
          <Route 
            path="/address" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <Address />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/address/search" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <AddressSearch />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/address/edit/:id" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <AddressEdit />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/address/new" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <AddressNew />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/address/current-location" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <AddressCurrentLocation />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />

          {/* 지연 로딩 - 마이페이지 관련 (인증 필요) */}
          <Route 
            path="/mypage" 
            element={
              <Layout>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <MyPage />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/mypage/details" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <MyPageDetails />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/mypage/settings" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />

          {/* 지연 로딩 - 결제 관련 (인증 필요) */}
          <Route 
            path="/payments" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <Payments />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/payments/add" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <AddPaymentMethod />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/payments/add/card" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <AddCard />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/payments/add/account" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <AddAccount />
                  </ProtectedRoute>
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
            path="/payments/toss" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <TossPayment />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/payments/toss/success" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <TossPaymentSuccess />
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
                  <ProtectedRoute>
                    <Favorite />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/coupons" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <Coupons />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/coupons/history" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <CouponHistory />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />

          {/* 지연 로딩 - 인증 관련 (인증 불필요) */}
          <Route 
            path="/login" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute requireAuth={false}>
                    <Login />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/register" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute requireAuth={false}>
                    <Register />
                  </ProtectedRoute>
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
          <Route 
            path="/test-backend" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <TestBackendIntegration />
                </LazyPageWrapper>
              </Layout>
            } 
          />
          <Route 
            path="/mypage/my-coupons"
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <ProtectedRoute>
                    <MyCoupons />
                  </ProtectedRoute>
                </LazyPageWrapper>
              </Layout>
            }
          />
          {/* 404 페이지 */}
          <Route 
            path="*" 
            element={
              <Layout navVisible={false}>
                <LazyPageWrapper>
                  <NotFound />
                </LazyPageWrapper>
              </Layout>
            } 
          />
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  );
}
