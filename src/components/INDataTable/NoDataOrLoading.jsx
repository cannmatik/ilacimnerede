import PropTypes from "prop-types";

import { ilacimNerede } from "@assets";
import { Spin } from "antd";

function NoDataOrLoading({ isLoading, data }) {
  if (data.length > 0) return null;
  return (
    <div className="no-data-or-loading-container">
      {isLoading && <Spin />}
      {!isLoading && data.length === 0 && (
        <>
          <img src={ilacimNerede} alt="no data" height={350} width={400} />
          <h4>No Data To Display</h4>
        </>
      )}
    </div>
  );
}

NoDataOrLoading.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  data: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};

export default NoDataOrLoading;
