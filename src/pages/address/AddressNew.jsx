import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAddressRedux from "../../hooks/useAddressRedux";
import Header from "../../components/common/Header";
import AddressForm from "./AddressForm";

export default function AddressNew() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { addAddress } = useAddressRedux();

  const initialAddress = state?.selectedAddress || {
    address: "주소를 검색해주세요",
    roadAddress: "",
    lat: 37.5665,
    lng: 126.978,
  };

  const [currentLabel, setCurrentLabel] = useState(state?.label || "기타");
  const [detailAddress, setDetailAddress] = useState("");
  const [guideMessage, setGuideMessage] = useState("");
  const [currentAddress, setCurrentAddress] = useState(initialAddress);
  const [customLabel, setCustomLabel] = useState("");

  useEffect(() => {
    setCurrentAddress(initialAddress);
  }, [initialAddress]);

  const handleAddressChange = (newAddress) => {
    setCurrentAddress(newAddress);
  };

  const handleSubmit = () => {
    const fullAddress = [currentAddress.address, detailAddress].filter(Boolean).join(' ');
    const finalLabel = currentLabel === "기타" && customLabel ? customLabel : currentLabel;
    
    addAddress({
      label: finalLabel,
      address: fullAddress,
      roadAddress: currentAddress.roadAddress,
      guide: guideMessage,
      lat: currentAddress.lat,
      lng: currentAddress.lng,
      wowZone: true, // wowZone 로직은 추후 추가
    });
    navigate("/address", { replace: true });
  };

  return (
    <>
      <Header
        title={"주소 설정"}
        leftIcon="back"
        rightIcon={null}
        leftButtonAction={() => {
          navigate(-1);
        }}
      />
      <AddressForm
        address={currentAddress}
        currentLabel={currentLabel}
        detailAddress={detailAddress}
        guideMessage={guideMessage}
        onChangeDetail={(e) => setDetailAddress(e.target.value)}
        onChangeGuide={(e) => setGuideMessage(e.target.value)}
        onChangeLabel={setCurrentLabel}
        onSubmit={handleSubmit}
        onAddressChange={handleAddressChange}
        customLabel={customLabel}
        onChangeCustomLabel={(e) => setCustomLabel(e.target.value)}
      />
    </>
  );
}
