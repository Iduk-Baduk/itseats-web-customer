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
  const { addresses, selectedAddressId } = useSelector(
    (state) => state.address
  );

  useEffect(() => {
    dispatch(fetchAddressListAsync());
  }, [dispatch]);

  const selectedAddress =
    addresses.find((addr) => addr.id === selectedAddressId) || null;

  return {
    addresses,
    selectedAddressId,
    selectedAddress,
    addAddress: (address) => dispatch(addAddressAsync(address)),
    updateAddress: (id, address) =>
      dispatch(updateAddressAsync({ id, ...address })),
    removeAddress: (id) => dispatch(removeAddressAsync(id)),
    selectAddress: (id) => dispatch(selectAddress(id)),
  };
}
