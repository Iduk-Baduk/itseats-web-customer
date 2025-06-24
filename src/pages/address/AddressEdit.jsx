import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAddressRedux from "../../hooks/useAddressRedux";
import Header from "../../components/common/Header";
import AddressForm from "./AddressForm";
import ConfirmModal from "../../components/common/ConfirmModal";

export default function AddressEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addresses, updateAddress, removeAddress } = useAddressRedux();
  const addressToEdit = addresses.find((addr) => addr.id === id);

  const [currentLabel, setCurrentLabel] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [guideMessage, setGuideMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(addressToEdit || null);
  const [customLabel, setCustomLabel] = useState("");

  useEffect(() => {
    if (addressToEdit) {
      setCurrentLabel(addressToEdit.label);
      setGuideMessage(addressToEdit.guide || "");
      setCurrentAddress(addressToEdit);
      
      // 기타 라벨이 아닌 경우 별칭 설정
      if (addressToEdit.label !== "집" && addressToEdit.label !== "회사") {
        setCustomLabel(addressToEdit.label);
        setCurrentLabel("기타");
      }
      
      // 상세주소 분리 로직 개선
      if (addressToEdit.address.includes(addressToEdit.roadAddress)) {
         setDetailAddress(addressToEdit.address.replace(addressToEdit.roadAddress, "").trim());
      } else {
         setDetailAddress(""); // 혹은 다른 기본값
      }
    }
  }, [addressToEdit]);

  // addressToEdit 변경 시 currentAddress 동기화 (추가 안전장치)
  useEffect(() => {
    if (addressToEdit) {
      setCurrentAddress(addressToEdit);
    }
  }, [addressToEdit]);

  const handleAddressChange = (newAddress) => {
    setCurrentAddress(newAddress);
  };

  if (!addressToEdit) {
    return <div>주소를 찾을 수 없습니다.</div>;
  }

  const handleSubmit = () => {
    const finalLabel = currentLabel === "기타" && customLabel ? customLabel : currentLabel;
    
    const updatedAddress = {
      ...addressToEdit,
      label: finalLabel,
      address: `${currentAddress.roadAddress} ${detailAddress}`.trim(),
      roadAddress: currentAddress.roadAddress,
      guide: guideMessage,
      lat: currentAddress.lat,
      lng: currentAddress.lng,
    };
    updateAddress(updatedAddress);
    navigate("/address", { replace: true });
  };

  const handleDelete = () => {
    removeAddress(id);
    navigate("/address", { replace: true });
  };

  return (
    <>
      <Header
        title={"주소 수정"}
        leftIcon="back"
        rightIcon="delete"
        leftButtonAction={() => navigate(-1)}
        rightButtonAction={() => setIsModalOpen(true)}
      />
      <AddressForm
        address={currentAddress || addressToEdit}
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
      {isModalOpen && (
        <ConfirmModal
          message="이 주소를 삭제하시겠습니까?"
          onConfirm={handleDelete}
          onCancel={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
