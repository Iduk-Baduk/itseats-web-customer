import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import useAddressRedux from "../../hooks/useAddressRedux";
import Header from "../../components/common/Header";
import AddressForm from "./AddressForm";
import ConfirmModal from "../../components/common/ConfirmModal";

export default function AddressEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addresses, updateAddress, removeAddress } = useAddressRedux();
  const addressToEdit = addresses.find((addr) => addr.id === id);

  const [currentLabel, setCurrentLabel] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [guideMessage, setGuideMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(addressToEdit || null);
  const [customLabel, setCustomLabel] = useState("");
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [existingAddress, setExistingAddress] = useState(null);
  const [pendingAddress, setPendingAddress] = useState(null);

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

  // 중복 체크 및 주소 수정 처리
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

    // 집 또는 회사 라벨로 변경하는 경우 중복 체크 (기존과 다른 라벨로 변경하는 경우만)
    if ((finalLabel === "집" || finalLabel === "회사") && finalLabel !== addressToEdit.label) {
      const existing = addresses.find(addr => addr.label === finalLabel && addr.id !== addressToEdit.id);
      if (existing) {
        // 기존 주소가 있으면 대체 확인 팝업 표시
        setExistingAddress(existing);
        setPendingAddress(updatedAddress);
        setShowReplaceModal(true);
        return;
      }
    }
    
    // 중복이 없거나 라벨을 변경하지 않는 경우 바로 저장
    saveAddress(updatedAddress);
  };

  // 실제 주소 저장 함수
  const saveAddress = (addressData) => {
    updateAddress(addressData);
    if (location.state && location.state.from === 'cart') {
      navigate('/cart', { replace: true });
    } else {
      navigate('/address', { replace: true });
    }
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
      
      // 현재 편집 중인 주소를 새 라벨로 저장
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

  const handleDelete = () => {
    removeAddress(id);
    navigate("/address", { replace: true });
  };

  return (
    <>
      <Header
        title={"주소 수정"}
        leftIcon="back"
        rightIcon={null}
        leftButtonAction={() => navigate(-1)}
        rightButtonAction={
          <button
            style={{ color: '#e53935', fontWeight: 'bold', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}
            onClick={() => setIsModalOpen(true)}
          >
            삭제
          </button>
        }
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
      
      {/* 주소 대체 확인 팝업 */}
      {showReplaceModal && existingAddress && (
        <ConfirmModal
          message={`기존 등록된 '${existingAddress.label}' 주소가 '기타'로 변경되고, 현재 주소가 '${pendingAddress.label}'로 변경됩니다.\n\n기존 주소: ${existingAddress.address}`}
          confirmText="확인"
          cancelText="취소"
          onConfirm={handleReplaceConfirm}
          onCancel={handleReplaceCancel}
        />
      )}
    </>
  );
}
