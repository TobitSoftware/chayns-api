/** @type {import('@docusaurus/types').DocusaurusConfig} */
const path = require('path');

module.exports = {
	title: "chayns-api",
	tagline: "",
	url: "https://tobitsoftware.github.io/chayns-api",
	baseUrl: "/chayns-api/",
	onBrokenLinks: "warn",
	onBrokenMarkdownLinks: "warn",
	favicon: "/img/favicon.ico",
	organizationName: "TobitSoftware",
	projectName: "chayns-api",
	themeConfig: {
		colorMode: {
			respectPrefersColorScheme: true,
			switchConfig: {
				darkIcon: "🌑",
				lightIcon: "💡",
			},
		},
		navbar: {
            title: 'chayns-api',
			items: [
                {
                    to: 'docs',
                    label: 'API',
                    activeBasePath: "docs",
                    position: 'left',
                },
                {
                    to: 'api',
                    label: 'Types',
                    position: 'left',
                },
				{
					href: "https://github.com/TobitSoftware/chayns-api",
					label: "GitHub",
					position: "right",
				},
			],
		},
		footer: {
			copyright: `Copyright © ${new Date().getFullYear()} Tobit Software Laboratories AG. Built with Docusaurus.`,
		},
		prism: {
			theme: require("prism-react-renderer/themes/github"),
			darkTheme: require("prism-react-renderer/themes/oceanicNext"),
		}
	},
    plugins: [
        [
            'docusaurus-plugin-typedoc-api',
            {
                projectRoot: path.join(__dirname, '..'),
                // // Monorepo
                //packages: ['src/index.ts']
                // // Polyrepo
                packages: ['.'],
                typedocOptions: {
                    'excludeInternal': true,
                    'categorizeByGroup': true,
                  //  'defaultCategory': true,
                  //   'categoryOrder': [
                  //       "Functions",
                  //       "Event listener",
                  //       "*"
                  //   ]
                }
            }
        ],
    ],
	presets: [
		[
			"@docusaurus/preset-classic",
			{
				docs: {
					sidebarPath: require.resolve("./sidebars.js"),
					editUrl:
						"https://github.com/TobitSoftware/chayns-api/edit/main/docs/",
				},
				theme: {
					customCss: require.resolve("./src/css/custom.css"),
				},
			},
		],
	],
}
