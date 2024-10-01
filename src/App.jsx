// import './stylesheet.scss'
import React, { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Switch } from 'react-router-dom'
import { Redirect, Route } from 'react-router'
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

function App() {
  const REACT_APP_PATH = process.env.REACT_APP_PATH

  useEffect(() => {
    ReactGA.initialize(process.env.REACT_APP_GA_MEASUREMENT_ID)
  }, [])

  return (
    <div className="body">
      <BrowserRouter basename={REACT_APP_PATH}>
        <Suspense fallback={''}>
          <N4LNavbar />
        </Suspense>
        <Suspense fallback={<Loading />}>
          <Switch>
            <Route exact path={'/'} component={PageHome}></Route>
            <Route exact path={'/home'} component={PageHome}></Route>
            <Route exact path={'/select-dataset/:id'} component={PageMenuSelectDataset}></Route>
            <Route exact path={'/select-model/:id'} component={PageMenuSelectModel}></Route>
            <Route exact path={'/playground/:id/:option/:example'} component={PagePlayground}></Route>
            <Route exact path={'/playground/description-regression'} component={PageDescriptionRegression}></Route>
            <Route exact path={'/manual/'} component={PageManual}></Route>
            <Route exact path={'/glossary'} component={PageGlossary}></Route>
            <Route exact path={'/datasets'} component={PageDatasets}></Route>
            <Route exact path={'/analyze'} component={PageAnalyzeDataFrame}></Route>
            <Route exact path={'/contribute/'} component={PageContribute}></Route>
            <Route exact path={'/terms-and-conditions'} component={PageTermsAndConditions}></Route>
            <Route exact path={'/version'} component={PageVersion}></Route>
            <Route exact path={'/debug'} component={PageDebug}></Route>

            <Route exact path={'/test-page-easy'} component={TestPageEasy}></Route>
            <Route exact path={'/test-page-advanced/:id/:option/:example'} component={TestPageAdvanced}></Route>
            <Route exact path={'/test-page-easy-lazy'} component={TestPageEasy_lazy}></Route>
            <Route exact path={'/test-page-advanced-lazy/:id/:option/:example'} component={TestPageAdvanced_lazy}></Route>

            <Route path="/404" component={PageNotFoundPage} />
            <Redirect to="/404"></Redirect>
          </Switch>
        </Suspense>
        <Suspense fallback={''}>
          <N4LFooter />
        </Suspense>
      </BrowserRouter>
    </div>
  )
}

export default App
