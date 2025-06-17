import { useLocation, useNavigate } from "react-router-dom";
import AddressForm from "./AddressForm";
import Header from "../../components/common/Header";
import { useState } from "react";

export default function AddressNew() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const selected = state?.selectedAddress;

  const [address] = useState(
    selected || {
      label: "기타",
      address: "서울시 기본주소\n기본 상세주소",
      wowZone: false,
    }
  );

  const [currentLabel, setCurrentLabel] = useState("기타");
  const [detailAddress, setDetailAddress] = useState("");
  const [guideMessage, setGuideMessage] = useState("");

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
        onChangeLabel={setCurrentLabel}
        onSubmit={() => navigate("/address", { replace: true })}
      />
    </>
  );
}
