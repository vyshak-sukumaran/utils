const fetcher = (...urls) => {
  const f = url => fetch(url).then(r => r.json())
  return Promise.all(urls.map(url => f(url)))
}

export default function useMultipleRequests() {
  const urls = ['/api/v1/magazines/1234', '/api/v1/magazines/1234/articles']
  const { data, error } = useSWR(urls, fetcher)
  return {
    data: data,
    isError: !!error,
    isLoading: !data && !error
  }
}
