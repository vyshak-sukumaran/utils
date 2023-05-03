import { useSWRConfig } from "swr"

export const useMutateMultiple = () => {
    const { cache, mutate } = useSWRConfig()
    
    return (matcher, ...args) => {
        if (!(cache instanceof Map)) {
            throw new Error('mutateMultiple requires the cache provider to be a Map instance')
        }
        let keys = []
        for (const key of cache.keys()) {
            if (key.includes(matcher)) {
                keys.push(key)
            }
        }
        const mutations = keys.map((key) => mutate(key, ...args))
        return Promise.all(mutations)
    }
}
