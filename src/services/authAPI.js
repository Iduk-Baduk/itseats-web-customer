import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';

export const regist = async (form) => {
  const { username, password, nickname, email, phone, usertype } = form;
  
  return await apiClient.post(API_ENDPOINTS.AUTH_REGISTER, {
    username,
    password,
    nickname,
    email,
    phone,
    usertype
  });
};


