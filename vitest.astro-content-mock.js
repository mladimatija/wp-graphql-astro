// Mock for astro:content module in tests
export const getCollection = async () => [];
export const getEntry = async () => null;
export const render = async () => ({ Content: () => null, headings: [] });
