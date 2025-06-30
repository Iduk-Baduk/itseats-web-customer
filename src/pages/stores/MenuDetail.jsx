import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addMenu,
  replaceCartWithNewStore,
  selectCurrentStore,
} from "../../store/cartSlice";
import { fetchMenuOptionsById } from "../../store/storeSlice";
import { useShare } from "../../hooks/useShare";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import HeaderMenuDetail from "../../components/stores/HeaderMenuDetail";
import { ConfirmModal } from "../../components/common/Modal";
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

  // Redux에서 메뉴 정보 가져오기
  const store = useSelector(state => state.store?.currentStore);
  const currentMenu = useSelector((state) => state.store.currentMenuOptions);
  const storeLoading = useSelector((state) => state.store.loading);

  const [isTransparent, setTransparent] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [showStoreChangeModal, setShowStoreChangeModal] = useState(false);
  const [pendingMenuData, setPendingMenuData] = useState(null);

  // 초기화 및 설정
  useEffect(() => {
    // 매장 정보 로딩
    if (storeId) {
      dispatch(fetchMenuOptionsById({ storeId, menuId }));
    }
  }, [dispatch, storeId]);

  // 메뉴 옵션 초기화 - 별도 useEffect로 분리
  useEffect(() => {
    if (currentMenu?.optionGroups && Array.isArray(currentMenu.optionGroups)) {
      setSelectedOptions(
        currentMenu.optionGroups.map((group) => ({
          ...group,
          options: [],
        }))
      );
    } else {
      setSelectedOptions([]);
    }
  }, [currentMenu]);

  // 가격 계산
  useEffect(() => {
    if (!currentMenu) return;

    const basePrice = parseInt(currentMenu.price || currentMenu.menuPrice || 0);
    const optionsPrice = selectedOptions.reduce(
      (total, group) =>
        total +
        group.options.reduce((sum, option) => sum + option.optionPrice, 0),
      0
    );
    setTotalPrice((basePrice + optionsPrice) * quantity);
  }, [quantity, selectedOptions, currentMenu]);

  // 스크롤 이벤트 처리
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
    if (!currentMenu || !store) return null;
    
    // API 스펙에 맞는 menuOptions 구조로 변환
    const menuOptions = selectedOptions.map((group, index) => ({
      optionGroupName: currentMenu.options?.[index]?.name || group.optionGroupName,
      options: group.options.map(option => ({
        optionName: option.optionName,
        optionPrice: option.optionPrice
      }))
    })).filter(group => group.options.length > 0);

    return {
      menuId: currentMenu.id || currentMenu.menuId,
      menuName: currentMenu.name || currentMenu.menuName,
      menuPrice: currentMenu.price || currentMenu.menuPrice,
      menuOptions: menuOptions,
      menuOption: selectedOptions,
      quantity,
      storeId: String(storeId),
      storeName: store.name,
      storeImage: store.imageUrl
    };
  }

  function addToCart() {
    const menuData = createMenuData();
    if (!menuData) {
      alert("메뉴 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    // 현재 장바구니에 다른 가게의 메뉴가 있는지 확인
    const isDifferentStore = currentStore && String(currentStore.storeId) !== String(menuData.storeId);
    if (isDifferentStore) {
      // 다른 가게 메뉴가 있으면 확인 모달 표시
      setPendingMenuData(menuData);
      setShowStoreChangeModal(true);
      return;
    }
    // 같은 가게이거나 장바구니가 비어있으면 바로 추가
    dispatch(addMenu(menuData));
    alert("장바구니에 담겼습니다!");
    navigate(-1);  // 이전 페이지(가게 상세)로 돌아가기
  }

  function handleReplaceCart() {
    if (pendingMenuData) {
      dispatch(replaceCartWithNewStore(pendingMenuData));
      alert("장바구니에 담겼습니다!");
      navigate(-1); // 이전 페이지(가게 상세)로 돌아가기
    }
    setShowStoreChangeModal(false);
    setPendingMenuData(null);
  }

  function handleKeepCurrentCart() {
    setShowStoreChangeModal(false);
    setPendingMenuData(null);
  }

  console.log("🏪 현재 메뉴 정보:", currentMenu);

  return (
    <SlideInFromRight>
      <div className={styles.container}>
        <HeaderMenuDetail
          isTransparent={isTransparent}
          title={currentMenu?.name || currentMenu?.menuName || "메뉴"}
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
          <img
            src={
              currentMenu?.imageUrl ||
              currentMenu?.image ||
              "/samples/food1.jpg"
            }
            alt={currentMenu?.name || currentMenu?.menuName || "메뉴"}
          />
        </div>

        <div className={styles.introContent}>
          <h1>{currentMenu?.name || currentMenu?.menuName || "메뉴"}</h1>
        </div>

        <div className={styles.description}>
          <p>
            {currentMenu?.description ||
              currentMenu?.menuDescription ||
              "메뉴 설명이 없습니다."}
          </p>
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

        {currentMenu?.optionGroups?.map((group, index) => {
          const inputType =
            group.minSelect === 1 && group.maxSelect === 1
              ? "radio"
              : "checkbox";

          return (
            <div key={index} className={styles.optionGroup}>
              <div className={styles.optionGroupTitleContainer}>
                <h2 className={styles.optionGroupTitle}>
                  {group.name || group.optionGroupName}
                </h2>
                <span className={styles.optionGroupInfo}>
                  {group.required
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
                {group.options?.map((option, idx) => {
                  return (
                    <div key={idx} className={styles.option}>
                      <OptionInput
                        type={inputType}
                        checked={Boolean(
                          selectedOptions[index]?.options?.some(
                            (opt) => opt.optionName === option.optionName
                          )
                        )}
                        onChange={() => {
                          setSelectedOptions((prev) =>
                            prev.map((g, i) => {
                              if (i !== index) return g;

                              const newOptions = [...(g.options || [])];
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
                        disabled={false}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {!currentMenu || storeLoading ? (
          <BottomButton disabled={true}>
            <p>메뉴 정보를 불러오는 중...</p>
          </BottomButton>
        ) : (
          <BottomButton
            onClick={addToCart}
            disabled={isRequiredOptionsNotSelected()}
            cartInfo={{
              itemCount: quantity,
              orderPrice:
                (currentMenu.price || currentMenu.menuPrice) * quantity,
              totalPrice: totalPrice,
            }}
          >
            <span>{totalPrice.toLocaleString()}원 담기</span>
          </BottomButton>
        )}

        <ConfirmModal
          isOpen={showStoreChangeModal}
          onClose={handleKeepCurrentCart}
          onConfirm={handleReplaceCart}
          message={
            currentStore
              ? `현재 장바구니에는 "${currentStore.storeName}"의 메뉴가 담겨있습니다.\n"${store?.name}"의 메뉴를 추가하려면 기존 장바구니를 비워야 합니다.\n\n기존 장바구니를 비우고 새 메뉴를 담으시겠습니까?`
              : `장바구니를 새로 시작하시겠습니까?`
          }
          confirmText="네, 새로 담기"
          cancelText="취소"
        />
      </div>
    </SlideInFromRight>
  );
}

// 더미 데이터 제거됨 - 실제 API 데이터를 사용합니다.
