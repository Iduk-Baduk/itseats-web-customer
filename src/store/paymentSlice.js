// src/store/paymentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// 서버에서 결제수단 가져오기
export const fetchPaymentMethods = createAsyncThunk(
  "payment/fetchPaymentMethods",
  async () => {
    const response = await fetch("/api/payment-methods");
    return await response.json(); // { cards: [...], accounts: [...], coupayMoney: 0 }
  }
);

const paymentSlice = createSlice({
  name: "payment",
  initialState: {
    cards: [],
    accounts: [],
    coupayMoney: 0,
    isLoading: false,
    error: null,
  },
  reducers: {
    removeCard: (state, action) => {
      state.cards = state.cards.filter((card) => card.id !== action.payload);
    },
    removeAccount: (state, action) => {
      state.accounts = state.accounts.filter(
        (account) => account.id !== action.payload
      );
    },
    addCard: (state, action) => {
      state.cards.push(action.payload); // { id, name, last4, image }
    },
    addAccount: (state, action) => {
      state.accounts.push(action.payload); // { id, bankName, last4, image }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentMethods.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.cards = action.payload.cards;
        state.accounts = action.payload.accounts;
        state.coupayMoney = action.payload.coupayMoney;
        state.isLoading = false;
      })
      .addCase(fetchPaymentMethods.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  },
});

export const {
  removeCard,
  removeAccount,
  addCard,
  addAccount,
} = paymentSlice.actions;

export default paymentSlice.reducer;
