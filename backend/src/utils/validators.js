const validateEmail = (email) => {
  const re = /^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8;
};

const validatePhone = (phone) => {
  const re = /^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,10}$/;
  return re.test(phone);
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone
};
