const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry, { reportAllChanges: true })
      getFID(onPerfEntry, { reportAllChanges: true })
      getFCP(onPerfEntry, { reportAllChanges: true })
      getLCP(onPerfEntry, { reportAllChanges: true })
      getTTFB(onPerfEntry, { reportAllChanges: true })
    })
  }
}

export default reportWebVitals
