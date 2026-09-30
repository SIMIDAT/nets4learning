import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'

import Loading from './pages/Loading'
import N4LNavbar from './components/header/N4LNavbar'
import N4LFooter from './components/footer/N4LFooter'
import N4LCookiesBanner from './components/cookiesBanner/N4LCookiesBanner'
import { readConsent, startAnalytics } from '@core/analytics'

import './ConfigChartJS'

const PageHome = lazy(() => import( './pages/_home/Home'))
const PageMenuSelectModel = lazy(() => import( './pages/menu/MenuSelectModel'))
const PageMenuSelectDataset = lazy(() => import( './pages/menu/MenuSelectDataset'))
const PagePlayground = lazy(() => import( './pages/playground/Playground'))
const PageDescriptionRegression = lazy(() => import( './pages/playground/1_Regression/description/DescriptionRegression'))
const PageManual = lazy(() => import( './pages/manual/Manual'))
const PageGlossary = lazy(() => import( './pages/glossary/Glossary'))
const PageDatasets = lazy(() => import( './pages/datasets/Datasets'))
const PageAnalyzeDataFrame = lazy(() => import( './pages/analyze/AnalyzeDataFrame'))
const PageContribute = lazy(() => import( './pages/contribute/Contribute'))
const PageTermsAndConditions = lazy(() => import( './pages/terms/TermsAndConditions'))
const PageNotFoundPage = lazy(() => import( './pages/notFound/NotFoundPage'))
const PageVersion = lazy(() => import( './pages/version/Version'))
// Páginas de pruebas para desarrollo: no se publican en producción.
// /*#__PURE__*/ permite a Rollup descartar sus chunks cuando no se usan.
const SHOW_DEV_PAGES = import.meta.env.VITE_ENVIRONMENT !== 'production'
const PageDebug = /*#__PURE__*/ lazy(() => import( './pages/debug/Debug'))
const TestPageEasy_lazy = /*#__PURE__*/ lazy(() => import( '@pages/TestPageEasy'))
const TestPageAdvanced_lazy = /*#__PURE__*/ lazy(() => import( '@pages/TestPageAdvanced'))

const VITE_PATH = import.meta.env.VITE_PATH

function App() {
  
  // Google Analytics solo se carga si el usuario lo ha aceptado (N4LCookiesBanner)
  useEffect(() => {
    if (readConsent() === 'accepted') startAnalytics()
  }, [])

  return (
    <div className="body">
      <BrowserRouter basename={VITE_PATH}>
        <Suspense fallback={''}>
          <N4LNavbar />
        </Suspense>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route index path={'/'} element={<PageHome />}></Route>
            <Route path={'/home'} element={<PageHome />}></Route>
            <Route path={'/select-dataset/:id'} element={<PageMenuSelectDataset />}></Route>
            <Route path={'/select-model/:id'} element={<PageMenuSelectModel />}></Route>
            <Route path={'/playground/:id/:option/:example'} element={<PagePlayground />}></Route>
            <Route path={'/playground/description-regression'} element={<PageDescriptionRegression />}></Route>
            <Route path={'/manual/'} element={<PageManual />}></Route>
            <Route path={'/glossary'} element={<PageGlossary />}></Route>
            <Route path={'/datasets'} element={<PageDatasets />}></Route>
            <Route path={'/analyze'} element={<PageAnalyzeDataFrame />}></Route>
            <Route path={'/contribute/'} element={<PageContribute />}></Route>
            <Route path={'/terms-and-conditions'} element={<PageTermsAndConditions />}></Route>
            <Route path={'/version'} element={<PageVersion />}></Route>

            {SHOW_DEV_PAGES && <>
              <Route path={'/debug'} element={<PageDebug />}></Route>
              <Route path={'/test-page-easy-lazy'} element={<TestPageEasy_lazy />}></Route>
              <Route path={'/test-page-advanced-lazy/:id/:option/:example'} element={<TestPageAdvanced_lazy />}></Route>
            </>}

            <Route path="/404" element={<PageNotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
        <Suspense fallback={''}>
          <N4LFooter />
          <N4LCookiesBanner />
        </Suspense>
      </BrowserRouter>
    </div>
  )
}

export default App
