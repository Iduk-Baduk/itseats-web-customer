import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import AddressAPI from "../services/addressAPI";

export const addAddressAsync = createAsyncThunk(
  'address/addAddressAsync',
  async (addressData) => {
    const addressId = await AddressAPI.createAddress(addressData);
    return { ...addressData, id: String(addressId), isTemporary: addressId.startsWith('temp_') };
  }
);

export const fetchAddressListAsync = createAsyncThunk(
  'address/fetchAddressListAsync',
  async () => {
    const addresses = await AddressAPI.getAddressList();
    return addresses.map(addr => ({
      id: String(addr.addressId),
      label: getAddressLabel(addr.addressCategory),
      address: [addr.mainAddress, addr.detailAddress].filter(Boolean).join(' '),
      roadAddress: addr.mainAddress,
      detailAddress: addr.detailAddress,
      lat: addr.lat,
      lng: addr.lng,
      isTemporary: false,
    }));
  }
);

export const updateAddressAsync = createAsyncThunk(
  'address/updateAddressAsync',
  async ({ id, ...addressData }) => {
    const result = await AddressAPI.updateAddress(id, addressData);
    return { 
      id, 
      ...addressData, 
      isTemporary: result.message?.includes('로컬') || id.startsWith('temp_')
    };
  }
);

export const removeAddressAsync = createAsyncThunk(
  'address/removeAddressAsync',
  async (addressId) => {
    const result = await AddressAPI.deleteAddress(addressId);
    return { addressId, isLocalOnly: result.message?.includes('로컬') };
  }
);

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

const initialState = {
  addresses: [],
  selectedAddressId: null,
  isLoading: false,
  error: null,
  ...loadFromLocalStorage(), // 로컬 스토리지에서 초기 상태 로드
};

const addressSlice = createSlice({
  name: "address",
  initialState,
  reducers: {
    selectAddress: (state, action) => {
      state.selectedAddressId = action.payload;
      saveToLocalStorage(state);
    },
  },
  extraReducers: (builder) => {
    builder
    .addCase(addAddressAsync.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(addAddressAsync.fulfilled, (state, action) => {
      const newAddress = action.payload;
      state.addresses.push(newAddress);

      if (state.addresses.length === 1 || !state.selectedAddressId) {
        state.selectedAddressId = newAddress.id;
      }

      saveToLocalStorage(state);
      state.isLoading = false;
    })
    .addCase(addAddressAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message;
    })
    .addCase(fetchAddressListAsync.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(fetchAddressListAsync.fulfilled, (state, action) => {
      state.isLoading = false;
      state.addresses = action.payload;

      // 기존에 선택된 ID가 새 목록에 있으면 유지, 없으면 첫 번째 주소로 설정
      if (state.selectedAddressId && state.addresses.some(a => a.id === state.selectedAddressId)) {
        // 유지
      } else {
        state.selectedAddressId = state.addresses[0]?.id || null;
      }
      saveToLocalStorage(state);
    })
    .addCase(fetchAddressListAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message;
      
      // 서버 오류 시 로컬 데이터가 있으면 에러를 무시하고 로컬 데이터 사용
      const localAddresses = loadFromLocalStorage().addresses;
      if (localAddresses.length > 0) {
        state.addresses = localAddresses;
        state.error = null; // 에러를 무시하고 로컬 데이터 사용
      }
    })
    .addCase(updateAddressAsync.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(updateAddressAsync.fulfilled, (state, action) => {
      const updatedAddress = action.payload;
      const index = state.addresses.findIndex(
        (addr) => addr.id === updatedAddress.id
      );
      if (index !== -1) {
        state.addresses[index] = updatedAddress;
        saveToLocalStorage(state);
      }
      state.isLoading = false;
    })
    .addCase(updateAddressAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message;
    })
    .addCase(removeAddressAsync.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(removeAddressAsync.fulfilled, (state, action) => {
      const { addressId, isLocalOnly } = action.payload;
      state.addresses = state.addresses.filter((addr) => addr.id !== addressId);
      if (state.selectedAddressId === addressId) {
        state.selectedAddressId =
          state.addresses.length > 0 ? state.addresses[0].id : null;
      }
      saveToLocalStorage(state);
      state.isLoading = false;
    })
    .addCase(removeAddressAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message;
    });
  }
});

const getAddressLabel = (category) => {
  switch (category) {
    case "HOUSE":
      return "집";
    case "COMPANY":
      return "회사";
    default:
      return "기타";
  }
};

export const { selectAddress } = addressSlice.actions;

export default addressSlice.reducer; 
