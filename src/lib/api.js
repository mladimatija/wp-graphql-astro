export async function settingsQuery() {
  const siteSettingsQueryRes = await fetch(import.meta.env.WORDPRESS_API_URL, {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `{
                generalSettings {
                    title
                    url
                    description
                }
                allSettings {
                  readingSettingsPostsPerPage
                }
            }
            `,
    }),
  });
  const { data } = await siteSettingsQueryRes.json();
  return data;
}

export async function navQuery() {
  const siteNavQueryRes = await fetch(import.meta.env.WORDPRESS_API_URL, {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `{
                menus(where: {location: PRIMARY}) {
                  nodes {
                    name
                    menuItems {
                        nodes {
                            uri
                            url
                            order
                            label
                        }
                    }
                  }
                }
            }
            `,
    }),
  });
  const { data } = await siteNavQueryRes.json();
  return data;
}

export async function getPosts($first = 200) {
  const response = await fetch(import.meta.env.WORDPRESS_API_URL, {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query GET_POSTS($first: Int) {
                posts(first: $first) {
                  edges {
                    node {
                      id
                      title
                      date
                      dateGmt
                      modified
                      modifiedGmt
                      uri
                      excerpt
                      content
                      categories {
                        nodes {
                          name
                          uri
                        }
                      }                    
                      featuredImage {
                        node {
                          mediaItemUrl
                          altText
                        }
                      }
                    }
                  }
                  pageInfo {
                    total
                  }                  
                }
              }`,
      variables: {
        first: $first,
      },
    }),
  });
  const res = await response.json();
  return res.data;
}

export async function getPostsByCategory($category, $first = 200) {
  const response = await fetch(import.meta.env.WORDPRESS_API_URL, {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query GET_POSTS($category: ID!, $first: Int) {
              category(id: $category, idType: SLUG) {
                  posts(first: $first) {
                    edges {
                      node {
                        id
                        postId
                        title
                        date
                        dateGmt
                        modified
                        modifiedGmt
                        uri
                        link
                        guid
                        excerpt
                        content
                      }
                    }
                  }
                }
              }`,
      variables: {
        category: $category,
        first: $first,
      },
    }),
  });
  const res = await response.json();
  return res.data;
}

export async function getNodeByURI(uri) {
  const response = await fetch(import.meta.env.WORDPRESS_API_URL, {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query GetNodeByURI($uri: String!) {
                nodeByUri(uri: $uri) {
                  __typename
                  ... on Post {
                    id
                    postId
                    title
                    date
                    dateGmt
                    modified
                    modifiedGmt
                    uri
                    link
                    guid
                    excerpt
                    content
                    categories {
                      nodes {
                        name
                        uri
                      }
                    }                    
                    featuredImage {
                      node {
                        mediaItemUrl
                        altText
                      }
                    }
                    next {
                      id
                      title
                      uri
                    }
                    previous {
                      id
                      title
                      uri
                    }                    
                  }
                  ... on Page {
                    id
                    title
                    uri
                    date
                    content
                    featuredImage {
                      node {
                        mediaItemUrl
                        altText
                      }
                    }                    
                  }
                  ... on Category {
                    id
                    name
                    slug
                    posts {
                      nodes {
                        id
                        title
                        date
                        dateGmt
                        modified
                        modifiedGmt
                        uri
                        excerpt
                        content
                      }
                    }
                  }
                  ... on Tag {
                    id
                    name
                    slug
                    posts {
                      nodes {
                        id
                        title
                        date
                        dateGmt
                        modified
                        modifiedGmt
                        uri
                        excerpt
                        content
                      }
                    }
                  }                  
                }
              }
            `,
      variables: {
        uri: uri,
      },
    }),
  });
  const { data } = await response.json();
  return data;
}

export async function getAllUris() {
  const response = await fetch(import.meta.env.WORDPRESS_API_URL, {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query GetAllUris {
            terms {
              nodes {
                uri
              }
            }
            categories {
              nodes {
                uri
              }
            }            
            posts(first: 100) {
              nodes {
                uri
              }
            }
            pages(first: 100) {
              nodes {
                uri
              }
            }
          }
          `,
    }),
  });
  const { data } = await response.json();
  const uris = Object.values(data)
    .reduce(function (acc, currentValue) {
      return acc.concat(currentValue.nodes);
    }, [])
    .map((node) => {
      let trimmedURI = node.uri.substring(1);
      trimmedURI = trimmedURI.substring(0, trimmedURI.length - 1);
      return {
        params: {
          uri: trimmedURI,
        },
      };
    });

  return uris;
}
