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
