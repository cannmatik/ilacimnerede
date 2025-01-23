import PropTypes from "prop-types";
import "./style.scss";

// 3rd Party
import { Button, Spin } from "antd";
import { gdlConfirm } from "@utils";

function INButton({
  text,
  type,
  shape,
  size,
  onClick,
  htmlType,
  disabled,
  checkRole,
  icon,
  flex,
  isLoading,
  askConfirm,
  heartBeatAnim,
}) {
  const disable = disabled || checkRole;

  const btnIcon = (
    <img src={icon} alt="btn-icon" style={{ width: 24, height: 24 }} />
  );

  const handleOnClick = () => {
    if (askConfirm) {
      return gdlConfirm({
        content:
          typeof askConfirm === "string"
            ? askConfirm
            : "Do you confirm this action?",
        onOk: () => onClick(),
      });
    }
    return onClick();
  };

  return (
    <Button
      type="default"
      shape={shape}
      size={size}
      onClick={handleOnClick}
      htmlType={htmlType}
      disabled={disable}
      className={`${type} ${heartBeatAnim ? "heartBeatAnim" : ""}`}
      icon={icon ? btnIcon : null}
      style={{
        width: flex ? "70%" : "unset",
        pointerEvents: isLoading ? "none" : "auto",
      }}
    >
      {isLoading ? <Spin /> : text}
    </Button>
  );
}

INButton.propTypes = {
  text: PropTypes.string.isRequired,
  type: PropTypes.string,
  shape: PropTypes.string,
  size: PropTypes.string,
  onClick: PropTypes.func,
  htmlType: PropTypes.string,
  disabled: PropTypes.bool,
  checkRole: PropTypes.bool,
  icon: PropTypes.node,
  flex: PropTypes.bool,
  isLoading: PropTypes.bool,
  askConfirm: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  heartBeatAnim: PropTypes.bool,
};

INButton.defaultProps = {
  onClick: () => {},
  shape: "",
  type: "primary-btn",
  size: "default",
  htmlType: "submit",
  disabled: false,
  checkRole: false,
  icon: null,
  flex: false,
  isLoading: false,
  askConfirm: false,
  heartBeatAnim: false,
};

export default INButton;
