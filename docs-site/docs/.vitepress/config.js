import { defineConfig } from 'vitepress'

export default defineConfig({
    title: 'Wenfit Validator',
    description: 'Universal validation library for TypeScript/JavaScript',

    ignoreDeadLinks: true,

    themeConfig: {
        logo: '/logo.svg',

        nav: [
            { text: 'Guide', link: '/introduction' },
            { text: 'API', link: '/api' },
            { text: 'Examples', link: 'https://github.com/yourusername/wenfit-validator/tree/main/examples' }
        ],

        sidebar: [
            {
                text: 'Getting Started',
                items: [
                    { text: 'Introduction', link: '/introduction' },
                    { text: 'API Reference', link: '/api' },
                    { text: 'Adapters', link: '/adapters' }
                ]
            },
            {
                text: 'Core Concepts',
                items: [
                    { text: 'Schemas', link: '/concepts/schemas' },
                    { text: 'Error Handling', link: '/concepts/errors' }
                ]
            },
            {
                text: 'Framework Integration',
                items: [
                    { text: 'React', link: '/integration/react' },
                    { text: 'Vue', link: '/integration/vue' },
                    { text: 'Angular', link: '/integration/angular' },
                    { text: 'Express', link: '/integration/express' }
                ]
            }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/yourusername/wenfit-validator' }
        ],

        footer: {
            message: 'Released under the MIT License.',
            copyright: 'Copyright © 2024-present'
        },

        search: {
            provider: 'local'
        }
    }
})
