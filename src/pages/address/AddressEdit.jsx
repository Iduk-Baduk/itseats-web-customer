import useAddressEdit from "../../hooks/useAddressEdit";
import AddressForm from "./AddressForm";
import Header from "../../components/common/Header";
import { useState } from "react";

export default function AddressEdit() {
  const { address, currentLabel, handleLabelChange, navigate } =
    useAddressEdit();

  const [detailAddress, setDetailAddress] = useState("");
  const [guideMessage, setGuideMessage] = useState("");

  if (!address) return <div>주소 정보를 찾을 수 없습니다.</div>;

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
        address={address}
        currentLabel={currentLabel}
        detailAddress={detailAddress}
        guideMessage={guideMessage}
        onChangeDetail={(e) => setDetailAddress(e.target.value)}
        onChangeGuide={(e) => setGuideMessage(e.target.value)}
        onChangeLabel={handleLabelChange}
        onSubmit={() => navigate("/address", { replace: true })}
      />
    </>
  );
}
