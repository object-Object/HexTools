import { useLocalStorage, type UseStorageReturnValue } from "@mantine/hooks";

interface UseLocalStorageObjectOptions<T extends object> {
  key: string;
  defaultValue: T;
}

/** Wrapper around useLocalStorage that properly fills in missing default values */
export function useLocalStorageObject<T extends object>(
  options: UseLocalStorageObjectOptions<T>,
): UseStorageReturnValue<T> {
  const { defaultValue } = options;
  return useLocalStorage({
    ...options,
    deserialize: (localStorageValue = "{}") => {
      return {
        ...defaultValue,
        ...(JSON.parse(localStorageValue) as T),
      };
    },
  });
}
