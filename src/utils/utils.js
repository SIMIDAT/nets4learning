export function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

export function isMobile() {
  return navigator?.userAgentData?.mobile || isAndroid() || isiOS();
}

export function isProduction() {
  return process.env.REACT_APP_ENVIRONMENT === "production"
}

export function random_min_max(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function processJson(str) {
  let isJson = true;
  let json = null;
  try {
    json = JSON.parse(str);
  } catch (e) {
    return { isJson: false, json };
  }
  return { isJson, json };
}
