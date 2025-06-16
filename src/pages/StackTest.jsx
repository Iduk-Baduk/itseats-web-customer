import Header from "../components/common/Header";
import { useNavigate } from "react-router-dom";
import SlideInFromRight from "../components/animation/SlideInFromRight";

export default function StackTest() {
  const navigate = useNavigate();

  return (
    <SlideInFromRight>
      <div>
        <Header
          shadow={false}
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
          <h1>스택 테스트</h1>
        </div>
      </div>
    </SlideInFromRight>
  );
}
