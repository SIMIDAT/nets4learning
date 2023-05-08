import React, { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Switch } from "react-router-dom";
import { Redirect, Route } from "react-router";
import ReactGA from 'react-ga4';
import './i18n';
import "./App.css";
import Loading from "./pages/Loading";
import N4LNavbar from "./components/header/N4LNavbar";
import N4LFooter from "./components/footer/N4LFooter";

const Home = lazy(() => import( "./pages/_home/Home.jsx"));
const MenuSelectModel = lazy(() => import( "./pages/menu/MenuSelectModel"));
const MenuSelectDataset = lazy(() => import( "./pages/menu/MenuSelectDataset"));
const Playground = lazy(() => import( "./pages/playground/Playground"));
const Manual = lazy(() => import( "./pages/manual/Manual"));
const Glossary = lazy(() => import( "./pages/glossary/Glossary"));
const Datasets = lazy(() => import( "./pages/datasets/Datasets"));
const TermsAndConditions = lazy(() => import( "./pages/terms/TermsAndConditions"));
const NotFoundPage = lazy(() => import( "./pages/notFound/NotFoundPage"));

function App() {
  const REACT_APP_PATH = process.env.REACT_APP_PATH

  useEffect(() => {
    ReactGA.initialize(process.env.REACT_APP_GA_MEASUREMENT_ID)
  }, [])

  return (
    <div className="body">
      <BrowserRouter basename={REACT_APP_PATH}>
        <N4LNavbar />
        <Suspense fallback={<Loading />}>
          <Switch>
            <Route exact path={"/"} component={Home}></Route>
            <Route exact path={"/select-dataset/:id"} component={MenuSelectDataset}></Route>
            <Route exact path={"/select-model/:id"} component={MenuSelectModel}></Route>
            <Route exact path={"/playground/:id/:option/:example"} component={Playground}></Route>
            <Route exact path={"/manual/"} component={Manual}></Route>
            <Route exact path={"/glossary/"} component={Glossary}></Route>
            <Route exact path={"/datasets/"} component={Datasets}></Route>
            <Route exact path={"/terms-and-conditions/"} component={TermsAndConditions}></Route>
            <Route path="/404" component={NotFoundPage} />
            <Redirect to="/404"></Redirect>
          </Switch>
        </Suspense>
        <N4LFooter />
      </BrowserRouter>
    </div>
  );
}

export default App;
