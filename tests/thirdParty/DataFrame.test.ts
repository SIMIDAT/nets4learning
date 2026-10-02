import * as dfd from 'danfojs'

describe('DataFrame', () => {
  test('DataFrame Dates', () => {
    // Fechas en hora local (año, mes desde 0, día, horas…), como las lee dt.hours(): así el test da lo mismo en
    // cualquier zona horaria. Con new Date('2019-01-02') (solo la fecha) sería medianoche UTC: las 01:00 en Madrid,
    // pero las 00:00 en GitHub Actions (UTC).
    const data = [
      ['Alice', 2, new Date(2029, 0, 1, 1, 0, 0)],
      ['Bob', 5, new Date(2019, 0, 2)],
      ['Charlie', 30, new Date(2020, 0, 3, 1, 0, 20)],
      ['Dennis', 89, new Date(2022, 1, 4, 2, 16, 0)],
    ]
    const columns: string[] = ['Name', 'Count', 'Date']
    const df = new dfd.DataFrame(data, { columns: columns })
    expect(df['Date'].dt.hours().values).toStrictEqual([1, 0, 1, 2])
  })
})
