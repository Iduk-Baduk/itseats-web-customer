import Header from "../../components/common/Header";
import { useNavigate, useSearchParams } from "react-router-dom";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import Tabs from "../../components/stores/Tabs";
import { getCategoryName } from "../../utils/categoryUtils";

export default function StoreList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");

  return (
    <SlideInFromRight>
      <div>
        <Header
          title={getCategoryName(category)}
          leftButtonAction={() => {
            navigate(-1);
          }}
          rightButtonAction={() => {
            navigate("/search");
          }}
          shadow={false}
        />
        <Tabs />
        <div
          style={{ margin: "20px" }}
        >
          <h1>카테고리별 가게 목록</h1>
        </div>
      </div>
    </SlideInFromRight>
  );
}
