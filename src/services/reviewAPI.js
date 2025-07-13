import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * 리뷰 제출 API
 */
export async function submitReview(orderId, payload) {
  return await apiClient.post(API_ENDPOINTS.REVIEW_BY_ORDER_ID(orderId), payload);
}
