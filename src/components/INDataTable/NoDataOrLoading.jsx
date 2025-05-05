import PropTypes from "prop-types";
import { ilacimNerede } from "@assets";
import { CircularProgress, Typography, Box } from "@mui/material";

function NoDataOrLoading({ isLoading, data }) {
  if (data.length > 0) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "200px",
        textAlign: "center",
        gap: 2,
        p: 3,
      }}
    >
      {isLoading && <CircularProgress />}
      {!isLoading && data.length === 0 && (
        <>
          <img
            src={ilacimNerede}
            alt="no data"
            style={{ maxWidth: "100%", height: "auto", maxHeight: "350px" }}
          />
          <Typography variant="h6" color="text.secondary">
            No Data To Display
          </Typography>
        </>
      )}
    </Box>
  );
}

NoDataOrLoading.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  data: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};

export default NoDataOrLoading;