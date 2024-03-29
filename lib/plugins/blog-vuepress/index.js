// fork and modify from @vuepress/plugin-blog

const { path, datatypes: { isString } } = require('@vuepress/shared-utils')

module.exports = (options, ctx) => {
  const {
    pageEnhancers = [],
    postsDir = '_posts',
    categoryIndexPageUrl = '/category/',
    tagIndexPageUrl = '/tag/',
    permalink = '/:year/:month/:day/:slug',
    lang,
  } = options

  const isDirectChild = regularPath => path.parse(regularPath).dir === '/'

  const enhancers = [
    {
      when: ({ regularPath }) => regularPath === categoryIndexPageUrl,
      frontmatter: { layout: 'Categories' },
    },
    {
      when: ({ regularPath }) => regularPath.startsWith(categoryIndexPageUrl),
      frontmatter: { layout: 'Category' },
    },
    {
      when: ({ regularPath }) => regularPath === tagIndexPageUrl,
      frontmatter: { layout: 'Tags' },
    },
    {
      when: ({ regularPath }) => regularPath.startsWith(tagIndexPageUrl),
      frontmatter: { layout: 'Tag' },
    },
    {
      when: ({ regularPath }) => regularPath === '/',
      frontmatter: { layout: 'Layout' },
    },
    {
      when: ({ regularPath }) => regularPath.startsWith(`/${postsDir}/`),
      frontmatter: {
        layout: 'Post',
        permalink: permalink,
      },
      data: { type: 'post' },
    },
    ...pageEnhancers,
    {
      when: ({ regularPath }) => isDirectChild(regularPath),
      frontmatter: { layout: 'Page' },
      data: { type: 'page' },
    },
  ]

  return {
    name: '@vuepress/plugin-blog (summer1874 modified version)',
    /**
     * Modify page's metadata according to the habits of blog users.
     */
    extendPageData (pageCtx) {
      const { frontmatter: rawFrontmatter } = pageCtx

      enhancers.forEach(({
        when,
        data = {},
        frontmatter = {},
      }) => {
        if (when(pageCtx)) {
          Object.keys(frontmatter).forEach(key => {
            if (!rawFrontmatter[key]) {
              rawFrontmatter[key] = frontmatter[key]
            }
          })
          Object.assign(pageCtx, data)
        }
      })
    },

    /**
     * Create tag page and category page.
     */
    async ready () {
      const { pages } = ctx
      const tagMap = {}
      const categoryMap = {}

      const curryHandler = (scope, map) => (key, pageKey) => {
        if (key) {
          if (!map[key]) {
            map[key] = {}
            map[key].path = `${scope}${key}.html`
            map[key].pageKeys = []
          }
          map[key].pageKeys.push(pageKey)
        }
      }

      const handleTag = curryHandler(tagIndexPageUrl, tagMap)
      const handleCategory = curryHandler(categoryIndexPageUrl, categoryMap)

      pages.forEach(({
        key,
        frontmatter: {
          tag,
          tags,
          category,
          categories,
        },
      }) => {
        if (isString(tag)) {
          handleTag(tag, key)
        }
        if (Array.isArray(tags)) {
          tags.forEach(tag => handleTag(tag, key))
        }
        if (isString(category)) {
          handleCategory(category, key)
        }
        if (Array.isArray(categories)) {
          categories.forEach(category => handleCategory(category, key))
        }
      })

      ctx.tagMap = tagMap
      ctx.categoryMap = categoryMap

      const extraPages = [
        {
          permalink: tagIndexPageUrl,
          frontmatter: { title: `${lang.tags}` },
        },
        {
          permalink: categoryIndexPageUrl,
          frontmatter: { title: `${lang.categories}` },
        },
        ...Object.keys(tagMap).map(tagName => ({
          permalink: tagMap[tagName].path,
          meta: { tagName },
          frontmatter: { title: `${tagName} | ${lang.tag}` },
        })),
        ...Object.keys(categoryMap).map(categoryName => ({
          permalink: categoryMap[categoryName].path,
          meta: { categoryName },
          frontmatter: { title: `${categoryName} | ${lang.category}` },
        })),
      ]
      await Promise.all(extraPages.map(page => ctx.addPage(page)))
    },

    /**
     * Generate tag and category metadata.
     */
    async clientDynamicModules () {
      return [
        {
          name: 'tag.js',
          content: `export default ${JSON.stringify(ctx.tagMap, null, 2)}`,
        },
        {
          name: 'category.js',
          content: `export default ${JSON.stringify(ctx.categoryMap, null, 2)}`,
        },
      ]
    },

    enhanceAppFiles: path.resolve(__dirname, 'enhanceAppFile.js'),
  }
}
