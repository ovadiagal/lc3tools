/**
 * Author: Toby Salusky
 *
 * Description: Some relatively simple autocomplete suggestions for LC3 assembly! :D
 *
 * Autocomplete Options (store/modules/Settings.js)
 * 'none': no autocompletion
 * 'basic': builtin registers, instructions, aliases, pseudo ops
 * 'full': `basic` functionality plus best-effort label suggestion (more document processing on keystroke required)
 *
 * Issues/Areas for improvement:
 * > with autocomplete='full', string contents will be suggested as labels (really they should be ignored)
 * > do 'full' autocompletion document parsing more efficiently? (not sure how bad of an issue this currently is?)
 *
 */

const regNames = [0, 1, 2, 3, 4, 5, 6, 7].map(num => `R${num}`);
const instrs = [
  "ADD",
  "AND",
  "NOT",
  "BR", // though combinations like BRnzp exist, we only suggest BR, and simply ignore other forms from being captured as labels
  "JMP",
  "JSR",
  "JSRR",
  "LD",
  "LDI",
  "LDR",
  "LEA",
  "ST",
  "STI",
  "STR",
  "TRAP"
];
const instrAliases = ["HALT", "PUTS", "GETC", "OUT", "IN", "RET"];
const pseudoOps = [".orig", ".end", ".fill", ".blkw", ".stringz"];
const keywordSet = new Set(
  [...instrs, ...instrAliases, ...regNames, ...pseudoOps].map(s =>
    s.toLowerCase()
  )
);

function generateCompletions(mode, doc, pos, prefix) {
    if (mode === "none") {
      return [];
    }

    // typing a number
    if (/^\d/.test(prefix)) {
      return [];
    }

    // in a comment
    const currentLine = doc.getLine(pos.row);
    const currentLineUpToCursor = currentLine.substring(0, pos.column - 1);
    if (currentLineUpToCursor.includes(";")) {
      return [];
    }

    let labelsReferenced = new Set();

    if (mode == "full") {
      const documentLines = doc.getAllLines();
      console.log(documentLines)
      for (const line of documentLines) {
        const nonCommentLine = line.includes(";")
          ? line.substring(0, line.indexOf(";"))
          : line;

        const matches = nonCommentLine; //.match(/\w?[\d\w.]*/g);
        if (matches) {
          for (const match of matches) {
            if (match === prefix) {
              continue;
            } // do not complete with what is currently being typed!
            const lowerMatch = match.toLowerCase();
            if (/^x[a-f\d]+$/.test(lowerMatch)) {
              continue;
            } // hex, not label
            if (/^\d+$/.test(lowerMatch)) {
              continue;
            } // number, not label
            if (/^brn?z?p?$/.test(lowerMatch)) {
              continue;
            } // BR, not label
            if (keywordSet.has(lowerMatch)) {
              continue;
            } // existing keyword, not label
            labelsReferenced.add(match);
          }
        }
      }
    }

    const completions = [
      ...regNames.map(name => ({
        value: name,
        score: 11,
        meta: "register"
      })),
      ...instrs.map(name => ({
        value: name,
        score: 10,
        meta: "instruction"
      })),
      ...instrAliases.map(name => ({
        value: name,
        score: 10,
        meta: "alias"
      })),
      ...pseudoOps.map(name => ({
        value: name,
        score: 10,
        meta: "pseudo-op"
      })),
      ...[...labelsReferenced].map(name => ({
        value: name,
        score: 5,
        meta: "label"
      }))
    ];

    let modifiedCompletions = [];
    for (const suggestion of completions) {
      let modifiedSuggestion = suggestion;
      //console.log(modifiedSuggestion);
      if (currentLineUpToCursor.trim() == "") {
        if (modifiedSuggestion.meta == "register") {
          continue;
        }
      }
      modifiedCompletions.push(modifiedSuggestion);
    }
    return modifiedCompletions;

  //   let modifiedCompletions = [];

  //   // Based on the format of instructions, we can suggest either registers or labels
  //   for (const suggestion in completions) {
  //     console.log(suggestion);
  //     // If we are at the start of a line, don't suggest register names
  //     if (currentLineUpToCursor.trim() == "") {
  //       if (regNames.includes(suggestion.value.toUpperCase())) {
  //         continue;
  //       }
  //     }

  //     // If we are not at the start of the line, don't suggest instructions, aliases, or pseudo-ops.
  //     if (currentLineUpToCursor.trim() != "") {
  //       if (instrs.includes(suggestion.value.toUpperCase())) {
  //         continue;
  //       }
  //       if (instrAliases.includes(suggestion.value.toUpperCase())) {
  //         continue;
  //       }
  //       if (pseudoOps.includes(suggestion.value.toLowerCase())) {
  //         continue;
  //       }
  //     }

  //     // Make some modifications based on the context of the match.
  //     let modifedSuggestion = suggestion;
  //     // If the completion is an instruction (except for BR), add a space
  //     if (instrs.has(modifedSuggestion.value.toUpperCase() && match.toUpperCase() !== "BR")) {
  //       modifiedMatch.value += " ";
  //     }

  //     // if the suggestion is a register, add commas if it the first or second register in an instruction
  //     if (regNames.has(modifedSuggestion.value.toUpperCase())) {
  //       if (/^ADD$/.test(currentLineUpToCursor.trim())) {
  //         modifiedMatch.value += ", ";
  //       }
  //       if (/^ADD R\d$/.test(currentLineUpToCursor.trim())) {
  //         modifiedMatch.value += ", ";
  //       }
  //       const instr = currentLineUpToCursor.split(" ")[0].toUpperCase();
  //       if (instrs.includes(instr)) {
  //         if (instr == "ADD" || instr == "AND") {
  //           const regCount = currentLineUpToCursor.split(",").length;
  //           if (regCount == 1) {
  //             modifiedMatch += ", ";
  //           }
  //         }
  //       }
  //     }
      
  //     modifiedCompletions.add(suggestion);
  //   }


	// return modifiedCompletions;
}

// modeGetter => returns current autocomplete setting
export const CreateLc3CompletionProvider = (modeGetter) => ({
  getCompletions: (_editor, session, pos, prefix, callback) => {
	  callback(null, generateCompletions(modeGetter(), session.doc, pos, prefix));
  }
});
