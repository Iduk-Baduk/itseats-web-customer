import Header from "../components/common/Header";
import { useNavigate } from "react-router-dom";
import SlideInFromRight from "../components/animation/SlideInFromRight";

export default function Address() {
  const navigate = useNavigate();

  return (
    <SlideInFromRight>
      <div>
        <Header
          title="주소 관리"
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
          <h1>주소 관리</h1>
        </div>
      </div>
    </SlideInFromRight>
  );
}
