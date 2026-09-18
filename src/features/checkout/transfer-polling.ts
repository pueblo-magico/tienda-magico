type PollingOptions = {
  visibility: Pick<
    Document,
    "visibilityState" | "addEventListener" | "removeEventListener"
  >;
  isRefreshing: () => boolean;
  refresh: () => void;
};

export function startTransferPolling({
  visibility,
  isRefreshing,
  refresh,
}: PollingOptions) {
  const check = () => {
    if (visibility.visibilityState === "visible" && !isRefreshing()) refresh();
  };
  const timer = setInterval(check, 10_000);
  visibility.addEventListener("visibilitychange", check);
  return () => {
    clearInterval(timer);
    visibility.removeEventListener("visibilitychange", check);
  };
}
