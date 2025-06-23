// src/store/paymentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// 🎯 수정된 Thunk: cards/accounts 개별 fetch
export const fetchPaymentMethods = createAsyncThunk(
  "payment/fetchPaymentMethods",
  async () => {
    const [cardsRes, accountsRes] = await Promise.all([
      fetch("/api/cards"),
      fetch("/api/accounts"),
    ]);

    if (!cardsRes.ok || !accountsRes.ok) {
      throw new Error("API 요청 실패");
    }

    const [cards, accounts] = await Promise.all([
      cardsRes.json(),
      accountsRes.json(),
    ]);

    return {
      cards,
      accounts,
      coupayMoney: 10000, // 더미 데이터
    };
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
      state.cards.push(action.payload);
    },
    addAccount: (state, action) => {
      state.accounts.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentMethods.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cards = action.payload.cards;
        state.accounts = action.payload.accounts;
        state.coupayMoney = action.payload.coupayMoney;
      })
      .addCase(fetchPaymentMethods.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  },
});

export const { removeCard, removeAccount, addCard, addAccount } =
  paymentSlice.actions;

export default paymentSlice.reducer;
