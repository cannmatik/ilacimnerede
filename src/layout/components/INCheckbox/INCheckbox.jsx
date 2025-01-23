import PropTypes from "prop-types";
import "./style.scss";

// 3rd Party
import { Checkbox, Form } from "antd";
import { Controller } from "react-hook-form";
import { useEffect } from "react";

const { Item } = Form;

function INCheckbox({
  name,
  control,
  label,
  setValue,
  className,
  disabled,
  onChange,
  formVerticalSpace,
}) {

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Item style={{ marginBottom: formVerticalSpace }}>
          <Checkbox
            onChange={(event) => {
              field.onChange();
              if (event.target.checked) {
                field.onChange("Y");
              } else {
                field.onChange("N");
              }
              onChange(event);
            }}
            checked={field.value === "Y"}
            className={className}
            disabled={disabled}
          >
            {label}
          </Checkbox>
        </Item>
      )}
    />
  );
}

INCheckbox.propTypes = {
  name: PropTypes.string.isRequired,
  control: PropTypes.shape({
    _formValues: PropTypes.shape({}).isRequired,
  }).isRequired,
  label: PropTypes.string.isRequired,
  setValue: PropTypes.func.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  formVerticalSpace: PropTypes.number,
};

INCheckbox.defaultProps = {
  className: "",
  disabled: false,
  onChange: () => {},
  formVerticalSpace: 0,
};

export default INCheckbox;
