import { useThrottledCallback } from "@mantine/hooks";
import { Vec3 } from "gl-matrix";
import _ from "lodash";
import { useEffect, useRef, useState } from "react";

// https://github.com/microsoft/TypeScript/issues/2957#issuecomment-749213455
// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace DeviceMotionEvent {
  /** https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/requestPermission_static */
  export const requestPermission:
    | (() => Promise<"granted" | "denied">)
    | undefined;
}

export interface UseDeviceMotionInput {
  shakeDuration: number;
  shakeThreshold: number;
  onMeanAcceleration?: (meanAcceleration: number) => unknown;
  onShake?: () => unknown;
}

export interface UseDeviceMotionResult {
  acceleration: number;
  isShaking: boolean;
}

export function useDeviceMotion({
  shakeDuration,
  shakeThreshold,
  onMeanAcceleration,
  onShake: propsOnShake,
}: UseDeviceMotionInput): UseDeviceMotionResult {
  const [acceleration, setAccelerationInternal] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const accelerationHistory = useRef<{ acceleration: number; time: number }[]>(
    [],
  ).current;

  const onShake = useThrottledCallback(() => propsOnShake?.(), shakeDuration);

  const setAcceleration = useThrottledCallback((acceleration: number) => {
    setAccelerationInternal(acceleration);

    const time = Date.now();
    accelerationHistory.push({ acceleration, time });

    const cutoff = accelerationHistory.findIndex(
      ({ time: t }) => t + shakeDuration >= time,
    );
    if (cutoff > 0) {
      accelerationHistory.splice(0, cutoff);
    }

    const meanAcceleration = _.meanBy(
      accelerationHistory,
      ({ acceleration }) => acceleration,
    );
    onMeanAcceleration?.(meanAcceleration);

    const isShaking = meanAcceleration >= shakeThreshold;
    setIsShaking((oldValue) => {
      if (isShaking && !oldValue) {
        onShake?.();
      }
      return isShaking;
    });
  }, 100);

  useEffect(() => {
    const listener = (event: DeviceMotionEvent) => {
      const { acceleration, accelerationIncludingGravity } = event;
      if (acceleration) {
        const { x, y, z } = acceleration;
        setAcceleration(new Vec3(x ?? 0, y ?? 0, z ?? 0).magnitude);
      } else if (accelerationIncludingGravity) {
        const { x, y, z } = accelerationIncludingGravity;
        setAcceleration(
          Math.max(new Vec3(x ?? 0, y ?? 0, z ?? 0).magnitude - 9.81, 0),
        );
      }
    };

    window.addEventListener("devicemotion", listener);
    return () => {
      window.removeEventListener("devicemotion", listener);
    };
  }, [setAcceleration]);

  return { acceleration, isShaking };
}

export interface UseRequestDeviceMotionPermissionResult {
  hasPermission: boolean | null;
  canRequestPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useRequestDeviceMotionPermission(): UseRequestDeviceMotionPermissionResult {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [canRequestPermission, setCanRequestPermission] = useState(true);

  return {
    hasPermission,
    canRequestPermission,
    requestPermission: async () => {
      if (hasPermission !== null) return hasPermission;
      try {
        const result = await DeviceMotionEvent.requestPermission?.();
        const hasPermission = result !== "denied";
        setHasPermission(hasPermission);
        setCanRequestPermission(hasPermission);
        return hasPermission;
      } catch (err) {
        console.warn("Failed to request DeviceMotionEvent permission", err);
        setHasPermission(false);
        setCanRequestPermission(false);
        return false;
      }
    },
  };
}
