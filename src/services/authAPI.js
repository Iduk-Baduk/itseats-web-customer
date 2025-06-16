import axios from 'axios';

const MOCK_MODE = true;

export const regist = async (form) => {
  if (MOCK_MODE) {
    console.log("✅ MOCK MODE - 실제 API 대신 처리됨");
    return new Promise((resolve) => {
      setTimeout(() => resolve({ message: "mock 가입 완료" }), 300);
    });
  }
};

// - 실제 연동시 사용되는 코드
// export const regist = async ({ username, password, nickname, email, phone, usertype }) => {
//   const regist = await axios.post('/api/members/regist', {
//     username,
//     password,
//     nickname,
//     email,
//     phone,
//     usertype
//   });
//   return regist.data;
// };
