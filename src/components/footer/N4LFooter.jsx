import React from "react"
import "./N4LFooter.css"
import { Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function N4LFooter() {
  const { t } = useTranslation();

  return (
    <>
      <footer className="footer mt-auto py-3 bg-light">
        <Container>
          <Row>
            <div className="col-xs-12 col-sm-12 col-md-4 item text">
              <h4>Nets4Learning</h4>
              <p>
                {t("footer.description-app")}
              </p>
            </div>
            <div className="col-xs-12 col-sm-12 col-md-8 item">
              <h3>{t("footer.about-us")}</h3>
              <ul style={{ padding: "0 1em" }}>
                <li>{t("footer.author")}: <a href="https://github.com/Davavico22" target="_blank" rel="noreferrer" className="link-secondary">David Valdivia Vico</a></li>
                <li>{t("footer.directors")}:{" "}
                  <a href="https://simidat.ujaen.es/members/arivera/" target="_blank" rel="noreferrer" className="link-secondary">Antonio Jesús Rivera Rivas</a>,
                  <a href="https://simidat.ujaen.es/members/lperez/" target="_blank" rel="noreferrer" className="link-secondary">María Dolores Pérez Godoy</a>
                </li>
                <li>{t("footer.maintainers")}: Alejandro Cruz Fernandez de Moya, Antonio Mudarra Machuca</li>
                <li><a href="https://dasci.es/" target="_blank" rel="noreferrer" className="link-secondary">Instituto Andaluz Interuniversitario en Data Science and Computational Intelligence</a></li>
                <li><a href="https://ujaen.es" target="_blank" rel="noreferrer" className="link-secondary">Universidad de Jaén</a></li>
                <li><a href="https://simidat.ujaen.es/" target="_blank" rel="noreferrer" className="link-secondary">Grupo de investigación del SIMIDAT</a></li>
                <li><Link to={"/terms-and-conditions/"} className="link-secondary">Términos y condiciones</Link></li>
              </ul>
            </div>
          </Row>
        </Container>
      </footer>
    </>
  )
}