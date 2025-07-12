import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectAddress,
  addAddressAsync,
  fetchAddressListAsync,
  updateAddressAsync,
  removeAddressAsync,
} from "../store/addressSlice";

export default function useAddressRedux() {
  const dispatch = useDispatch();
  const { addresses, selectedAddressId, isLoading, error } = useSelector(
    (state) => state.address
  );

  useEffect(() => {
    // 주소 목록이 비어있을 때만 서버에서 가져오기
    if (addresses.length === 0) {
      dispatch(fetchAddressListAsync());
    }
  }, [dispatch, addresses.length]);

  const selectedAddress =
    addresses.find((addr) => addr.id === selectedAddressId) || null;

  return {
    addresses,
    selectedAddressId,
    selectedAddress,
    isLoading,
    error,
    addAddress: (address) => dispatch(addAddressAsync(address)),
    updateAddress: (id, address) =>
      dispatch(updateAddressAsync({ id, ...address })),
    removeAddress: (id) => dispatch(removeAddressAsync(id)),
    selectAddress: (id) => dispatch(selectAddress(id)),
    refreshAddresses: () => dispatch(fetchAddressListAsync()),
  };
}
