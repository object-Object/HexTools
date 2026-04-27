import type { Dispatch, SetStateAction } from "react";

/** Type alias for the second function returned by `useState`. */
export type SetState<T> = Dispatch<SetStateAction<T>>;
