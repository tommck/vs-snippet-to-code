const path = require('path');
const parseString = require('xml2js').parseString;

const DEBUG = 0;

function convertSnippet(snippetXml) {
    return new Promise((resolve, reject) => {
        parseString(snippetXml, (err, result) => {
            if (err) {
                reject(err);
                return;
            }

            // only 1 of each of these things.
            const header = result.CodeSnippet.Header[0];
            const author = header.Author[0];
            const description = header.Description[0];
            const title = header.Title[0];
            const shortcut = header.Shortcut[0];

            log('Header Data: ', { author, description, title, shortcut });

            if (result.CodeSnippet.Snippet.length > 1) {
                reject('Unable to process more than 1 snippet per file');
                return;
            }
            const snippetObject = result.CodeSnippet.Snippet[0];
            const code = snippetObject.Code[0];
            const language = code.$.Language;

            const defaultValues = getDefaults(snippetObject);
            const linesOfCode = convertReferences(code._, defaultValues).trim().split(/\r?\n/);

            log('LINES:', linesOfCode)


            // TODO: abstract output for pasting into language.snippets and for creating packages.

            const codeSnippet = {
                prefix: shortcut,
                body: linesOfCode,
                description: description
            };

            let returnVal = {};
            returnVal[title] = codeSnippet;

            resolve(returnVal);
        });
    });

    function convertReferences(studioFormatSnippet, defaults) {
        let result = studioFormatSnippet.toString().replace('\$end\$', '$0');

        // search for $xx$ combos
        var regex = new RegExp(/\$(\w*?)\$/, 'g');

        let match;
        while (match = regex.exec(result)) {

            var text = match[1];

            var currentText = `\$${text}\$`;
            var defaultValue = defaults[text];

            let newText;
            if (defaultValue) {
                newText = `\$\{${text}:${defaultValue}\}`;
            }
            else {
                newText = `\$${text}`;
            }

            log(`${currentText} => ${newText}`);
            result = result.replace(currentText, newText);
        }
        return result;
    }

    function getDefaults(snippetObject) {
        let hash = {};
        if (snippetObject.Declarations) {
            snippetObject.Declarations
                .filter(decl => decl.Literal)
                .forEach(decl => {
                    decl.Literal.forEach(lit => {
                        log('Lit: ', lit);
                        hash[lit.ID[0]] = lit.Default[0];
                    });
                });
        }
        return hash;
    }

    function log(...args) {
        if (DEBUG) {
            console.log.apply(console, args);
        }
    }
}

module.exports = convertSnippet;