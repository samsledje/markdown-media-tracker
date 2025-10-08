let toastFn = null;

export const registerToast = (fn) => {
  toastFn = fn;
};

export const toast = (message, opts = {}) => {
  if (toastFn) {
    toastFn(message, opts);
  } else {
    // fallback to console
    console.log('TOAST:', message, opts);
  }
};

export default toast;
