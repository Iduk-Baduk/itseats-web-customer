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

  useEffect(() => {
    if (addressToEdit) {
      setCurrentLabel(addressToEdit.label);
      setGuideMessage(addressToEdit.guide || "");
      
      // 상세주소 분리 로직 개선
      if (addressToEdit.address.includes(addressToEdit.roadAddress)) {
         setDetailAddress(addressToEdit.address.replace(addressToEdit.roadAddress, "").trim());
      } else {
         setDetailAddress(""); // 혹은 다른 기본값
      }

    }
  }, [addressToEdit]);

  if (!addressToEdit) {
    return <div>주소를 찾을 수 없습니다.</div>;
  }

  const handleSubmit = () => {
    const updatedAddress = {
      ...addressToEdit,
      label: currentLabel,
      address: `${addressToEdit.roadAddress} ${detailAddress}`.trim(),
      guide: guideMessage,
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
        address={addressToEdit}
        currentLabel={currentLabel}
        detailAddress={detailAddress}
        guideMessage={guideMessage}
        onChangeDetail={(e) => setDetailAddress(e.target.value)}
        onChangeGuide={(e) => setGuideMessage(e.target.value)}
        onChangeLabel={setCurrentLabel}
        onSubmit={handleSubmit}
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
