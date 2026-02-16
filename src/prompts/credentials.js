import { input, password } from '@inquirer/prompts';
import chalk from 'chalk';

// Collect credentials for all servers that need them.
// Returns { serverName: { KEY: value, ... }, ... }
export async function collectCredentials(selectedServers) {
  const serversWithCreds = selectedServers.filter((s) => s.credentials.length > 0);
  if (serversWithCreds.length === 0) return {};

  console.log('');
  console.log(chalk.dim('  Enter credentials below. Press Enter to skip (uses placeholder).'));

  const allCreds = {};
  for (const server of serversWithCreds) {
    console.log('');
    console.log(chalk.bold(`  ${server.name}`));
    const creds = {};
    for (const cred of server.credentials) {
      const defaultVal = cred.default || '';
      const promptFn = cred.secret ? password : input;
      const promptOpts = {
        message: `${cred.label}:`,
        default: defaultVal || undefined,
      };
      if (cred.secret) {
        promptOpts.mask = '*';
      }
      const val = await promptFn(promptOpts);
      creds[cred.key] = val || defaultVal;
    }
    allCreds[server.name] = creds;
  }
  return allCreds;
}
