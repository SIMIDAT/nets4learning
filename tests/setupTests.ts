// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import { vi } from 'vitest';

// Las páginas perezosas (lazy) importan TF.js y tardan en cargar, más con todos los ficheros de tests en paralelo: el
// segundo que esperan por defecto waitFor y findBy se quedaba justo (TestPage tardaba 1045 ms) y fallaban al azar
configure({ asyncUtilTimeout: 5000 })

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<any>('react-i18next');

  return {
    ...actual,
    useTranslation: () => ({
      t   : (key: string) => key,
      i18n: { changeLanguage: () => Promise.resolve() },
    }),
    Trans: ({ i18nKey }: any) => i18nKey,
  };
});


// tfjs-vis (el panel visual de TensorFlow.js) hace require() de la build ESM de tfjs-core, que Node
// no puede cargar ("Cannot find module .../chained_ops/abs"). Los tests no lo usan: API mínima vacía.
vi.mock('@tensorflow/tfjs-vis', () => {
  const visor = { open: vi.fn(), close: vi.fn(), toggle: vi.fn(), setActiveTab: vi.fn(), isOpen: () => false, surface: () => ({ drawArea: document.createElement('div') }) }
  return {
    visor  : () => visor,
    show   : { modelSummary: vi.fn().mockResolvedValue(undefined), fitCallbacks: vi.fn(() => ({})), perClassAccuracy: vi.fn().mockResolvedValue(undefined) },
    render : { confusionMatrix: vi.fn().mockResolvedValue(undefined) },
    metrics: { perClassAccuracy: vi.fn().mockResolvedValue([]), confusionMatrix: vi.fn().mockResolvedValue([]) },
  }
})

vi.mock('@tensorflow/tfjs-node', () => ({
  // mock mínimo
  loadGraphModel: vi.fn(),
}));

vi.mock('@vladmandic/face-api', () => ({
  nets          : {},
  detectAllFaces: vi.fn().mockResolvedValue([]),
}));