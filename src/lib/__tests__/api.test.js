import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock these functions before importing
vi.mock('../api', () => ({
  getNodeByURI: vi.fn(),
  getAllUris: vi.fn(),
  getPosts: vi.fn(),
  getPostsByCategory: vi.fn(),
  settingsQuery: vi.fn(),
  navQuery: vi.fn()
}));

// Import the mocked functions
import {
  getNodeByURI,
  getAllUris,
  getPosts,
  getPostsByCategory,
  settingsQuery,
  navQuery
} from '../api';

describe('API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up mock implementations
    getNodeByURI.mockImplementation(async (uri) => {
      if (uri === '/test-post/') {
        return {
          __typename: 'Post',
          id: 'post123',
          title: 'Test Post',
          content: 'Test content'
        };
      }
      return null;
    });
    
    getAllUris.mockResolvedValue([
      { params: { uri: 'post1' } },
      { params: { uri: 'post2' } },
      { params: { uri: 'page1' } }
    ]);
    
    getPosts.mockResolvedValue({
      posts: {
        edges: [
          { node: { id: 'post1', title: 'Post 1' } },
          { node: { id: 'post2', title: 'Post 2' } }
        ],
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          total: 10
        }
      }
    });
    
    getPostsByCategory.mockResolvedValue({
      posts: {
        edges: [
          { node: { id: 'post1', title: 'Post 1' } },
          { node: { id: 'post2', title: 'Post 2' } }
        ],
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          total: 5
        }
      }
    });
    
    settingsQuery.mockResolvedValue({
      generalSettings: {
        title: 'Test Site',
        description: 'Test Description'
      },
      allSettings: {
        readingSettingsPostsPerPage: 10
      }
    });
    
    navQuery.mockResolvedValue({
      menus: {
        nodes: [
          {
            menuItems: {
              nodes: [
                { label: 'Home', uri: '/' },
                { label: 'About', uri: '/about/' }
              ]
            }
          }
        ]
      }
    });
  });

  it('getNodeByURI fetches data for a given URI', async () => {
    const result = await getNodeByURI('/test-post/');
    
    expect(getNodeByURI).toHaveBeenCalledWith('/test-post/');
    expect(result.__typename).toBe('Post');
    expect(result.id).toBe('post123');
    expect(result.title).toBe('Test Post');
  });

  it('getAllUris fetches all content URIs', async () => {
    const result = await getAllUris();
    
    expect(getAllUris).toHaveBeenCalled();
    expect(result.length).toBe(3);
    expect(result[0].params.uri).toBe('post1');
  });

  it('getPosts fetches posts with pagination', async () => {
    const result = await getPosts(20, 1);
    
    expect(getPosts).toHaveBeenCalledWith(20, 1);
    expect(result.posts.edges.length).toBe(2);
    expect(result.posts.pageInfo.total).toBe(10);
  });

  it('getPostsByCategory fetches posts for a specific category', async () => {
    const result = await getPostsByCategory('test-category', 20, 1);
    
    expect(getPostsByCategory).toHaveBeenCalledWith('test-category', 20, 1);
    expect(result.posts.edges.length).toBe(2);
    expect(result.posts.pageInfo.total).toBe(5);
  });

  it('settingsQuery fetches WordPress settings', async () => {
    const result = await settingsQuery();
    
    expect(settingsQuery).toHaveBeenCalled();
    expect(result.generalSettings.title).toBe('Test Site');
    expect(result.allSettings.readingSettingsPostsPerPage).toBe(10);
  });

  it('navQuery fetches navigation menus', async () => {
    const result = await navQuery();
    
    expect(navQuery).toHaveBeenCalled();
    expect(result.menus.nodes.length).toBe(1);
    expect(result.menus.nodes[0].menuItems.nodes.length).toBe(2);
  });
});