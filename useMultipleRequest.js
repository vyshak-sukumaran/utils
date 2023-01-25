import { useAxios } from "./useAxios";
import useSWR from "swr";

export function useMultipleRequests(urls) {
  const api = useAxios();
  const fetcher = url =>
    api(url).then((res) => res.data);

    const multiFetcher = (resources, init) => {
        console.log(resources, init);
        return Promise.all(resources.map(url => fetcher(url)))
    }
  const { data, error, isLoading } = useSWR(urls, multiFetcher);

  return {
    data: data,
    isError: !!error,
    isLoading: isLoading,
  };
}
