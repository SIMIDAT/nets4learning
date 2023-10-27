export function isiOS () {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function isAndroid () {
  return /Android/i.test(navigator.userAgent)
}

export function isMobile () {
  return /Mobi|Tablet/.test(navigator.userAgent) || isAndroid() || isiOS()
}

export function isProduction () {
  return process.env.REACT_APP_ENVIRONMENT === 'production'
}

export const delay = ms => new Promise(res => setTimeout(res, ms))

export function modificarPropiedad (objeto, clave, nuevoValor) {
  const keys = clave.split('.')
  const ultimaClave = keys.pop()

  for (const key of keys) {
    objeto = objeto[key]
  }

  objeto[ultimaClave] = nuevoValor

  return objeto
}

export function getRandomInt (max) {
  return Math.floor(Math.random() * max)
}

export function generateColor () {
  const r = getRandomInt(255)
  const g = getRandomInt(255)
  const b = getRandomInt(255)
  return {
    borderColor         : `rgba(${r}, ${g}, ${b})`,
    backgroundColor     : `rgba(${Math.ceil(r * 0.95)}, ${Math.ceil(g * 0.95)}, ${Math.ceil(b * 0.95)})`,
    pointBorderColor    : `rgba(${r}, ${g}, ${b})`,
    pointBackgroundColor: `rgba(0, 0, 0, 0)`,
  }
}