import {describe, it, expect} from 'vitest';

// A simplified JavaScript version of the PostCard component logic for testing
class PostCardMock {
    constructor(post, showFeaturedImage = true) {
        this.post = post;
        this.showFeaturedImage = showFeaturedImage;
    }

    hasFeaturedImage() {
        const hasImage = this.post.featuredImage &&
            this.post.featuredImage.node &&
            this.post.featuredImage.node.mediaItemUrl;
        return hasImage && this.showFeaturedImage;
    }

    getExcerpt(maxLength = 150) {
        // Simplified excerpt logic
        const text = this.post.content.replace(/<[^>]*>/g, '');
        return text.length > maxLength
            ? text.substring(0, maxLength) + '...'
            : text;
    }

    renderHTML() {
        let html = '<article class="post">';

        // Title
        html += `<h2><a href="${this.post.uri}">${this.post.title}</a></h2>`;

        // Featured image
        if (this.hasFeaturedImage()) {
            html += `<img src="${this.post.featuredImage.node.mediaItemUrl}" alt="${this.post.featuredImage.node.altText || this.post.title}">`;
        }

        // Excerpt
        html += `<p>${this.getExcerpt()}</p>`;

        // Read more link
        html += `<a href="${this.post.uri}" class="read-more">continue reading</a>`;

        html += '</article>';
        return html;
    }
}

describe('PostCard Basic Logic', () => {
    const mockPost = {
        id: '123',
        title: 'Test Post',
        uri: '/test-post/',
        content: '<p>This is test content that will be stripped and truncated for the excerpt...</p>',
        featuredImage: {
            node: {
                mediaItemUrl: 'https://example.com/image.jpg',
                altText: 'Test alt text'
            }
        }
    };

    it('detects featured image correctly', () => {
        const postCard = new PostCardMock(mockPost, true);
        expect(postCard.hasFeaturedImage()).toBe(true);

        // Pass null featuredImage prop correctly
        const postWithoutImage = {
            ...mockPost,
            featuredImage: null
        };
        const postCardNoImage = new PostCardMock(postWithoutImage, true);
        // Call directly and verify the result is falsy
        expect(!!postCardNoImage.hasFeaturedImage()).toBe(false);

        const postCardImageDisabled = new PostCardMock(mockPost, false);
        expect(postCardImageDisabled.hasFeaturedImage()).toBe(false);
    });

    it('generates excerpt correctly', () => {
        const postCard = new PostCardMock(mockPost);
        const excerpt = postCard.getExcerpt();

        // Excerpt should strip HTML
        expect(excerpt).not.toContain('<p>');
        expect(excerpt).not.toContain('</p>');

        // Excerpt should be truncated with ellipsis for long content
        const longPost = {
            ...mockPost,
            content: '<p>' + 'a'.repeat(200) + '</p>'
        };
        const postCardLong = new PostCardMock(longPost);
        const longExcerpt = postCardLong.getExcerpt();

        expect(longExcerpt.length).toBeLessThanOrEqual(153); // 150 chars + '...'
        expect(longExcerpt.endsWith('...')).toBe(true);

        // Short content should not be truncated
        const shortPost = {
            ...mockPost,
            content: '<p>Short content</p>'
        };
        const postCardShort = new PostCardMock(shortPost);
        const shortExcerpt = postCardShort.getExcerpt();

        expect(shortExcerpt).toBe('Short content');
        expect(shortExcerpt.endsWith('...')).toBe(false);
    });

    it('renders HTML with all elements', () => {
        const postCard = new PostCardMock(mockPost);
        const html = postCard.renderHTML();

        // Check for title
        expect(html).toContain(`<h2><a href="/test-post/">Test Post</a></h2>`);

        // Check for featured image
        expect(html).toContain(`<img src="https://example.com/image.jpg" alt="Test alt text">`);

        // Check for excerpt
        expect(html).toContain(`<p>This is test content that will be stripped and truncated for the excerpt...</p>`);

        // Check for read more link
        expect(html).toContain(`<a href="/test-post/" class="read-more">continue reading</a>`);
    });

    it('omits featured image when disabled', () => {
        const postCard = new PostCardMock(mockPost, false);
        const html = postCard.renderHTML();

        // Should not contain image
        expect(html).not.toContain(`<img src="https://example.com/image.jpg"`);
    });
});