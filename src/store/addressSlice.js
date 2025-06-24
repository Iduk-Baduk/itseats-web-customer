import { createSlice } from "@reduxjs/toolkit";

const loadFromLocalStorage = () => {
  try {
    const serializedState = localStorage.getItem("itseats-address");
    if (serializedState === null) {
      return {
        addresses: [],
        selectedAddressId: null,
      };
    }
    const storedState = JSON.parse(serializedState);
    const addresses = storedState.addresses || [];
    let selectedAddressId = storedState.selectedAddressId;
    
    // 주소가 있지만 선택된 주소가 없거나, 선택된 주소가 존재하지 않는 경우
    if (addresses.length > 0 && (!selectedAddressId || !addresses.find(addr => addr.id === selectedAddressId))) {
      selectedAddressId = addresses[0].id;
    }
    
    return {
      addresses,
      selectedAddressId,
    };
  } catch (e) {
    console.warn("Could not load address state from localStorage", e);
    return {
      addresses: [],
      selectedAddressId: null,
    };
  }
};

const saveToLocalStorage = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("itseats-address", serializedState);
  } catch (e) {
    console.warn("Could not save address state to localStorage", e);
  }
};

const initialState = loadFromLocalStorage();

const addressSlice = createSlice({
  name: "address",
  initialState,
  reducers: {
    addAddress: (state, action) => {
      const newAddress = { ...action.payload, id: new Date().toISOString() };
      state.addresses.push(newAddress);
      
      // 첫 번째 주소이거나 선택된 주소가 없는 경우 자동 선택
      if (state.addresses.length === 1 || !state.selectedAddressId) {
        state.selectedAddressId = newAddress.id;
      }
      
      saveToLocalStorage(state);
    },
    updateAddress: (state, action) => {
      const index = state.addresses.findIndex(
        (addr) => addr.id === action.payload.id
      );
      if (index !== -1) {
        state.addresses[index] = action.payload;
        saveToLocalStorage(state);
      }
    },
    removeAddress: (state, action) => {
      state.addresses = state.addresses.filter(
        (addr) => addr.id !== action.payload
      );
      if (state.selectedAddressId === action.payload) {
        state.selectedAddressId =
          state.addresses.length > 0 ? state.addresses[0].id : null;
      }
      saveToLocalStorage(state);
    },
    selectAddress: (state, action) => {
      state.selectedAddressId = action.payload;
      saveToLocalStorage(state);
    },
  },
});

export const { addAddress, updateAddress, removeAddress, selectAddress } =
  addressSlice.actions;

export default addressSlice.reducer; 
