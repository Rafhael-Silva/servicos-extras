import { forwardRef } from 'react';

const MaskedCnpjInput = forwardRef((props, ref) => {
  const { onChange, onBlur, name } = props;

  const handleChange = (event) => {
    const rawValue = event.target.value;

    let maskedValue = rawValue
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);

    event.target.value = maskedValue;

    onChange(event);
  };

  return (
    <input
      type="text"
      id="cnpj"
      placeholder="00.000.000/0000-00"
      name={name}
      onChange={handleChange}
      onBlur={onBlur}
      ref={ref}
    />
  );
});

export default MaskedCnpjInput;
