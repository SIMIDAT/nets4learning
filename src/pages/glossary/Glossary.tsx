import "./Glossary.css"
import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router"
import { Col, Form, Row } from "react-bootstrap"
import { Trans, useTranslation } from "react-i18next"

import { VERBOSE } from "@/CONSTANTS"
import { trackEvent } from "@core/analytics"
import N4LDivider from "@components/divider/N4LDivider"
import N4LSectionLayout from "@components/divider/N4LSectionLayout"
import Glossary5Layers from "./Glossary5Layers"
import GlossaryTerm from "./GlossaryTerm"
import { GLOSSARY_SECTIONS, matchesSearch, termSearchText, type GlossarySection_t } from "./glossaryTerms"
import { glossaryTarget } from "./glossaryTarget"

// Una búsqueda se registra cuando se deja de escribir durante este tiempo y tiene al menos estas letras
const SEARCH_TRACK_MS = 1500
const SEARCH_MIN_LENGTH = 3

/**
 * Glosario: un apartado por tema (tareas, editores, optimizadores, activaciones, pérdidas y métricas) con su índice al
 * lado (en el móvil, arriba) y un buscador que filtra los términos. Cada término tiene su enlace (#glossary-<id>).
 */
export default function Glossary() {
  const { t } = useTranslation()
  const location = useLocation()
  // Los enlaces de ayuda del playground llevan el apartado en la URL (?action=…): se lleva la vista hasta él
  const target = glossaryTarget(new URLSearchParams(location.search).get("action"))
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const isSearching = deferredQuery.trim() !== ""

  // Texto de cada término en el idioma actual (t cambia con el idioma), para buscar sin volver a traducir en cada tecla
  const searchTexts = useMemo(() => {
    const texts = new Map<string, string>()
    for (const section of GLOSSARY_SECTIONS) {
      for (const group of section.groups) {
        for (const term of group.terms) texts.set(term.id, termSearchText(term, t))
      }
    }
    return texts
  }, [t])

  // Sin búsqueda, todo; con búsqueda, solo los términos que la cumplen (y los apartados que tienen alguno)
  const sections = useMemo((): GlossarySection_t[] => {
    if (!isSearching) return GLOSSARY_SECTIONS
    return GLOSSARY_SECTIONS
      .map((section) => ({
        ...section,
        groups: section.groups.map((group) => ({ ...group, terms: group.terms.filter((term) => matchesSearch(searchTexts.get(term.id) ?? "", deferredQuery)) })),
      }))
      .filter((section) => section.groups.some((group) => group.terms.length > 0))
  }, [isSearching, deferredQuery, searchTexts])
  const matches = sections.reduce((total, section) => total + section.groups.reduce((sum, group) => sum + group.terms.length, 0), 0)
  const steps = sections.map(({ step }) => step)

  // Analíticas: qué se busca (y si se encuentra), cuando se deja de escribir
  const searchTerm = deferredQuery.trim().toLowerCase()
  useEffect(() => {
    if (searchTerm.length < SEARCH_MIN_LENGTH) return
    const timer = window.setTimeout(() => trackEvent("search", { search_term: searchTerm, results: matches }), SEARCH_TRACK_MS)
    return () => window.clearTimeout(timer)
  }, [searchTerm, matches])

  // Al llegar con #glossary-… o desde una ayuda del playground, la vista va al término o grupo
  useEffect(() => {
    const id = location.hash !== "" ? decodeURIComponent(location.hash.slice(1)) : target !== null ? "glossary-" + target : null
    if (id !== null) document.getElementById(id)?.scrollIntoView({ block: "start" })
  }, [location.hash, target])

  if (VERBOSE) console.debug("render Glossary")
  return (
    <main className={"mb-3"} data-title={"Glossary"} data-testid={"Test-Glossary"}>
      <N4LSectionLayout steps={steps} wide={true}>
        <h1 className={"mt-3"}><Trans i18nKey={"pages.glossary.title"} /></h1>
        <p className={"lead"}>{t("pages.glossary.intro")}</p>

        <Form.Group controlId={"glossary-search"} className={"n4l-glossary-search"} role={"search"}>
          <Form.Label className={"visually-hidden"}>{t("pages.glossary.search")}</Form.Label>
          <Form.Control type={"search"}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("pages.glossary.search-placeholder")}
            autoComplete={"off"} />
        </Form.Group>
        <p className={"small text-body-secondary mt-2 mb-0"} aria-live={"polite"} data-testid={"Test-GlossaryResults"}>
          {isSearching && (matches > 0
            ? t("pages.glossary.results", { count: matches })
            : t("pages.glossary.no-results", { query: deferredQuery.trim() }))}
        </p>

        {sections.map((section) => (
          <section key={section.step} aria-label={t(section.step)}>
            <N4LDivider i18nKey={section.step} steps={steps} />
            {!isSearching && section.introKeys.map((key) => <p key={key}><Trans i18nKey={key} /></p>)}

            {section.groups.filter((group) => group.terms.length > 0).map((group, index) => (
              <div key={group.id ?? index} id={group.id === undefined ? undefined : "glossary-" + group.id} className={"n4l-glossary-group"}>
                {group.titleKey !== undefined && <h2 className={"h5 n4l-glossary-group-title"}>{t(group.titleKey)}</h2>}
                <Row xs={1} lg={2} className={"g-3"}>
                  {group.terms.map((term) => (
                    <Col key={term.id}>
                      <GlossaryTerm term={term} headingLevel={group.titleKey === undefined ? 3 : 4} />
                    </Col>
                  ))}
                </Row>
              </div>
            ))}

            {!isSearching && section.references !== undefined &&
              <div className={"small mt-3"}>
                <span className={"text-body-secondary"}>{t("pages.glossary.references-title")}:</span>{" "}
                {section.references.map((reference, index) => (
                  <span key={reference.href}>
                    {index > 0 && " · "}
                    <a href={reference.href} target={"_blank"} rel={"noreferrer"} className={"link-secondary"}>{reference.label}</a>
                  </span>
                ))}
              </div>}
          </section>
        ))}

        {/* Tipos de capas de TF.js: solo en desarrollo */}
        {!isSearching && <Glossary5Layers />}
      </N4LSectionLayout>
    </main>
  )
}
