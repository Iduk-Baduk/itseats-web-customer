import { useSelector, useDispatch } from "react-redux";
import {
  updateAddress,
  removeAddress,
  selectAddress,
  addAddressAsync,
} from "../store/addressSlice";

export default function useAddressRedux() {
  const dispatch = useDispatch();
  const { addresses, selectedAddressId } = useSelector((state) => state.address);

  const selectedAddress =
    addresses.find((addr) => addr.id === selectedAddressId) || null;

  return {
    addresses,
    selectedAddressId,
    selectedAddress,
    addAddress: (address) => dispatch(addAddressAsync(address)),
    updateAddress: (address) => dispatch(updateAddress(address)),
    removeAddress: (id) => dispatch(removeAddress(id)),
    selectAddress: (id) => dispatch(selectAddress(id)),
  };
} 
