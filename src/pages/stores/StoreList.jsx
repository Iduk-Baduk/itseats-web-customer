import Header from "../../components/common/Header";
import { useNavigate, useSearchParams } from "react-router-dom";
import SlideInFromRight from "../../components/animation/SlideInFromRight";

export default function StoreList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");

  return (
    <SlideInFromRight>
      <div>
        <Header
          title={category}
          leftButtonAction={() => {
            navigate(-1);
          }}
        />
        <div
          style={{ margin: "20px" }}
        >
          <h1>카테고리별 가게 목록</h1>
        </div>
      </div>
    </SlideInFromRight>
  );
}
