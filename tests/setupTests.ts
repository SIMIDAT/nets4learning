// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { vi } from 'vitest';

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


vi.mock('@tensorflow/tfjs-node', () => ({
  // mock mínimo
  loadGraphModel: vi.fn(),
}));

vi.mock('@vladmandic/face-api', () => ({
  nets          : {},
  detectAllFaces: vi.fn().mockResolvedValue([]),
}));