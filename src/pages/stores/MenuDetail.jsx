import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addMenu, replaceCartWithNewStore, selectCurrentStore } from "../../store/cartSlice";
import { useShare } from "../../hooks/useShare";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import HeaderMenuDetail from "../../components/stores/HeaderMenuDetail";
import ConfirmModal from "../../components/common/ConfirmModal";
import styles from "./MenuDetail.module.css";
import OptionInput from "../../components/stores/OptionInput";
import BottomButton from "../../components/common/BottomButton";

export default function MenuDetail() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { copyToClipboard, shareViaWebAPI } = useShare();
  const { menuId, storeId } = useParams();
  
  // Redux에서 현재 장바구니의 가게 정보 가져오기
  const currentStore = useSelector(selectCurrentStore);

  const [isTransparent, setTransparent] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState(
    dummyMenu.optionGroups.map((group) => ({ ...group, options: [] }))
  );
  const [showStoreChangeModal, setShowStoreChangeModal] = useState(false);
  const [pendingMenuData, setPendingMenuData] = useState(null);

  useEffect(() => {
    console.log("selectedOptions:", selectedOptions);
    console.log(
      "isRequiredOptionsNotSelected():",
      isRequiredOptionsNotSelected()
    );
  }, [selectedOptions]);

  useEffect(() => {
    const basePrice = parseInt(dummyMenu.menuPrice);
    const optionsPrice = selectedOptions.reduce(
      (total, group) =>
        total +
        group.options.reduce((sum, option) => sum + option.optionPrice, 0),
      0
    );
    setTotalPrice((basePrice + optionsPrice) * quantity);
  }, [quantity, selectedOptions]);

  useEffect(() => {
    const onScroll = () => {
      const target = document.getElementById("intro");
      if (!target) return;
      const rect = target.getBoundingClientRect();
      setTransparent(rect.bottom > 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleQuantityChange(delta) {
    setQuantity((prev) => Math.max(1, prev + delta));
  }

  function isRequiredOptionsNotSelected() {
    return selectedOptions.some(
      (group) => group.minSelect > group.options.length
    );
  }

  function createMenuData() {
    // API 스펙에 맞는 menuOptions 구조로 변환
    const menuOptions = selectedOptions.map((group, index) => ({
      optionGroupName: dummyMenu.optionGroups[index].optionGroupName,
      options: group.options.map(option => ({
        optionName: option.optionName,
        optionPrice: option.optionPrice
      }))
    })).filter(group => group.options.length > 0); // 선택된 옵션이 있는 그룹만

    return {
      menuId: dummyMenu.menuId,
      menuName: dummyMenu.menuName,
      menuPrice: dummyMenu.menuPrice,
      menuOptions: menuOptions, // API 스펙에 맞는 구조
      menuOption: selectedOptions, // 기존 구조 (하위 호환성)
      quantity,
      // 가게 정보 추가
      storeId: parseInt(storeId) || dummyStore.storeId,
      storeName: dummyStore.storeName,
      storeImage: dummyStore.storeImage
    };
  }

  function addToCart() {
    const menuData = createMenuData();
    
    // 현재 장바구니에 다른 가게의 메뉴가 있는지 확인
    if (currentStore && currentStore.storeId !== menuData.storeId) {
      // 다른 가게 메뉴가 있으면 확인 모달 표시
      setPendingMenuData(menuData);
      setShowStoreChangeModal(true);
      return;
    }

    // 같은 가게이거나 장바구니가 비어있으면 바로 추가
    dispatch(addMenu(menuData));
    alert("장바구니에 담겼습니다!");
    navigate("/cart");
  }

  function handleReplaceCart() {
    if (pendingMenuData) {
      dispatch(replaceCartWithNewStore(pendingMenuData));
      alert("장바구니에 담겼습니다!");
      navigate("/cart");
    }
    setShowStoreChangeModal(false);
    setPendingMenuData(null);
  }

  function handleKeepCurrentCart() {
    setShowStoreChangeModal(false);
    setPendingMenuData(null);
  }

  return (
    <SlideInFromRight>
      <div className={styles.container}>
        <HeaderMenuDetail
          isTransparent={isTransparent}
          title={dummyMenu.menuName}
          backButtonAction={() => navigate(-1)}
          shareButtonAction={async () => {
            const result = await shareViaWebAPI();
            if (!result.success) {
              const result = await copyToClipboard();
              alert(result.message);
            }
          }}
        />

        <div id="intro" className={styles.intro}>
          <img src={dummyMenu.image} alt={dummyMenu.menuName} />
        </div>

        <div className={styles.introContent}>
          <h1>{dummyMenu.menuName}</h1>
        </div>

        <div className={styles.description}>
          <p>{dummyMenu.menuDescription}</p>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>가격</span>
          <span className={styles.value}>{totalPrice.toLocaleString()}원</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>수량</span>
          <div className={styles.quantityControl}>
            <button
              className={styles.quantityButton}
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  d="M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <span className={styles.count}>{quantity}</span>
            <button
              className={styles.quantityButton}
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= 99}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {dummyMenu.optionGroups.map((group, index) => {
          const inputType =
            group.minSelect === 1 && group.maxSelect === 1
              ? "radio"
              : "checkbox";

          return (
            <div key={index} className={styles.optionGroup}>
              <div className={styles.optionGroupTitleContainer}>
                <h2 className={styles.optionGroupTitle}>
                  {group.optionGroupName}
                </h2>
                <span className={styles.optionGroupInfo}>
                  {group.minSelect === 1 && group.maxSelect === 1
                    ? "필수"
                    : [
                        group.minSelect > 0
                          ? `최소 ${group.minSelect}개`
                          : null,
                        group.maxSelect > 0
                          ? `최대 ${group.maxSelect}개`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                </span>
              </div>

              <div className={styles.options}>
                {group.options.map((option, idx) => {
                  const isHidden = option.optionStatus === "HIDDEN";
                  const isOutOfStock = option.optionStatus === "OUT_OF_STOCK";
                  if (isHidden) return null;

                  return (
                    <div key={idx} className={styles.option}>
                      <OptionInput
                        type={inputType}
                        checked={selectedOptions[index].options.some(
                          (opt) => opt.optionName === option.optionName
                        )}
                        onChange={() => {
                          setSelectedOptions((prev) =>
                            prev.map((g, i) => {
                              if (i !== index) return g;

                              const newOptions = [...g.options];
                              const alreadySelected = newOptions.some(
                                (opt) => opt.optionName === option.optionName
                              );

                              if (inputType === "radio") {
                                return {
                                  ...g,
                                  options: [
                                    {
                                      optionName: option.optionName,
                                      optionPrice: option.optionPrice,
                                    },
                                  ],
                                };
                              }

                              if (alreadySelected) {
                                return {
                                  ...g,
                                  options: newOptions.filter(
                                    (opt) =>
                                      opt.optionName !== option.optionName
                                  ),
                                };
                              } else {
                                if (
                                  group.maxSelect > 0 &&
                                  newOptions.length >= group.maxSelect
                                ) {
                                  alert(
                                    `최대 ${group.maxSelect}개까지 선택할 수 있습니다.`
                                  );
                                  return g;
                                }

                                return {
                                  ...g,
                                  options: [
                                    ...newOptions,
                                    {
                                      optionName: option.optionName,
                                      optionPrice: option.optionPrice,
                                    },
                                  ],
                                };
                              }
                            })
                          );
                        }}
                        label={option.optionName}
                        price={option.optionPrice}
                        id={`option-${index}-${idx}`}
                        disabled={isOutOfStock}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {dummyMenu.menuStatus === "OUT_OF_STOCK" ? (
          <BottomButton disabled={true}>
            <p>이 메뉴는 현재 품절입니다.</p>
          </BottomButton>
        ) : (
          <BottomButton
            onClick={addToCart}
            disabled={isRequiredOptionsNotSelected()}
            cartInfo={{
              itemCount: quantity,
              orderPrice: dummyMenu.menuPrice * quantity,
              totalPrice: totalPrice,
            }}
          >
            <span>{totalPrice.toLocaleString()}원 담기</span>
          </BottomButton>
        )}

        {showStoreChangeModal && (
          <ConfirmModal
            message={
              currentStore ? 
              `현재 장바구니에는 "${currentStore.storeName}"의 메뉴가 담겨있습니다.\n"${dummyStore.storeName}"의 메뉴를 추가하려면 기존 장바구니를 비워야 합니다.\n\n기존 장바구니를 비우고 새 메뉴를 담으시겠습니까?` :
              `장바구니를 새로 시작하시겠습니까?`
            }
            confirmText="네, 새로 담기"
            cancelText="취소"
            onConfirm={handleReplaceCart}
            onCancel={handleKeepCurrentCart}
          />
        )}
      </div>
    </SlideInFromRight>
  );
}

// 💡 테스트용 가게 데이터
const dummyStore = {
  storeId: 1,
  storeName: "카페 구름톤",
  storeImage: "/samples/food1.jpg"
};

// 💡 테스트용 메뉴 데이터
const dummyMenu = {
  menuId: 11,
  menuName: "아메리카노",
  menuDescription: "평범한 아메리카노입니다.",
  menuPrice: 2000,
  menuStatus: "ONSALE",
  menuGroupName: "음료",
  image: "/samples/food2.jpg",
  optionGroups: [
    {
      optionGroupName: "사이즈",
      minSelect: 1,
      maxSelect: 1,
      options: [
        { optionName: "숏", optionPrice: 0, optionStatus: "ONSALE" },
        { optionName: "톨", optionPrice: 500, optionStatus: "ONSALE" },
        { optionName: "벤티", optionPrice: 1000, optionStatus: "OUT_OF_STOCK" },
      ],
    },
    {
      optionGroupName: "샷 추가",
      minSelect: 0,
      maxSelect: 1,
      options: [
        { optionName: "1샷", optionPrice: 500, optionStatus: "ONSALE" },
        { optionName: "2샷", optionPrice: 1000, optionStatus: "ONSALE" },
      ],
    },
  ],
};
