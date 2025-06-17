import Header from "../../components/common/Header";
import { useNavigate, useParams } from "react-router-dom";
import SlideInFromRight from "../../components/animation/SlideInFromRight";

export default function StoreDetail() {
  const navigate = useNavigate();
  const { storeId } = useParams();

  return (
    <SlideInFromRight>
      <div>
        <Header
          title={storeId}
          leftButtonAction={() => {
            navigate(-1);
          }}
        />
        <div
          style={{ margin: "80px 20px" }}
        >
          <h1>가맹점 상세페이지 Store ID: {storeId}</h1>
        </div>
      </div>
    </SlideInFromRight>
  );
}
