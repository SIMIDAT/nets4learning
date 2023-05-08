import "./Editor.css"
import React, { useState, useEffect } from "react"
import { useParams } from "react-router"
import { Container, Row, Col, Card } from "react-bootstrap"
import useLocalStorage from "../../hooks/useLocalStorage"

export default function Editor(props) {
  const { tipo } = props

  const { id } = useParams()

  const [html, setHtml] = useLocalStorage("html", ``)
  const [css, setCss] = useLocalStorage("css", "")
  const [js, setJs] = useLocalStorage("js", ``)


  useEffect(() => {

  }, [html, css, js])


  const handleSubmit_Play = () => {
  };

  return (
    <>
      <Container id={"Editor"}>

      </Container>
    </>
  );
}
