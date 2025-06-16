import axios from 'axios';

export const regist = async ({ username, password, nickname, email, phone, usertype }) => {
  const res = await axios.post('/api/members/regist', {
    username,
    password,
    nickname,
    email,
    phone,
    usertype
  });
  return res.data;
};
