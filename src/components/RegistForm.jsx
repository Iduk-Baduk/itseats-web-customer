// src/features/auth/components/SignUpForm.jsx
import React from 'react';
import useRegistForm from '../hooks/useRegistForm';

const RegistForm = () => {
  const { form, error, handleChange, handleSubmit } = useRegistForm();

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="username"
        type="text"
        placeholder="사용자 ID"
        value={form.username}
        onChange={handleChange}
      />      
      <input
        name="password"
        type="password"
        placeholder="비밀번호"
        value={form.password}
        onChange={handleChange}
      />
      <input
        name="nickname"
        type="text"
        placeholder="닉네임"
        value={form.nickname}
        onChange={handleChange}
      />  
      <input
        name="email"
        type="email"
        placeholder="이메일"
        value={form.email}
        onChange={handleChange}
      />
       <input
        name="phone"
        type="text"
        placeholder="전화번호"
        value={form.phone}
        onChange={handleChange}
      />  
      <select 
      name="usertype" 
      size="3"
      value={form.usertype}
      onChange={handleChange}>
        <option value="CUSTOMER">사용자</option>
        <option value="OWNER">가맹점</option>
        <option value="RIDER">라이더</option>
      </select>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">가입하기</button>
    </form>
  );
};

export default RegistForm;
