import Header from "../../components/common/Header";
import { useNavigate, useParams } from "react-router-dom";
import SlideInFromRight from "../../components/animation/SlideInFromRight";

export default function MenuDetail() {
  const navigate = useNavigate();

  const { menuId } = useParams();

  return (
    <SlideInFromRight>
      <div>
        <Header
          title="메뉴 상세"
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
          <h1>메뉴 상세 페이지 menuId: {menuId}</h1>
        </div>
      </div>
    </SlideInFromRight>
  );
}
