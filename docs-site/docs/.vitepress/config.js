import { defineConfig } from 'vitepress'

export default defineConfig({
    title: 'Wenfit Validator',
    description: 'Universal validation library for TypeScript/JavaScript - Type-safe, framework-agnostic, and blazingly fast',

    head: [
        ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
        ['meta', { name: 'theme-color', content: '#646cff' }],
        ['meta', { name: 'og:type', content: 'website' }],
        ['meta', { name: 'og:title', content: 'Wenfit Validator' }],
        ['meta', { name: 'og:description', content: 'Universal validation library for TypeScript/JavaScript' }],
    ],

    ignoreDeadLinks: true,

    themeConfig: {
        logo: {
            light: '/logo.svg',
            dark: '/logo.svg',
            alt: 'Wenfit Validator'
        },

        nav: [
            { text: '🏠 Home', link: '/' },
            { text: '📚 Guide', link: '/introduction' },
            { text: '⚡ API', link: '/api' },
            {
                text: '🔌 Integrations',
                items: [
                    { text: 'React', link: '/integration/react' },
                    { text: 'Vue', link: '/integration/vue' },
                    { text: 'Angular', link: '/integration/angular' },
                    { text: 'NestJS', link: '/integration/nestjs' },
                    { text: 'Express', link: '/integration/express' }
                ]
            },
            {
                text: '📦 v1.0.0',
                items: [
                    { text: 'Changelog', link: 'https://github.com/Hailemariyam/wenfit-validator/blob/main/CHANGELOG.md' },
                    { text: 'Contributing', link: 'https://github.com/Hailemariyam/wenfit-validator/blob/main/CONTRIBUTING.md' }
                ]
            }
        ],

        sidebar: [
            {
                text: '🚀 Getting Started',
                collapsed: false,
                items: [
                    { text: 'Introduction', link: '/introduction' },
                    { text: 'Quick Start', link: '/introduction#quick-start' },
                    { text: 'Installation', link: '/introduction#installation' }
                ]
            },
            {
                text: '📖 Documentation',
                collapsed: false,
                items: [
                    { text: 'API Reference', link: '/api' },
                    { text: 'Adapters', link: '/adapters' }
                ]
            },
            {
                text: '💡 Core Concepts',
                collapsed: false,
                items: [
                    { text: 'Schemas', link: '/concepts/schemas' },
                    { text: 'Error Handling', link: '/concepts/errors' }
                ]
            },
            {
                text: '🔌 Framework Integration',
                collapsed: false,
                items: [
                    { text: '⚛️ React', link: '/integration/react' },
                    { text: '💚 Vue', link: '/integration/vue' },
                    { text: '🅰️ Angular', link: '/integration/angular' },
                    { text: '🐈 NestJS', link: '/integration/nestjs' },
                    { text: '🚂 Express', link: '/integration/express' }
                ]
            }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/Hailemariyam/wenfit-validator' },
            { icon: 'npm', link: 'https://www.npmjs.com/package/wenfit-validator' }
        ],

        footer: {
            message: 'Released under the <a href="https://github.com/Hailemariyam/wenfit-validator/blob/main/LICENSE">MIT License</a>.',
            copyright: 'Copyright © 2024-present <a href="https://github.com/Hailemariyam">Hailemariyam</a>'
        },

        search: {
            provider: 'local',
            options: {
                placeholder: 'Search documentation...',
                translations: {
                    button: {
                        buttonText: 'Search',
                        buttonAriaLabel: 'Search documentation'
                    }
                }
            }
        },

        editLink: {
            pattern: 'https://github.com/Hailemariyam/wenfit-validator/edit/main/docs-site/docs/:path',
            text: 'Edit this page on GitHub'
        },

        outline: {
            level: [2, 3],
            label: 'On this page'
        }
    }
})
