import { useState } from 'react';
import { regist } from '../services/authAPI';

export default function useRegistForm() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    nickname: '',
    email: '',
    phone: '',
    usertype: 'CUSTOMER'
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username ||!form.password || !form.nickname || !form.email || !form.phone || !form.usertype) {
      return setError('모든 항목을 입력해주세요.');
    }

    try {
      await regist(form);
      alert('회원가입 완료!');
      setError('');
    } catch (err) {
      setError('회원가입 실패. 다시 시도해주세요.');
    }
  };

  return { form, error, handleChange, handleSubmit };
}
