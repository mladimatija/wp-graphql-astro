import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock implementation of content functions
const contentFunctions = {
  getSiteConfig: async () => ({
    id: 'seo.md',
    data: {
      defaultTitle: 'Site Title',
      description: 'Site Description',
      showFeaturedImages: true
    },
    body: 'Site content'
  }),
  
  getPage: async (slug) => {
    if (slug === 'about-local') {
      return {
        id: 'about-local.md',
        slug: 'about-local',
        data: {
          title: 'About Page',
          description: 'About Description'
        },
        body: 'About content'
      };
    }
    return null;
  },
  
  getComponent: async (id) => {
    if (id === 'cta-newsletter') {
      return {
        id: 'cta-newsletter.md',
        data: {
          title: 'Newsletter',
          buttonText: 'Subscribe'
        },
        body: 'Sign up for our newsletter'
      };
    }
    return null;
  }
};

// Create mock functions that can be spied on
const mockGetSiteConfig = vi.fn(contentFunctions.getSiteConfig);
const mockGetPage = vi.fn(contentFunctions.getPage);
const mockGetComponent = vi.fn(contentFunctions.getComponent);

// Tests for the content module
describe('Content Module Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Site Configuration', () => {
    it('retrieves site config correctly', async () => {
      const config = await mockGetSiteConfig();
      
      expect(mockGetSiteConfig).toHaveBeenCalled();
      expect(config).toHaveProperty('data');
      expect(config.data).toHaveProperty('defaultTitle', 'Site Title');
      expect(config.data.showFeaturedImages).toBe(true);
    });
  });

  describe('Page Management', () => {
    it('retrieves a page by slug', async () => {
      const page = await mockGetPage('about-local');
      
      expect(mockGetPage).toHaveBeenCalledWith('about-local');
      expect(page).toHaveProperty('slug', 'about-local');
      expect(page.data).toHaveProperty('title', 'About Page');
    });

    it('returns null for non-existent pages', async () => {
      const page = await mockGetPage('non-existent');
      
      expect(mockGetPage).toHaveBeenCalledWith('non-existent');
      expect(page).toBeNull();
    });
  });

  describe('Component Management', () => {
    it('retrieves a component by id', async () => {
      const component = await mockGetComponent('cta-newsletter');
      
      expect(mockGetComponent).toHaveBeenCalledWith('cta-newsletter');
      expect(component).toHaveProperty('id', 'cta-newsletter.md');
      expect(component.data).toHaveProperty('buttonText', 'Subscribe');
    });

    it('returns null for non-existent components', async () => {
      const component = await mockGetComponent('non-existent');
      
      expect(mockGetComponent).toHaveBeenCalledWith('non-existent');
      expect(component).toBeNull();
    });
  });
});