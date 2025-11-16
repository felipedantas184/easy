/**
 * Helper functions for SEO optimization
 */

export interface SEOData {
  title: string;
  description: string;
}

/**
 * Generate SEO title from product name
 */
export function generateSEOTitle(productName: string, maxLength: number = 60): string {
  if (!productName) return '';
  
  // Remove extra spaces and trim
  let title = productName.trim().replace(/\s+/g, ' ');
  
  // Truncate if too long
  if (title.length > maxLength) {
    title = title.substring(0, maxLength - 3) + '...';
  }
  
  return title;
}

/**
 * Generate SEO description from product description
 */
export function generateSEODescription(productDescription: string, maxLength: number = 160): string {
  if (!productDescription) return '';
  
  // Remove HTML tags and extra spaces
  let description = productDescription
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
  
  // Truncate if too long
  if (description.length > maxLength) {
    description = description.substring(0, maxLength - 3) + '...';
  }
  
  return description;
}

/**
 * Check if SEO title/description needs optimization
 */
export function checkSEOOptimization(seoTitle: string, seoDescription: string): {
  title: { isValid: boolean; message: string };
  description: { isValid: boolean; message: string };
} {
  return {
    title: {
      isValid: seoTitle.length >= 30 && seoTitle.length <= 60,
      message: seoTitle.length < 30 
        ? 'Muito curto (mínimo 30 caracteres)' 
        : seoTitle.length > 60 
        ? 'Muito longo (máximo 60 caracteres)'
        : 'Ótimo tamanho!'
    },
    description: {
      isValid: seoDescription.length >= 70 && seoDescription.length <= 160,
      message: seoDescription.length < 70 
        ? 'Muito curto (mínimo 70 caracteres)' 
        : seoDescription.length > 160 
        ? 'Muito longo (máximo 160 caracteres)'
        : 'Ótimo tamanho!'
    }
  };
}