import type { Dispatch, SetStateAction } from "react";

/** Type alias for the second function returned by `useState`. */
export type SetState<T> = Dispatch<SetStateAction<T>>;

// https://www.totaltypescript.com/get-keys-of-an-object-where-values-are-of-a-given-type
export type KeysOfValue<T, ConditionT> = {
  [K in keyof T]: T[K] extends ConditionT ? K : never;
}[keyof T];
