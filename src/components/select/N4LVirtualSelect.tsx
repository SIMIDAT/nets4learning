import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { filterVirtualSelectOptions, type VirtualSelectOption_t } from './filterVirtualSelectOptions'

export type { VirtualSelectOption_t }

type N4LVirtualSelectProps = {
  options          : VirtualSelectOption_t[]
  /** Valor elegido (null si todavía no se ha elegido nada) */
  value            : number | null
  onChange         : (value: number) => void
  /** Texto del botón mientras no hay nada elegido; también es el nombre accesible de la lista */
  placeholder      : string
  searchPlaceholder: string
  noResultsText    : string
  /** Texto con cuántas opciones coinciden con la búsqueda ("12 de 1728") */
  countText?       : (shown: number, total: number) => string
  /** Filas visibles a la vez: solo se pintan esas (y unas pocas más), aunque haya miles */
  visibleRows?     : number
  rowHeight?       : number
  size?            : 'sm'
  disabled?        : boolean
  id?              : string
  className?       : string
}

// Filas que se pintan de más por encima y por debajo de las visibles, para que no se vea el hueco al hacer scroll
const OVERSCAN = 6

/**
 * Desplegable para elegir entre miles de opciones: con buscador y "scroll virtual" (solo existen en la página las
 * filas que se ven). Se maneja con el teclado como un combobox: flechas, AvPág/RePág, Ctrl+Inicio/Fin, Intro y Esc.
 */
export default function N4LVirtualSelect(props: N4LVirtualSelectProps) {
  const {
    options,
    value,
    onChange,
    placeholder,
    searchPlaceholder,
    noResultsText,
    countText,
    visibleRows = 8,
    rowHeight = 32,
    size,
    disabled = false,
    id,
    className = '',
  } = props
  const baseId = useId()
  const listId = `${baseId}-list`
  const optionId = (index: number) => `${baseId}-option-${index}`

  const root_ref = useRef<HTMLDivElement>(null)
  const trigger_ref = useRef<HTMLButtonElement>(null)
  const search_ref = useRef<HTMLInputElement>(null)
  const list_ref = useRef<HTMLDivElement>(null)
  // Posición a la que se lleva la lista al abrirla (la opción elegida, centrada)
  const pendingScroll_ref = useRef<number | null>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)

  const filtered = useMemo(() => filterVirtualSelectOptions(options, query), [options, query])
  const selected = useMemo(() => options.find((option) => option.value === value), [options, value])

  const listHeight = Math.max(1, Math.min(filtered.length, visibleRows)) * rowHeight
  const first = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN)
  const last = Math.min(filtered.length, Math.ceil((scrollTop + listHeight) / rowHeight) + OVERSCAN)

  const scrollListTo = (top: number) => {
    if (list_ref.current) list_ref.current.scrollTop = top
    setScrollTop(top)
  }

  /** Mueve la lista lo justo para que se vea la opción */
  const scrollIntoView = (index: number) => {
    const top = index * rowHeight
    if (top < scrollTop) scrollListTo(top)
    else if (top + rowHeight > scrollTop + listHeight) scrollListTo(top + rowHeight - listHeight)
  }

  const open = () => {
    const index = Math.max(0, options.findIndex((option) => option.value === value))
    const height = Math.max(1, Math.min(options.length, visibleRows)) * rowHeight
    const top = Math.max(0, index * rowHeight - (height - rowHeight) / 2)
    setQuery('')
    setActiveIndex(index)
    setScrollTop(top)
    pendingScroll_ref.current = top
    setIsOpen(true)
  }

  const close = (focusTrigger: boolean) => {
    setIsOpen(false)
    if (focusTrigger) trigger_ref.current?.focus()
  }

  const select = (option: VirtualSelectOption_t) => {
    onChange(option.value)
    close(true)
  }

  // Al abrir: el foco al buscador y la lista en la opción elegida
  useEffect(() => {
    if (!isOpen) return
    search_ref.current?.focus()
    if (list_ref.current !== null && pendingScroll_ref.current !== null) {
      list_ref.current.scrollTop = pendingScroll_ref.current
      pendingScroll_ref.current = null
    }
  }, [isOpen])

  // Un clic fuera lo cierra
  useEffect(() => {
    if (!isOpen) return
    const handleMouseDown = (event: MouseEvent) => {
      if (!root_ref.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isOpen])

  const handleKeyDown_Trigger = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      open()
    }
  }

  const handleKeyDown_Search = (event: KeyboardEvent<HTMLInputElement>) => {
    const moveTo = (index: number) => {
      event.preventDefault()
      if (filtered.length === 0) return
      const next = Math.min(filtered.length - 1, Math.max(0, index))
      setActiveIndex(next)
      scrollIntoView(next)
    }
    switch (event.key) {
      case 'ArrowDown': return moveTo(activeIndex + 1)
      case 'ArrowUp': return moveTo(activeIndex - 1)
      case 'PageDown': return moveTo(activeIndex + visibleRows)
      case 'PageUp': return moveTo(activeIndex - visibleRows)
      case 'Home': if (event.ctrlKey) moveTo(0); return
      case 'End': if (event.ctrlKey) moveTo(filtered.length - 1); return
      case 'Enter':
        event.preventDefault()
        if (filtered[activeIndex] !== undefined) select(filtered[activeIndex])
        return
      case 'Escape':
        event.preventDefault()
        close(true)
        return
      case 'Tab':
        close(false)
        return
    }
  }

  const handleChange_Search = (text: string) => {
    setQuery(text)
    setActiveIndex(0)
    scrollListTo(0)
  }

  return (
    <div ref={root_ref} className={`position-relative ${className}`}>
      <button ref={trigger_ref}
        id={id}
        type={'button'}
        className={`form-select ${size === 'sm' ? 'form-select-sm' : ''} text-start text-truncate`}
        disabled={disabled}
        aria-haspopup={'listbox'}
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        onClick={() => (isOpen ? close(false) : open())}
        onKeyDown={handleKeyDown_Trigger}>
        {selected ? selected.label : <span className={'text-body-secondary'}>{placeholder}</span>}
      </button>

      {isOpen &&
        <div className={'dropdown-menu show p-2 shadow'} style={{ top: '100%', right: 0, marginTop: 2, width: 'max(100%, 18rem)', maxWidth: '90vw' }}>
          <input ref={search_ref}
            type={'search'}
            className={'form-control form-control-sm mb-1'}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            role={'combobox'}
            aria-expanded={true}
            aria-controls={listId}
            aria-autocomplete={'list'}
            aria-activedescendant={filtered.length > 0 ? optionId(activeIndex) : undefined}
            value={query}
            onChange={(event) => handleChange_Search(event.target.value)}
            onKeyDown={handleKeyDown_Search} />
          {countText &&
            <div className={'small text-body-secondary px-1 mb-1'} aria-live={'polite'}>{countText(filtered.length, options.length)}</div>}
          <div ref={list_ref}
            id={listId}
            role={'listbox'}
            aria-label={placeholder}
            className={'overflow-auto'}
            style={{ height: listHeight }}
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
            {filtered.length === 0 && <div className={'dropdown-item-text text-body-secondary small'}>{noResultsText}</div>}
            {filtered.length > 0 &&
              <div className={'position-relative'} style={{ height: filtered.length * rowHeight }}>
                {filtered.slice(first, last).map((option, offset) => {
                  const index = first + offset
                  return (
                    <div key={option.value}
                      id={optionId(index)}
                      role={'option'}
                      aria-selected={option.value === value}
                      aria-setsize={filtered.length}
                      aria-posinset={index + 1}
                      className={`dropdown-item text-truncate py-0 ${index === activeIndex ? 'active' : ''} ${option.value === value ? 'fw-semibold' : ''}`}
                      style={{ position: 'absolute', top: index * rowHeight, left: 0, right: 0, height: rowHeight, lineHeight: `${rowHeight}px`, cursor: 'pointer' }}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => select(option)}>
                      {option.label}
                    </div>
                  )
                })}
              </div>}
          </div>
        </div>}
    </div>
  )
}
