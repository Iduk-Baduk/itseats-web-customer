import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import SlideInFromRight from "../../components/animation/SlideInFromRight";

export default function OrderStatus() {
  const navigate = useNavigate();

  return (
    <SlideInFromRight>
      <div>
        <Header
          title=""
          leftIcon="close"
          rightIcon={null}
          leftButtonAction={() => {
            navigate(-1);
          }}
        />
      <div
        style={{
          width: "100%",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
            alignItems: "center",
          }}
        >
          <h1>배달 현황</h1>
        </div>
      </div>
    </SlideInFromRight>
  );
}
