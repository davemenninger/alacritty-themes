#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const prompts = require('prompts');
const temp = require('temp').track();

const { themesFolder } = require('../src/helpers');

const {
  applyTheme,
  createConfigFile,
  getAlacrittyConfig,
  getCurrentTheme,
} = require('../index');

const themes = fs.readdirSync(themesFolder()).map((f) => f.replace('.yml', ''));

function main() {
  const argumentsExist = process.argv.length > 2;

  if (argumentsExist) {
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      console.log('Usage: \n\talacritty-themes [options] [theme-name]\n');
      console.log(
        'Description: \n\tThemes candy for alacritty A cross-platform GPU-accelerated terminal emulator\n'
      );
      console.log('Options: \n\t--help, -h\tshows this help message and exit');
      console.log('\t--create, -C\tcreates a new config file');
      console.log('\t--current, -c\tshows applied theme name');
      console.log('\t--list, -l\tlists all available themes');
    } else if (
      process.argv.includes('--create') ||
      process.argv.includes('-C')
    ) {
      createConfigFile();
    } else if (
      process.argv.includes('--current') ||
      process.argv.includes('-c')
    ) {
      console.log(getCurrentTheme());
    } else if (process.argv.includes('--list') || process.argv.includes('-l')) {
      themes.map((theme, index) => {
        console.log(index, theme);
      });
    } else {
      // the 3rd arg is theme name
      applyTheme(process.argv[2]);
    }
  } else {
    // Copy original config to new file
    //
    const tempDir = temp.mkdirSync('alacritty-themes');
    const backupPath = path.join(tempDir, 'alacritty.yml');

    const ymlPath = getAlacrittyConfig();
    fs.copyFile(ymlPath, backupPath, (err) => {
      if (err) throw err;
    });

    (async () => {
      const response = await prompts({
        type: 'autocomplete',
        name: 'theme',
        message: 'Select a theme',
        choices: themes.map((t) => {
          return {
            title: t,
            value: t,
          };
        }),
        onState: (state) => {
          state.value && applyTheme(state.value, true); // set preview true
        },
      });

      if (response.theme) {
        applyTheme(response.theme);
      } else {
        // Restore original config
        fs.readFile(backupPath, 'utf8', (err, data) => {
          fs.writeFile(ymlPath, data, 'utf8', (err2) => {
            if (err2) throw err2;
          });
        });
      }
    })();
  }
}

main();
