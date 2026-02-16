import { confirm, select, input } from '@inquirer/prompts';
import chalk from 'chalk';

// CMS template setup for WordPress/Drupal via Lando.
// Returns an array of { dir, cms, mysqlConfig }
export async function collectCMSTemplates() {
  const wants = await confirm({
    message: 'Do you want to add CMS project templates (WordPress/Drupal via Lando)?',
    default: false,
  });
  if (!wants) return [];

  console.log('');
  console.log(chalk.dim('  Add CMS projects one at a time. Enter an empty path to finish.'));

  const templates = [];
  let count = 1;
  while (true) {
    console.log('');
    const dir = await input({
      message: `CMS project ${count} directory (empty to finish):`,
    });
    if (!dir) break;

    const cms = await select({
      message: 'CMS type:',
      choices: [
        { name: 'WordPress (Lando)', value: 'wordpress' },
        { name: 'Drupal (Lando)', value: 'drupal' },
      ],
    });

    const dbName = await input({
      message: 'Lando database name:',
      default: cms === 'wordpress' ? 'wordpress' : 'drupal',
    });

    templates.push({
      dir: expandHome(dir),
      cms,
      mysqlConfig: {
        MYSQL_HOST: '127.0.0.1',
        // Lando typically maps database to a high port; user can change later
        MYSQL_PORT: '3306',
        MYSQL_USER: cms === 'wordpress' ? 'wordpress' : 'drupal',
        MYSQL_PASS: cms === 'wordpress' ? 'wordpress' : 'drupal',
        MYSQL_DB: dbName,
        ALLOW_INSERT_OPERATION: 'false',
        ALLOW_UPDATE_OPERATION: 'false',
        ALLOW_DELETE_OPERATION: 'false',
      },
    });
    count++;
  }
  return templates;
}

function expandHome(p) {
  if (p.startsWith('~/')) {
    return p.replace('~', process.env.HOME || '~');
  }
  return p;
}
