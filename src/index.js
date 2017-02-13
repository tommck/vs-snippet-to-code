/**
 * Take a set of snippet files (folder? glob?)
 * convert the format from VS style to VS Code
 */

const glob = require('glob');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
const Bluebird = require('bluebird');

const convertSnippet = require('./convert-snippet');

const argv = yargs
    .usage('Usage: $0 -s [snippet files] -o [output file]')
    .boolean('d')
    .option('s', {
        alias: 'snippets'
    })
    .option('o', {
        alias: 'output'
    })
    .demandOption(['s', 'o'])
    .example("$0 -s '*.snippet' -o './allSnippets.json'")
    .help()
    .argv;

Bluebird
    .fromCallback(cb => glob(argv.s, cb))
    .map(file =>
        Bluebird
            .fromCallback(cb => fs.readFile(file, cb))
            .then(data => convertSnippet(data))
    )
    .then(results => {
        console.log(`${results.length} files to combine`);
        return Object.assign({}, ...results);
    }).then(allSnippets => {
        console.log(`Writing to ${argv.o}`);
        return Bluebird.fromCallback(cb => fs.writeFile(argv.o, JSON.stringify(allSnippets, null, 2), cb));
    })
    .catch(err => {
        console.error(err);
    });