// selectors.js
export const selectUserCityId = (state) => state.user.pharmacyCityId;
export const selectUserNeighbourhoodId = (state) =>
  state.user.pharmacyNeighbourhoodId;
export const selectUserDistrictId = (state) => state.user.pharmacyDistrictId;
export const selectUserPharmacyId = (state) => state.user.pharmacyId;
