// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking

import { themes as prismThemes } from "prism-react-renderer";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Kmesh",
  tagline:
    "Kmesh is a high-performance service grid data plane software implemented based on the eBPF and programmable kernel.",
  favicon: "/static/img/favicons/favicon.ico",

  // Production URL (no trailing slash)
  url: "https://kmesh.net",
  baseUrl: "/",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en", "zh"],
    localeConfigs: {
      en: { htmlLang: "en-GB", label: "English" },
      zh: { label: "简体中文" },
    },
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: "./sidebars.js",
          editUrl: "https://kmesh.net/docs/welcome",
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
        },
        blog: {
          showReadingTime: true,
          feedOptions: { type: ["rss", "atom"], xslt: true },
          editUrl: "https://kmesh.net/blog",
          // silence non-SEO warnings
          onInlineTags: "ignore",
          onInlineAuthors: "ignore",
          onUntruncatedBlogPosts: "ignore",
        },
        gtag: {
          trackingID: "G-854W8PEZ1Z",
          anonymizeIP: true,
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      /* ------- GLOBAL SEO ------- */
      metadata: [
        {
          name: "description",
          content:
            "Kmesh - eBPF-based high-performance service-mesh load balancer. Docs, downloads, tutorials and community.",
        },
        {
          name: "keywords",
          content:
            "kmesh, service mesh, ebpf, load balancer, cloud native, kubernetes, eBPF, cncf",
        },
        { name: "author", content: "Kmesh Project" },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Kmesh" },
        {
          property: "og:image",
          content: "/img/favicons/favicon.ico",
        },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: "Kmesh eBPF Service Mesh" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@Kmesh_net" },
        { name: "twitter:creator", content: "@Kmesh_net" },
      ],

      docs: {
        sidebar: { hideable: true, autoCollapseCategories: true },
      },

      sitemap: {
        changefreq: "weekly",
        priority: 0.5,
        ignorePatterns: ["/tags/**"],
      },

      navbar: {
        title: "Kmesh",
        logo: { alt: "Kmesh logo", src: "img/favicons/favicon.ico" },
        items: [
          {
            type: "docSidebar",
            sidebarId: "tutorialSidebar",
            position: "left",
            label: "Documentation",
          },
          { to: "/blog", label: "Blog", position: "left" },
          {
            href: "https://github.com/kmesh-net/kmesh/releases",
            label: "Downloads",
            position: "left",
          },
          {
            href: "https://github.com/kmesh-net/kmesh",
            position: "right",
            className: "header-github-link header-icon",
          },
          {
            href: "https://x.com/Kmesh_net",
            position: "right",
            className: "header-x-link header-icon",
          },
          {
            href: "https://www.youtube.com/@Kmesh-traffic",
            position: "right",
            className: "header-youtube-link header-icon",
          },
          {
            href: "https://app.slack.com/client/T08PSQ7BQ/C06BU2GB8NL",
            position: "right",
            className: "header-slack-link header-icon",
          },
          { type: "localeDropdown", position: "right" },
        ],
      },

      footer: {
        style: "dark",
        copyright: `Copyright © Kmesh a Series of LF Projects, LLC<br>For website terms of use, trademark policy and other project policies please see <a href="https://lfprojects.org/policies/">lfprojects.org/policies/</a>.`,
      },

      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ["bash"],
      },

      zoom: {
        selector: ".markdown img",
        options: {
          margin: 24,
          background: "#BADA55",
          scrollOffset: 0,
          container: "#zoom-container",
          template: "#zoom-template",
        },
      },
    }),

  plugins: [
    [require.resolve("./src/plugins/blogGlobalData/index.js"), {}],
    "docusaurus-plugin-sass",
    "plugin-image-zoom",
    [
      "docusaurus-lunr-search",
      {
        languages: ["en", "zh"],
        indexDocs: true,
        indexBlog: true,
        indexPages: false,
      },
    ],
  ],

  // --- 性能：字体预载 + 长缓存 ---
  stylesheets: [
    {
      href: "/fonts/inter.woff2",
      type: "font/woff2",
      rel: "preload",
      as: "font",
      crossOrigin: "anonymous",
    },
  ],
};

export default config;
