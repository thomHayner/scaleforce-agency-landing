import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Welcome',
      href: getPermalink('/#welcome'),
    },
    {
      text: 'Services',
      href: getPermalink('/#services'),
    },
    {
      text: 'Features',
      href: getPermalink('/#features'),
    },
    {
      text: 'FAQ',
      href: getPermalink('/#faq'),
    },
    {
      text: 'Contact',
      href: getPermalink('/#contact'),
    },
    {
      text: 'Blog',
      links: [
        {
          text: 'All Posts',
          href: getBlogPermalink(),
        },
        {
          text: 'Resources',
          href: getPermalink('resources', 'category'),
        },
        {
          text: 'Use Cases',
          href: getPermalink('use-cases', 'category'),
        },
        {
          text: 'Claude Skills',
          href: getPermalink('claude-skills', 'category'),
        },
    //     {
    //       text: 'Tags',
    //       href: getPermalink('astro', 'tag'),
    //     },
    //     {
    //       text: 'Article',
    //       href: getPermalink('get-started-website-with-astro-tailwind-css', 'post'),
    //     },
    //     {
    //       text: 'Article (with MDX)',
    //       href: getPermalink('markdown-elements-demo-post', 'post'),
    //     },
      ],
    },
  ],
  actions: [{ text: 'Book a call', href: getPermalink('/#contact') }],
};

export const footerData = {
  links: [
    {
      title: 'Product',
      links: [
        { text: 'Services', href: getPermalink('/#services') },
        { text: 'Features', href: getPermalink('/#features') },
        { text: 'FAQ', href: getPermalink('/#faq') },
      ],
    },
    {
        title: 'Blog',
      links: [
        { text: 'List', href: getPermalink('/') },
        { text: 'Categories', href: getPermalink('/') },
        { text: 'Tags', href: getPermalink('/') },
      ],
    },
    {
      title: 'Company',
      links: [
        { text: 'Locations', href: '#locations' },
        { text: 'Careers', href: '/' },
        { text: 'Press', href: '/' },
      ],
    },
    // {
    //     title: 'Support',
    //   links: [
    //     { text: 'Docs', href: getPermalink('/') },
    //     { text: 'Status', href: getPermalink('/') },
    //   ],
    // },
    {
      title: 'Contact',
      links: [
        { text: 'Phone', href: getPermalink('/#contact') },
        { text: 'Email', href: getPermalink('/#contact') },
        { text: 'Chat', href: getPermalink('/#contact') },
        { text: 'Video', href: getPermalink('/#calendly') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    // { ariaLabel: 'X', icon: 'tabler:brand-x', href: '#' },
    // { ariaLabel: 'Instagram', icon: 'tabler:brand-instagram', href: '#' },
    // { ariaLabel: 'Facebook', icon: 'tabler:brand-facebook', href: '#' },
    // { ariaLabel: 'YouTube', icon: 'tabler:brand-youtube', href: '#' },
    { 
      ariaLabel: 'LinkedIn',
      icon: 'tabler:brand-linkedin',
      href: 'https://www.linkedin.com/company/scaleforce-agency',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    { 
      ariaLabel: 'RSS',
      icon: 'tabler:rss',
      href: getAsset('/rss.xml'),
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    { 
      ariaLabel: 'Github',
      icon: 'tabler:brand-github',
      href: 'https://github.com/ScaleForceAgency',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  ],
  footNote: `
    Made by <a class="text-blue-600 underline dark:text-muted" href="https://scaleforce.agency/"> ScaleForce</a> · All rights reserved.
  `,
};
