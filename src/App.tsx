import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navigate } from 'react-router'
import ReactGA from 'react-ga4'

import Loading from './pages/Loading'
import N4LNavbar from './components/header/N4LNavbar'
import N4LFooter from './components/footer/N4LFooter'
// __TESTS__
import TestPageEasy from '@pages/TestPageEasy'
import TestPageAdvanced from '@pages/TestPageAdvanced'

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
const PageDebug = lazy(() => import( './pages/debug/Debug'))
const PageNotFoundPage = lazy(() => import( './pages/notFound/NotFoundPage'))
const PageVersion = lazy(() => import( './pages/version/Version'))
// __TESTS__
const TestPageEasy_lazy = lazy(() => import( '@pages/TestPageEasy'))
const TestPageAdvanced_lazy = lazy(() => import( '@pages/TestPageAdvanced'))

const VITE_PATH = import.meta.env.VITE_PATH
const VITE_GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

function App() {
  
  useEffect(() => {
    console.log('VITE_PATH:', VITE_PATH)
    ReactGA.initialize(VITE_GA_MEASUREMENT_ID)
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
            <Route path={'/debug'} element={<PageDebug />}></Route>

            <Route path={'/test-page-easy'} element={<TestPageEasy />}></Route>
            <Route path={'/test-page-advanced/:id/:option/:example'} element={<TestPageAdvanced />}></Route>
            <Route path={'/test-page-easy-lazy'} element={<TestPageEasy_lazy />}></Route>
            <Route path={'/test-page-advanced-lazy/:id/:option/:example'} element={<TestPageAdvanced_lazy />}></Route>

            <Route path="/404" element={<PageNotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
        <Suspense fallback={''}>
          <N4LFooter />
        </Suspense>
      </BrowserRouter>
    </div>
  )
}

export default App
