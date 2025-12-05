import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock API functions
vi.mock("../../lib/api", () => ({
  settingsQuery: vi.fn().mockResolvedValue({
    allSettings: {
      readingSettingsPostsPerPage: 10,
    },
  }),
}));

// Create a simplified version of the Pagination component logic for testing
class PaginationLogic {
  constructor(props) {
    this.isHomepage = props.isHomepage || false;
    this.totalPosts = props.totalPosts || 0;
    this.page = props.page || null;
    this.postsPerPage = 10; // Mock the WordPress setting
  }

  getPaginationText() {
    let text = "Page ";

    if (this.isHomepage) {
      text += "1";

      if (this.totalPosts) {
        text += ` of ${Math.ceil(this.totalPosts / this.postsPerPage)}`;
      }
    } else if (this.page) {
      text += `${this.page.currentPage} of ${this.page.lastPage}`;
    }

    return text;
  }

  hasPrevLink() {
    return !this.isHomepage && this.page && this.page.url.prev;
  }

  getPrevLink() {
    if (!this.hasPrevLink()) return null;
    return this.page.url.prev === "/page" ? "/" : this.page.url.prev;
  }

  hasNextLink() {
    return (
      this.isHomepage ||
      (this.page && this.page.currentPage !== this.page.lastPage)
    );
  }

  getNextLink() {
    if (!this.hasNextLink()) return null;
    return this.isHomepage ? "/page/2" : this.page.url.next;
  }

  render() {
    // Return an object representing the rendered output
    // This helps with testing without needing to parse HTML
    return {
      paginationText: this.getPaginationText(),
      prevLink: this.getPrevLink(),
      nextLink: this.getNextLink(),
    };
  }
}

describe("Pagination Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders homepage pagination correctly", () => {
    const pagination = new PaginationLogic({
      isHomepage: true,
      totalPosts: 30,
    });

    const output = pagination.render();
    expect(output.paginationText).toBe("Page 1 of 3");
    expect(output.prevLink).toBeNull();
    expect(output.nextLink).toBe("/page/2");
  });

  it("renders non-homepage pagination correctly", () => {
    const pagination = new PaginationLogic({
      isHomepage: false,
      page: {
        currentPage: 2,
        lastPage: 5,
        url: {
          prev: "/page/1",
          next: "/page/3",
        },
      },
    });

    const output = pagination.render();
    expect(output.paginationText).toBe("Page 2 of 5");
    expect(output.prevLink).toBe("/page/1");
    expect(output.nextLink).toBe("/page/3");
  });

  it("handles first page correctly when not homepage", () => {
    const pagination = new PaginationLogic({
      isHomepage: false,
      page: {
        currentPage: 1,
        lastPage: 3,
        url: {
          prev: undefined,
          next: "/page/2",
        },
      },
    });

    const output = pagination.render();
    expect(output.paginationText).toBe("Page 1 of 3");
    expect(output.prevLink).toBeNull();
    expect(output.nextLink).toBe("/page/2");
  });

  it("handles last page correctly", () => {
    const pagination = new PaginationLogic({
      isHomepage: false,
      page: {
        currentPage: 4,
        lastPage: 4,
        url: {
          prev: "/page/3",
          next: undefined,
        },
      },
    });

    const output = pagination.render();
    expect(output.paginationText).toBe("Page 4 of 4");
    expect(output.prevLink).toBe("/page/3");
    expect(output.nextLink).toBeNull();
  });
});
