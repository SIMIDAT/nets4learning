import { AxeBuilder } from '@axe-core/playwright'
import type { Page } from '@playwright/test'

/**
 * Lo que se exige (docs/accessibility.md): WCAG 2.2 A y AA (con las reglas de 2.0 y 2.1) y las buenas prácticas de axe,
 * que piden además, p. ej., que los encabezados vayan en orden y que todo esté dentro de una región
 */
export const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

/**
 * Los problemas de accesibilidad de lo que se ve en la página, uno por regla con sus primeros elementos (para que el
 * mensaje del test diga dónde están). El visor de tfjs-vis no cuenta: es de la librería y está entre las excepciones
 */
export async function axeViolations(page: Page): Promise<string[]> {
  // Desde arriba: con la página bajada, la barra de navegación (fija) tapa lo que pasa por debajo y axe lo cuenta como
  // un objetivo demasiado pequeño, aunque quien usa la página lo ve entero en cuanto llega a él
  await page.evaluate(() => window.scrollTo(0, 0))
  const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS)
    // Experimental en axe, así que no se ejecuta sola: el nombre accesible de cada control contiene el texto que se ve
    // (WCAG 2.5.3), para quien lo maneja diciendo lo que ve (control por voz)
    .options({ rules: { 'label-content-name-mismatch': { enabled: true } } })
    .exclude('#tfjs-visor-container')
    .analyze()
  return violations.map(({ id, impact, nodes }) => `${id} [${impact}]: ${nodes.slice(0, 3).map(({ target }) => target.join(' ')).join(' | ')}`)
}

/** Despliega todas las tablas «Ver los datos» de las gráficas que se ven, para revisarlas también */
export async function expandChartData(page: Page) {
  const toggles = page.locator('[data-testid="Test-ChartData-Toggle"][aria-expanded="false"]:visible')
  const count = await toggles.count()
  for (let index = 0; index < count; index++) await toggles.first().click()
}
