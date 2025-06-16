// src/hooks/useAddressManager.js
import { useState } from "react";

export const getIconByLabel = (label) => {
  switch (label) {
    case "집":
      return "/icons/location/homeIcon.svg";
    case "회사":
      return "/icons/location/companyIcon.svg";
    case "수정":
      return "/icons/location/pencilIcon.svg";
    case "GPS":
      return "/icons/location/gpsIcon.svg";
    case "검색":
      return "/icons/location/searchIcon.svg";
    default:
      return "/icons/location/mapmarkerIcon.svg";
  }
};

const initialAddresses = [
  {
    id: 1,
    label: "집",
    address: "경기 성남시 판교로 242\nPDC A동 902호",
    wowZone: true,
  },
  {
    id: 2,
    label: "네이버",
    address: "경기도 성남시 분당구 정자일로 95 2004호",
    wowZone: true,
  },
  {
    id: 3,
    label: "쿠팡",
    address: "서울특별시 송파구 송파대로 570 1703호",
    wowZone: true,
  },
];

export default function useAddressManager() {
  const [selectedId, setSelectedId] = useState(1);
  const [addressList, setAddressList] = useState(initialAddresses);

  const selectAddress = (id) => setSelectedId(id);

  const selectedAddress = addressList.find((addr) => addr.id === selectedId);

  return {
    addressList,
    selectedId,
    selectedAddress,
    selectAddress,
  };
}
