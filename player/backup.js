const fs = require('fs').promises;
const path = require('path');
const readline = require('readline-sync');

const backupsDir = path.join(__dirname, 'backups');
const sourceFile = path.join(__dirname, 'index.js');

async function createBackup() {
  try {
    await fs.mkdir(backupsDir, { recursive: true });
    const date = new Date();
    const timestamp = date.toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const backupFileName = `index.backup.${timestamp}.js`;
    const backupFilePath = path.join(backupsDir, backupFileName);

    const content = await fs.readFile(sourceFile, 'utf-8');
    await fs.writeFile(backupFilePath, content, 'utf-8');
    console.log(`Backup created successfully: ${backupFileName}`);
  } catch (error) {
    console.error('Error creating backup:', error);
  }
}

async function restoreBackup() {
    try {
        const backupFiles = await fs.readdir(backupsDir);
        if (backupFiles.length === 0) {
            console.log('No backups found.');
            return;
        }

        console.log('Available backups:');
        backupFiles.forEach((file, index) => {
            console.log(`${index + 1}: ${file}`);
        });

        const choice = readline.question('Enter the number of the backup to restore: ');
        const selectedIndex = parseInt(choice) - 1;

        if (selectedIndex >= 0 && selectedIndex < backupFiles.length) {
            const selectedBackup = backupFiles[selectedIndex];
            const backupFilePath = path.join(backupsDir, selectedBackup);

            const backupContent = await fs.readFile(backupFilePath, 'utf-8');
            await fs.writeFile(sourceFile, backupContent, 'utf-8');
            console.log(`Restored from ${selectedBackup}`);
        } else {
            console.log('Invalid selection.');
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('No backups found. Please create a backup first using "node backup.js create"');
        } else {
            console.error('Error restoring backup:', error);
        }
    }
}


async function main() {
    const command = process.argv[2];

    if (command === 'create') {
        await createBackup();
    } else if (command === 'restore') {
        await restoreBackup();
    }
    else {
        console.log('Usage: node backup.js <command>');
        console.log('Commands:');
        console.log('  create  - Creates a new backup of index.js');
        console.log('  restore - Restores index.js from a backup');
    }
}

main();
