import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAddressRedux from "../../hooks/useAddressRedux";
import Header from "../../components/common/Header";
import AddressForm from "./AddressForm";
import ConfirmModal from "../../components/common/ConfirmModal";

export default function AddressNew() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { addresses, addAddress, updateAddress, removeAddress } = useAddressRedux();

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
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [existingAddress, setExistingAddress] = useState(null);
  const [pendingAddress, setPendingAddress] = useState(null);

  useEffect(() => {
    setCurrentAddress(initialAddress);
  }, [initialAddress]);

  const handleAddressChange = (newAddress) => {
    setCurrentAddress(newAddress);
  };

  // 중복 체크 및 주소 저장 처리
  const handleSubmit = () => {
    const fullAddress = [currentAddress.address, detailAddress].filter(Boolean).join(' ');
    const finalLabel = currentLabel === "기타" && customLabel ? customLabel : currentLabel;
    
    const newAddress = {
      label: finalLabel,
      address: fullAddress,
      roadAddress: currentAddress.roadAddress,
      guide: guideMessage,
      lat: currentAddress.lat,
      lng: currentAddress.lng,
      wowZone: true, // wowZone 로직은 추후 추가
    };

    // 집 또는 회사 라벨인 경우 중복 체크
    if (finalLabel === "집" || finalLabel === "회사") {
      const existing = addresses.find(addr => addr.label === finalLabel);
      if (existing) {
        // 기존 주소가 있으면 대체 확인 팝업 표시
        setExistingAddress(existing);
        setPendingAddress(newAddress);
        setShowReplaceModal(true);
        return;
      }
    }
    
    // 중복이 없거나 기타 라벨인 경우 바로 저장
    saveAddress(newAddress);
  };

  // 실제 주소 저장 함수
  const saveAddress = (addressData) => {
    addAddress(addressData);
    navigate("/address", { replace: true });
  };

  // 주소 대체 확인
  const handleReplaceConfirm = () => {
    if (existingAddress && pendingAddress) {
      // 기존 주소의 라벨을 "기타"로 변경
      const updatedExistingAddress = {
        ...existingAddress,
        label: "기타"
      };
      updateAddress(updatedExistingAddress);
      
      // 새 주소 추가
      saveAddress(pendingAddress);
    }
    setShowReplaceModal(false);
    setExistingAddress(null);
    setPendingAddress(null);
  };

  // 주소 대체 취소
  const handleReplaceCancel = () => {
    setShowReplaceModal(false);
    setExistingAddress(null);
    setPendingAddress(null);
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
      
      {/* 주소 대체 확인 팝업 */}
      {showReplaceModal && existingAddress && (
        <ConfirmModal
          message={`기존 등록된 '${existingAddress.label}' 주소가 '기타'로 변경되고, 새 주소가 '${pendingAddress.label}'로 등록됩니다.\n\n기존 주소: ${existingAddress.address}`}
          confirmText="확인"
          cancelText="취소"
          onConfirm={handleReplaceConfirm}
          onCancel={handleReplaceCancel}
        />
      )}
    </>
  );
}
