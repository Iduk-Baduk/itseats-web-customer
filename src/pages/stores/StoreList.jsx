import Header from "../../components/common/Header";
import { useNavigate, useSearchParams } from "react-router-dom";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import StoreListItem from "../../components/stores/StoreListItem";
import SortBottomSheet, {
  getSortLabel,
} from "../../components/stores/SortBottomSheet";
import Tabs from "../../components/stores/Tabs";
import { getCategoryName } from "../../utils/categoryUtils";

import styles from "./StoreList.module.css";
import { useState } from "react";

const dummyStores = [
  {
    storeId: 1,
    name: "버거킹 구름점",
    review: 4.9,
    reviewCount: 1742,
    minutesToDelivery: 30,
  },
  {
    storeId: 2,
    name: "맘스터치 구름점",
    review: 4.8,
    reviewCount: 52,
    minutesToDelivery: 25,
  },
  {
    storeId: 3,
    name: "청년닭발 구름점",
    review: 3.1,
    reviewCount: 124,
    minutesToDelivery: 40,
  },
  {
    storeId: 4,
    name: "피자헛 구름점",
    review: 4.2,
    reviewCount: 172,
    minutesToDelivery: 35,
  },
  {
    storeId: 5,
    name: "청룡각 구름점",
    review: 4.9,
    reviewCount: 742,
    minutesToDelivery: 30,
  },
  {
    storeId: 6,
    name: "떡볶이 참 잘하는집 구름점",
    review: 4.2,
    reviewCount: 945,
    minutesToDelivery: 10,
  },
];

export default function StoreList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category");

  const sortParam = searchParams.get("sort");
  const [sort, setSort] = useState(sortParam || "order");
  const [isSortSheetOpen, setSortSheetOpen] = useState(false);

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
        <div className={styles.container}>
          <div className={styles.options}>
            <button
              className={styles.sortButton}
              aria-label="정렬 조건"
              onClick={() => setSortSheetOpen(true)}
            >
              <span>{getSortLabel(sort)}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M15.88 9.29L12 13.17L8.12 9.29a.996.996 0 1 0-1.41 1.41l4.59 4.59c.39.39 1.02.39 1.41 0l4.59-4.59a.996.996 0 0 0 0-1.41c-.39-.38-1.03-.39-1.42 0"
                />
              </svg>
            </button>
          </div>
          {dummyStores.map((store) => (
            <StoreListItem
              key={store.storeId}
              store={store}
              onClick={() => navigate(`/stores/${store.storeId}`)}
            />
          ))}
        </div>

        <SortBottomSheet
          sort={sort}
          isOpen={isSortSheetOpen}
          onClose={() => setSortSheetOpen(false)}
          onSelect={(sort) => {
            setSort(sort);
            const params = Object.fromEntries(searchParams.entries());
            setSearchParams({ ...params, sort }, { replace: true });
          }}
        />
      </div>
    </SlideInFromRight>
  );
}
