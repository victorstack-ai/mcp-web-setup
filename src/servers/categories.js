// Category metadata and mapping to server names.

export const categories = [
  {
    id: 'design',
    label: 'Design (Figma Desktop + Developer API)',
    servers: ['figma-desktop', 'figma-developer'],
  },
  {
    id: 'database',
    label: 'Database (MySQL)',
    servers: ['mysql'],
  },
  {
    id: 'browser',
    label: 'Browser / Testing (Playwright, Chrome DevTools, Browser Tools)',
    servers: ['playwright', 'chrome-devtools', 'browser-tools'],
  },
  {
    id: 'performance',
    label: 'Performance / SEO (Lighthouse, PageSpeed)',
    servers: ['lighthouse', 'pagespeed'],
  },
  {
    id: 'a11y',
    label: 'Accessibility (a11y)',
    servers: ['a11y'],
  },
  {
    id: 'css',
    label: 'CSS / Styling (CSS, Tailwind CSS)',
    servers: ['css', 'tailwindcss'],
  },
  {
    id: 'linting',
    label: 'Linting (ESLint)',
    servers: ['eslint'],
  },
  {
    id: 'images',
    label: 'Images (Image Optimizer)',
    servers: ['image-optimizer'],
  },
  {
    id: 'components',
    label: 'Components (Storybook)',
    servers: ['storybook'],
  },
  {
    id: 'source-control',
    label: 'Source Control (GitHub)',
    servers: ['github'],
  },
  {
    id: 'utilities',
    label: 'Utilities (Sequential Thinking)',
    servers: ['sequential-thinking'],
  },
  {
    id: 'project',
    label: 'Project Tools (Atlassian, Bitbucket, GTM) - per workspace',
    servers: ['atlassian', 'bitbucket', 'gtm'],
  },
];

export function getCategory(id) {
  return categories.find((c) => c.id === id);
}
