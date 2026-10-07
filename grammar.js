/**
 * Tree-sitter grammar for the Testo language (.testo).
 *
 * The design is intentionally permissive: Testo is a large, command oriented
 * language and highlighting only needs a flat token stream plus nested
 * brace blocks. Statements are *not* parsed into a rich AST here — that keeps
 * the grammar small and, more importantly, conflict free.
 *
 * Blocks ({ ... }) are the only structural construct: they nest, which is
 * enough for bracket matching (brackets.scm) and auto indentation
 * (indents.scm).
 */
module.exports = grammar({
  name: 'testo',

  // Whitespace only. Comments are explicit tokens so that they show up in the
  // tree in a predictable place (and can be highlighted by highlights.scm).
  extras: $ => [/\s/],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($._element),

    // A brace block. `_element` is allowed inside so braces nest arbitrarily.
    block: $ => seq('{', repeat($._element), '}'),

    _element: $ => choice(
      $.comment,
      $.multiline_string,
      $.string,
      $.time_interval,
      $.size_specifier,
      $.number,
      $.boolean,
      $.variable,
      $.control_keyword,
      $.action_keyword,
      $.select_keyword,
      $.comparison_keyword,
      $.logic_keyword,
      $.operator,
      $.punctuation,
      $.identifier,
      $.block,
    ),

    // `#` line comments and `/* ... */` block comments.
    comment: $ => token(choice(
      seq('#', /.*/),
      /\/\*[^*]*\*+([^/*][^*]*\*+)*\//,
    )),

    // Triple quoted strings (""" ... """).
    multiline_string: $ => seq(
      '"""',
      repeat(choice(
        $.escape_sequence,
        $.interpolation,
        /[^"\\$]+/,
        '"',
        '$',
      )),
      '"""',
    ),

    // Double quoted strings. `${PARAM}` and `$<VAR>` are interpolated.
    string: $ => seq(
      '"',
      repeat(choice(
        $.escape_sequence,
        $.interpolation,
        /[^"\\$]+/,
        '$',
      )),
      '"',
    ),

    escape_sequence: $ => token(/\\./),

    interpolation: $ => choice(
      seq('${', $.identifier, '}'),
      seq('$<', $.identifier, '>'),
    ),

    // A `$<VAR>` / `${VAR}` reference outside of a string.
    variable: $ => choice(
      seq('${', $.identifier, '}'),
      seq('$<', $.identifier, '>'),
    ),

    boolean: $ => choice('true', 'false'),

    number: $ => /\d+(\.\d+)?/,

    // NOTE: tree-sitter's regex engine does not support assertions (\b, ^, $),
    // so the unit suffix is matched without a word boundary. The lexer still
    // prefers these tokens over `number` because it always takes the longest
    // match.
    time_interval: $ => /\d+(\.\d+)?(ms|s|m|h)/,

    size_specifier: $ => /\d+(\.\d+)?[KkMmGg]b/,

    // Control flow, declarations and includes.
    control_keyword: $ => choice(
      'if', 'else', 'for', 'while', 'do', 'switch',
      'break', 'continue',
      'include', 'test', 'macro', 'param', 'image',
      'machine', 'flash', 'network',
    ),

    // Actions / built in commands.
    action_keyword: $ => choice(
      'wait', 'check', 'press', 'type', 'sleep', 'mouse', 'touch', 'exec',
      'print', 'abort', 'screenshot', 'repl', 'remotefile', 'ram', 'cpu',
      'battery', 'charging', 'lid', 'plug', 'unplug', 'start', 'stop',
      'shutdown', 'snapshot', 'copyto', 'copyfrom', 'hold', 'release', 'step',
      'timeout', 'interval', 'scroll', 'over', 'scale', 'with', 'as', 'expect',
      'sizelimit',
    ),

    // Select expressions: img / imgtag / ui / js
    select_keyword: $ => choice('img', 'imgtag', 'ui', 'js'),

    // Comparison operators.
    comparison_keyword: $ => choice(
      'EQUAL', 'LESS', 'GREATER',
      'STREQUAL', 'STRMATCH', 'STRGREATER', 'STRLESS',
      'RANGE', 'IN', 'DEFINED',
    ),

    // Boolean / predicate operators.
    logic_keyword: $ => choice('NOT', 'AND', 'OR'),

    operator: $ => choice(
      '&&', '||', '!', '=', '+', '-', '*', '/', '%', '<', '>', '|', '&', '^',
    ),

    punctuation: $ => choice('(', ')', '[', ']', ',', ';', '.', ':'),

    identifier: $ => /[A-Za-z_][A-Za-z0-9_]*/,
  },
});
