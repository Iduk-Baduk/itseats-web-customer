import { useParams, useNavigate } from "react-router-dom";
import useAddressManager, { getIconByLabel } from "./useAddressManager";

export default function useAddressEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    addressList,
    setAddressLabel,
  } = useAddressManager();

  const address = addressList.find((addr) => addr.id === parseInt(id));
  const currentLabel = address?.label;

  const handleLabelChange = (newLabel) => {
    if (address) {
      setAddressLabel(address.id, newLabel);
    }
  };

  return {
    address,
    currentLabel,
    handleLabelChange,
    navigate,
  };
}