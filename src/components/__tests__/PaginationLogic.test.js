import { describe, it, expect } from 'vitest';

/**
 * Mock pagination logic to test pagination functionality without Astro components
 */
class PaginationHelper {
  constructor(options = {}) {
    this.isHomepage = options.isHomepage || false;
    this.totalPosts = options.totalPosts || 0;
    this.currentPage = options.currentPage || 1;
    this.lastPage = options.lastPage || 1;
    this.postsPerPage = options.postsPerPage || 10;
    this.prevUrl = options.prevUrl;
    this.nextUrl = options.nextUrl;
  }

  getPaginationText() {
    let text = "Page ";

    if (this.isHomepage) {
      text += "1";

      if (this.totalPosts) {
        text += ` of ${Math.ceil(this.totalPosts / this.postsPerPage)}`;
      }
    } else {
      text += `${this.currentPage} of ${this.lastPage}`;
    }

    return text;
  }

  hasPrevPage() {
    return !this.isHomepage && !!this.prevUrl;
  }

  hasNextPage() {
    if (this.isHomepage) {
      return this.totalPosts > this.postsPerPage;
    }
    return this.currentPage < this.lastPage;
  }

  getPrevPageUrl() {
    if (!this.hasPrevPage()) return null;
    return this.prevUrl === "/page" ? "/" : this.prevUrl;
  }

  getNextPageUrl() {
    if (!this.hasNextPage()) return null;
    return this.isHomepage ? "/page/2" : this.nextUrl;
  }
}

describe('Pagination Logic', () => {
  it('shows correct pagination text for homepage', () => {
    const pagination = new PaginationHelper({
      isHomepage: true,
      totalPosts: 25,
      postsPerPage: 10
    });
    
    expect(pagination.getPaginationText()).toBe('Page 1 of 3');
  });
  
  it('shows correct pagination text for other pages', () => {
    const pagination = new PaginationHelper({
      isHomepage: false,
      currentPage: 2,
      lastPage: 5
    });
    
    expect(pagination.getPaginationText()).toBe('Page 2 of 5');
  });
  
  it('determines previous page availability correctly', () => {
    // Homepage should not have a prev page
    const homePagination = new PaginationHelper({
      isHomepage: true
    });
    expect(homePagination.hasPrevPage()).toBe(false);
    
    // Page 1 but not homepage should not have prev if no prevUrl
    const firstPagePagination = new PaginationHelper({
      isHomepage: false,
      currentPage: 1,
      prevUrl: null
    });
    expect(firstPagePagination.hasPrevPage()).toBe(false);
    
    // Page 2 should have a prev page
    const midPagePagination = new PaginationHelper({
      isHomepage: false,
      currentPage: 2,
      prevUrl: '/page/1'
    });
    expect(midPagePagination.hasPrevPage()).toBe(true);
  });
  
  it('determines next page availability correctly', () => {
    // Homepage with enough posts for 2+ pages should have next
    const homePagination = new PaginationHelper({
      isHomepage: true,
      totalPosts: 25,
      postsPerPage: 10
    });
    expect(homePagination.hasNextPage()).toBe(true);
    
    // Last page should not have next
    const lastPagePagination = new PaginationHelper({
      isHomepage: false,
      currentPage: 3,
      lastPage: 3
    });
    expect(lastPagePagination.hasNextPage()).toBe(false);
    
    // Mid-page should have next
    const midPagePagination = new PaginationHelper({
      isHomepage: false,
      currentPage: 2,
      lastPage: 5
    });
    expect(midPagePagination.hasNextPage()).toBe(true);
  });
  
  it('provides correct previous page URL', () => {
    // Should convert "/page" to root
    const pagination = new PaginationHelper({
      isHomepage: false,
      currentPage: 2,
      prevUrl: '/page'
    });
    expect(pagination.getPrevPageUrl()).toBe('/');
    
    // Should keep normal URLs
    const normalPagination = new PaginationHelper({
      isHomepage: false,
      currentPage: 3,
      prevUrl: '/page/2'
    });
    expect(normalPagination.getPrevPageUrl()).toBe('/page/2');
    
    // No prev URL for homepage
    const homePagination = new PaginationHelper({
      isHomepage: true
    });
    expect(homePagination.getPrevPageUrl()).toBeNull();
  });
  
  it('provides correct next page URL', () => {
    // Homepage should go to page 2
    const homePagination = new PaginationHelper({
      isHomepage: true,
      totalPosts: 25,
      postsPerPage: 10
    });
    expect(homePagination.getNextPageUrl()).toBe('/page/2');
    
    // Normal page should use nextUrl
    const pagination = new PaginationHelper({
      isHomepage: false,
      currentPage: 2,
      lastPage: 5,
      nextUrl: '/page/3'
    });
    expect(pagination.getNextPageUrl()).toBe('/page/3');
    
    // Last page should have no next URL
    const lastPagePagination = new PaginationHelper({
      isHomepage: false,
      currentPage: 5,
      lastPage: 5
    });
    expect(lastPagePagination.getNextPageUrl()).toBeNull();
  });
});