import { Modal } from "antd";
import "./style.scss";

const { confirm } = Modal;

const INConfirm = ({
  content,
  onOk,
  onCancel,
  okText,
  cancelText = "Cancel",
  title = "Warning",
}) => {
  confirm({
    content: (
      <div className="confirm-custom">
        <div className="header">
          <span>{title}</span>
          <button
            type="button"
            className="close"
            onClick={() => {
              Modal.destroyAll();
            }}
          >
            x
          </button>
        </div>
        <div className="actual-content">{content}</div>
      </div>
    ),
    onOk,
    onCancel,
    maskClosable: false,
    centered: true,
    okText,
    cancelText,
    okButtonProps: {
      className: "primary-btn",
    },
    cancelButtonProps: {
      className: "lined-btn",
    },
  });
};

export default INConfirm;
