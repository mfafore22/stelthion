'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useWeather(mallId: string) {
  const { data, error, isLoading } = useSWR(
    mallId ? `/api/weather/current?mallId=${mallId}` : null,
    fetcher,
    { refreshInterval: 600000, revalidateOnFocus: false, dedupingInterval: 300000 }
  )
  return { weather: data, isLoading, isError: error }
}

export function useWeatherForecast(mallId: string) {
  const { data, error, isLoading } = useSWR(
    mallId ? `/api/weather/forecast?mallId=${mallId}` : null,
    fetcher,
    { refreshInterval: 3600000, revalidateOnFocus: false }
  )
  return { forecast: data, isLoading, isError: error }
}
