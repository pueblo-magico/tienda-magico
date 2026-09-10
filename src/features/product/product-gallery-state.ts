export type ProductGalleryState = {
  active: number;
  failedSource: string | null;
  failedThumbnails: Set<string>;
  loadingSource: string | null;
  retryCount: number;
};

export type ProductGalleryAction =
  | { type: "select"; index: number; source: string }
  | { type: "loaded"; source: string }
  | { type: "failed"; source: string }
  | { type: "retry"; source: string }
  | { type: "thumbnailFailed"; source: string };

export function createProductGalleryState(
  initialSource: string | null,
): ProductGalleryState {
  return {
    active: 0,
    failedSource: null,
    failedThumbnails: new Set(),
    loadingSource: initialSource,
    retryCount: 0,
  };
}

export function productGalleryReducer(
  state: ProductGalleryState,
  action: ProductGalleryAction,
): ProductGalleryState {
  switch (action.type) {
    case "select":
      return {
        ...state,
        active: action.index,
        failedSource: null,
        loadingSource: action.source,
      };
    case "loaded":
      return state.loadingSource === action.source
        ? { ...state, loadingSource: null }
        : state;
    case "failed":
      return state.loadingSource === action.source
        ? { ...state, failedSource: action.source, loadingSource: null }
        : state;
    case "retry":
      return {
        ...state,
        failedSource: null,
        loadingSource: action.source,
        retryCount: state.retryCount + 1,
      };
    case "thumbnailFailed": {
      const failedThumbnails = new Set(state.failedThumbnails);
      failedThumbnails.add(action.source);
      return { ...state, failedThumbnails };
    }
  }
}
