// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking

import { themes as prismThemes } from "prism-react-renderer";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Kmesh",
  tagline: "High-performance sidecarless service mesh dataplane based on eBPF",
  favicon: "img/favicons/favicon.ico",

  // Set the production url of your site here
  url: "https://kmesh.net",

  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // ===== SEO: Head tags =====
  headTags: [
    {
      tagName: "script",
      attributes: {
        type: "application/ld+json",
      },
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Kmesh",
        url: "https://kmesh.net",
        logo: "https://kmesh.net/img/favicons/favicon.ico",
        sameAs: [
          "https://github.com/kmesh-net/kmesh",
          "https://x.com/Kmesh_net",
          "https://www.youtube.com/@Kmesh-traffic",
        ],
      }),
    },
  ],

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en", "zh"],
    localeConfigs: {
      en: {
        htmlLang: "en-GB",
        label: "English",
      },
      zh: {
        label: "简体中文",
      },
    },
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: "./sidebars.js",
          editUrl: "https://github.com/kmesh-net/website/blob/main",
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
        },
        gtag: {
          trackingID: "G-854W8PEZ1Z",
          anonymizeIP: true,
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: "https://github.com/kmesh-net/website/blob/main",
          // Useful options to enforce blogging best practices
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
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
      // Replace with your project's social card
      image: "img/kmesh-social-card.png",
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },

      // ===== SEO metadata =====
      metadata: [
        {
          name: "description",
          content:
            "Kmesh is a high-performance, sidecarless service mesh dataplane based on eBPF and programmable kernel for cloud-native applications.",
        },
        {
          property: "og:type",
          content: "website",
        },
        {
          property: "og:site_name",
          content: "Kmesh",
        },
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
        {
          name: "twitter:site",
          content: "@Kmesh_net",
        },
        {
          name: "keywords",
          content:
            "Kmesh, service mesh, eBPF, dataplane, Kubernetes, sidecarless, cloud-native, CNCF, high-performance networking",
        },
        {
          name: "author",
          content: "Kmesh Community",
        },
        {
          name: "robots",
          content: "index, follow",
        },
      ],

      navbar: {
        title: "Kmesh",
        logo: {
          alt: "Kmesh",
          src: "img/favicons/favicon.ico",
        },
        items: [
          {
            type: "docSidebar",
            sidebarId: "tutorialSidebar",
            position: "left",
            label: "Documentation",
          },
          { to: "/blog", label: "Blog", position: "left" },
          { to: "/dashboard", label: "Dashboard", position: "left" },
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
            to: "https://app.slack.com/client/T08PSQ7BQ/C06BU2GB8NL",
            position: "right",
            className: "header-slack-link header-icon",
          },
          {
            type: "localeDropdown",
            position: "right",
          },
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
};

export default config;
