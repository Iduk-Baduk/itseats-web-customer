import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * 리뷰 제출 API
 */
export async function submitReview(orderId, payload) {
  try {
    const result = await apiClient.post(API_ENDPOINTS.REVIEW_BY_ORDER_ID(orderId), payload);
    console.log('✅ 리뷰 제출 응답:', result);
    return result;  // interceptors로 이미 .data까지만 내려옴
  } catch (error) {
    console.error('❌ 리뷰 제출 실패:', error);
    throw error;
  }
}

export async function getMyReviews() {
  try {
    const result = await apiClient.get(API_ENDPOINTS.MY_REVIEWS);
    console.log('✅ 내 리뷰 조회 응답:', result);
    return result.data;  // result === { httpStatus, message, data }
  } catch (error) {
    console.error('❌ 내 리뷰 조회 실패:', error);
    throw error;
  }
}
