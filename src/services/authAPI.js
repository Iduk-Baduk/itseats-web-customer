import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';

export const regist = async (form) => {
  const { username, password, nickname, email, phone, usertype } = form;
  
  const requestData = {
    username,
    password,
    nickname,
    email,
    phone,
    usertype
  };
  
  console.log("📡 API 요청 URL:", API_ENDPOINTS.AUTH_REGISTER);
  console.log("📡 API 요청 데이터:", requestData);
  
  return await apiClient.post(API_ENDPOINTS.AUTH_REGISTER, requestData);
};


