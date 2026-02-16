import { confirm, input, password } from '@inquirer/prompts';
import chalk from 'chalk';

// Multi-account workspace setup.
// Returns an array of { dir, credentials: { serverName: { KEY: val } } }
export async function collectWorkspaces(projectServers) {
  const hasProject = projectServers.length > 0;
  if (!hasProject) return [];

  console.log('');
  const wantsMultiple = await confirm({
    message: 'Do you have multiple workspaces with different Bitbucket/Atlassian accounts?',
    default: false,
  });

  if (!wantsMultiple) {
    const dir = await input({
      message: 'Project directory for workspace configs (e.g. ~/Documents/work/client):',
    });
    if (!dir) return [];

    const creds = await collectWorkspaceCredentials(projectServers, 'this workspace');
    return [{ dir: expandHome(dir), credentials: creds }];
  }

  console.log('');
  console.log(chalk.dim('  Add workspaces one at a time. Enter an empty path to finish.'));

  const workspaces = [];
  let count = 1;
  while (true) {
    console.log('');
    const dir = await input({
      message: `Workspace ${count} directory (empty to finish):`,
    });
    if (!dir) break;

    const label = dir.split('/').pop() || `workspace ${count}`;
    const creds = await collectWorkspaceCredentials(projectServers, label);
    workspaces.push({ dir: expandHome(dir), credentials: creds });
    count++;
  }
  return workspaces;
}

async function collectWorkspaceCredentials(projectServers, label) {
  const serversWithCreds = projectServers.filter((s) => s.credentials.length > 0);
  const creds = {};
  for (const server of serversWithCreds) {
    console.log(chalk.dim(`  Credentials for ${server.name} (${label}):`));
    const serverCreds = {};
    for (const cred of server.credentials) {
      const promptFn = cred.secret ? password : input;
      const opts = { message: `  ${cred.label}:` };
      if (cred.secret) opts.mask = '*';
      const val = await promptFn(opts);
      serverCreds[cred.key] = val || cred.default || '';
    }
    creds[server.name] = serverCreds;
  }
  return creds;
}

function expandHome(p) {
  if (p.startsWith('~/')) {
    return p.replace('~', process.env.HOME || '~');
  }
  return p;
}
