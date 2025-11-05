import { StoreTheme } from "@/types/store";

export const DEFAULT_STORE_THEME: StoreTheme = {
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  fontFamily: 'Inter, sans-serif',
};

export const STORE_SLUG_REGEX = /^[a-z0-9-]+$/;