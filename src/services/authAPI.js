import axios from 'axios';

export const regist = async ({ username, password, nickname, email, phone, usertype }) => {
  const regist = await axios.post('/api/members/regist', {
    username,
    password,
    nickname,
    email,
    phone,
    usertype
  });
  return regist.data;
};
