export const normalizeHistorySegments = (segments: string[]): string[] => segments.filter((segment) => segment.length > 0);

export const normalizeHistoryRouteInput = (route: string | string[]): string[] => {
    if (Array.isArray(route)) {
        return normalizeHistorySegments([...route]);
    }

    return route.split('/').filter(Boolean);
};

