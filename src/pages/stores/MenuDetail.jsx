import Header from "../../components/common/Header";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useShare } from "../../hooks/useShare";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import HeaderMenuDetail from "../../components/stores/HeaderMenuDetail";
import styles from "./MenuDetail.module.css";
import OptionInput from "../../components/stores/OptionInput";
import BottomButton from "../../components/common/BottomButton";

export default function MenuDetail() {
  const navigate = useNavigate();
  const { copyToClipboard, shareViaWebAPI } = useShare();

  const { menuId } = useParams();
  const [isTransparent, setTransparent] = useState(true);

  const [totalPrice, setTotalPrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState(
    dummyMenu.optionGroups.map((group) => ({ ...group, options: [] }))
  );

  useEffect(() => {
    const basePrice = parseInt(dummyMenu.menuPrice);
    const optionsPrice = selectedOptions.reduce((total, group) => {
      return (
        total +
        group.options.reduce((sum, option) => {
          return sum + option.optionPrice;
        }, 0)
      );
    }, 0);
    setTotalPrice((basePrice + optionsPrice) * quantity);
  }, [quantity, selectedOptions]);

  // 아래로 스크롤 되었을 때 헤더 배경을 흰색으로 변경
  useEffect(() => {
    const onScroll = () => {
      const target = document.getElementById("intro");
      if (!target) return;

      const rect = target.getBoundingClientRect();
      // intro가 화면 밖으로 완전히 가려졌는지 확인
      setTransparent(rect.bottom > 0);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);


  // 개수 변경
  function handleQuantityChange(delta) {
    setQuantity((prev) => {
      const newQuantity = prev + delta;
      return newQuantity < 1 ? 1 : newQuantity;
    });
  };

  // 필수 옵션이 선택되지 않았는지 확인
  function isRequiredOptionsNotSelected() {
    return selectedOptions.some((group) => {
      return group.minSelect > group.options.length;
    });
  }

  // 장바구니에 넣기
  function addToCart() {
    alert("구현 필요");
  }

  return (
    <SlideInFromRight>
      <div className={styles.container}>
        <HeaderMenuDetail
          isTransparent={isTransparent}
          title={dummyMenu.menuName}
          backButtonAction={() => {
            navigate(-1);
          }}
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
                          setSelectedOptions((prev) => {
                            return prev.map((groupItem, i) => {
                              if (i !== index) return groupItem;

                              const newOptions = [...groupItem.options];

                              if (inputType === "radio") {
                                return {
                                  ...groupItem,
                                  options: [
                                    {
                                      optionName: option.optionName,
                                      optionPrice: option.optionPrice,
                                    },
                                  ],
                                };
                              } else {
                                const alreadySelected = newOptions.some(
                                  (opt) => opt.optionName === option.optionName
                                );

                                if (alreadySelected) {
                                  return {
                                    ...groupItem,
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
                                    return groupItem; // 변경 없음
                                  }

                                  return {
                                    ...groupItem,
                                    options: [
                                      ...newOptions,
                                      {
                                        optionName: option.optionName,
                                        optionPrice: option.optionPrice,
                                      },
                                    ],
                                  };
                                }
                              }
                            });
                          });
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
        <BottomButton onClick={addToCart} disabled={isRequiredOptionsNotSelected()}>
          <p>{totalPrice.toLocaleString()}원 장바구니에 담기</p>
        </BottomButton>
      </div>
    </SlideInFromRight>
  );
}

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
      isRequired: true,
      minSelect: 1,
      maxSelect: 1,
      priority: 1,
      options: [
        {
          optionName: "숏(Short)",
          optionPrice: 0,
          optionStatus: "ONSALE",
          optionPriority: 1,
        },
        {
          optionName: "톨(Tall)",
          optionPrice: 500,
          optionStatus: "ONSALE",
          optionPriority: 2,
        },
        {
          optionName: "그랑데(Grande)",
          optionPrice: 1000,
          optionStatus: "ONSALE",
          optionPriority: 3,
        },
        {
          optionName: "벤티(Venti)",
          optionPrice: 2000,
          optionStatus: "OUT_OF_STOCK",
          optionPriority: 4,
        },
      ],
    },
    {
      optionGroupName: "샷 추가",
      isRequired: false,
      minSelect: 0,
      maxSelect: 1,
      priority: 2,
      options: [
        {
          optionName: "1번 샷 추가",
          optionPrice: 500,
          optionStatus: "ONSALE",
          optionPriority: 1,
        },
        {
          optionName: "2번 샷 추가",
          optionPrice: 1000,
          optionStatus: "ONSALE",
          optionPriority: 2,
        },
      ],
    },
    {
      optionGroupName: "사이드 메뉴",
      isRequired: false,
      minSelect: 0,
      maxSelect: 3,
      priority: 2,
      options: [
        {
          optionName: "커비번",
          optionPrice: 3500,
          optionStatus: "ONSALE",
          optionPriority: 1,
        },
        {
          optionName: "도넛",
          optionPrice: 1000,
          optionStatus: "ONSALE",
          optionPriority: 2,
        },
        {
          optionName: "샌드위치",
          optionPrice: 5000,
          optionStatus: "OUT_OF_STOCK",
          optionPriority: 3,
        },
      ],
    },
  ],
};
