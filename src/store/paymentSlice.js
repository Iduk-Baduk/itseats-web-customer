// src/store/paymentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { paymentAPI } from "../services";

// 🎯 Axios 기반 Thunk로 변경
export const fetchPaymentMethods = createAsyncThunk(
  "payment/fetchPaymentMethods",
  async () => {
    return await paymentAPI.getPaymentMethods();
  }
);

// 카드 추가 Thunk
export const addCardAsync = createAsyncThunk(
  "payment/addCard",
  async (cardData) => {
    return await paymentAPI.addCard(cardData);
  }
);

// 계좌 추가 Thunk
export const addAccountAsync = createAsyncThunk(
  "payment/addAccount",
  async (accountData) => {
    return await paymentAPI.addAccount(accountData);
  }
);

// 카드 삭제 Thunk
export const deleteCardAsync = createAsyncThunk(
  "payment/deleteCard",
  async (cardId) => {
    await paymentAPI.deleteCard(cardId);
    return cardId;
  }
);

// 계좌 삭제 Thunk
export const deleteAccountAsync = createAsyncThunk(
  "payment/deleteAccount",
  async (accountId) => {
    await paymentAPI.deleteAccount(accountId);
    return accountId;
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
    selectedPaymentType: 'card', // 'coupay', 'card', 'account'
    selectedCardId: null,
    selectedAccountId: null,
  },
  reducers: {
    removeCard: (state, action) => {
      state.cards = state.cards.filter((card) => card.id !== action.payload);
      if (state.selectedCardId === action.payload) {
        state.selectedCardId = null;
      }
    },
    removeAccount: (state, action) => {
      state.accounts = state.accounts.filter(
        (account) => account.id !== action.payload
      );
      if (state.selectedAccountId === action.payload) {
        state.selectedAccountId = null;
      }
    },
    addCard: (state, action) => {
      state.cards.push(action.payload);
    },
    addAccount: (state, action) => {
      state.accounts.push(action.payload);
    },
    setSelectedPaymentMethod: (state, action) => {
      const { type, cardId, accountId } = action.payload;
      state.selectedPaymentType = type;
      if (type === 'card') {
        state.selectedCardId = cardId;
        state.selectedAccountId = null;
      } else if (type === 'account') {
        state.selectedAccountId = accountId;
        state.selectedCardId = null;
      } else {
        state.selectedCardId = null;
        state.selectedAccountId = null;
      }
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
      })
      // 카드 추가
      .addCase(addCardAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addCardAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cards.push(action.payload);
      })
      .addCase(addCardAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // 계좌 추가
      .addCase(addAccountAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addAccountAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts.push(action.payload);
      })
      .addCase(addAccountAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // 카드 삭제
      .addCase(deleteCardAsync.fulfilled, (state, action) => {
        state.cards = state.cards.filter((card) => card.id !== action.payload);
        if (state.selectedCardId === action.payload) {
          state.selectedCardId = null;
        }
      })
      // 계좌 삭제
      .addCase(deleteAccountAsync.fulfilled, (state, action) => {
        state.accounts = state.accounts.filter(
          (account) => account.id !== action.payload
        );
        if (state.selectedAccountId === action.payload) {
          state.selectedAccountId = null;
        }
      });
  },
});

export const { removeCard, removeAccount, addCard, addAccount, setSelectedPaymentMethod } =
  paymentSlice.actions;

export default paymentSlice.reducer;
