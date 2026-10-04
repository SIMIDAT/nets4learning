export function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function isAndroid() {
  return /Android/i.test(navigator.userAgent)
}

export function isMobile() {
  return /Mobi|Tablet/.test(navigator.userAgent) || isAndroid() || isiOS()
}

export function isWebView() {
  // `standalone` solo existe en Safari de iOS (no es estándar)
  const standalone = (window.navigator as Navigator & { standalone?: boolean }).standalone
  const userAgent = window.navigator.userAgent.toLowerCase()
  const safari = /safari/.test(userAgent)
  const ios = /iphone|ipod|ipad/.test(userAgent)

  if (ios) {
    if (!standalone && !safari) {
      // iOS webview
      return true
    } else if (!standalone && safari) {
      // Safari
      return false
    }
  } else {
    if (userAgent.includes('wv')) {
      // Android webview
        return true
    } else {
      // Chrome
      return false
    }
  }
}

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max)
}

export function generateColor() {
  const r = getRandomInt(255)
  const g = getRandomInt(255)
  const b = getRandomInt(255)
  return {
    borderColor         : `rgba(${r}, ${g}, ${b})`,
    backgroundColor     : `rgba(${Math.ceil(r * 0.95)}, ${Math.ceil(g * 0.95)}, ${Math.ceil(b * 0.95)})`,
    pointBorderColor    : `rgba(${r}, ${g}, ${b})`,
    pointBackgroundColor: 'rgba(0, 0, 0, 0)',
  }
}
