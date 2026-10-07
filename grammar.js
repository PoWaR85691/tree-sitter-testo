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
 *
 * The token set follows the Testo language specification (see the upstream
 * documentation: top level declarations `machine`/`flash`/`network`/`param`/
 * `image`/`test`/`macro`/`include`, the literals in "Базовые конструкции
 * языка" and the action/condition/loop syntaex in the "Спецификация").
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
      $.angle_specifier,
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
        '$${',
        /[^"\\$]+/,
        '"',
        '$',
      )),
      '"""',
    ),

    // Double quoted strings. `${PARAM}` and `$<VAR>` are interpolated,
    // `$${` is an escaped literal `${` (see "Обращение к параметрам").
    string: $ => seq(
      '"',
      repeat(choice(
        $.escape_sequence,
        $.interpolation,
        '$${',
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
    //
    // Time (`ms`/`s`/`m`/`h`), memory (`Kb`/`Mb`/`Gb`) and angle (`deg`)
    // specifiers, see "Базовые конструкции языка".
    time_interval: $ => /\d+(\.\d+)?(ms|s|m|h)/,

    size_specifier: $ => /\d+(\.\d+)?[KkMmGg]b/,

    angle_specifier: $ => /\d+(\.\d+)?deg/,

    // Declarations and control flow.
    control_keyword: $ => choice(
      // Declarations.
      'machine', 'flash', 'network', 'param', 'image', 'test', 'macro',
      'include',
      // Conditions and loops.
      'if', 'else', 'for', 'IN', 'RANGE', 'break', 'continue',
    ),

    // Actions / built in commands, including the sub-commands of `mouse`,
    // `touch`, `ram`, `cpu`, `snapshot`, `plug`/`unplug` and the trailing
    // modifiers (`timeout`, `interval`, `over`, `scale`, `with`, ...).
    action_keyword: $ => choice(
      // VM lifecycle.
      'start', 'stop', 'shutdown', 'snapshot', 'repl', 'screenshot',
      // Keyboard.
      'press', 'hold', 'release', 'type',
      // Mouse.
      'mouse', 'move', 'click', 'lclick', 'rclick', 'dclick', 'lbtn', 'rbtn',
      'wheel-up', 'wheel-down',
      // Touch.
      'touch', 'tap', 'doubletap', 'longpress', 'swipe', 'drag', 'pinchout',
      'pinchin', 'twofingertap', 'twofingerswipe', 'rotate',
      // Waiting and timing.
      'wait', 'check', 'sleep', 'timeout', 'interval',
      // Devices.
      'plug', 'unplug', 'dvd', 'nic', 'link', 'hostdev', 'usb',
      // Files and guest agent.
      'exec', 'copyto', 'copyfrom', 'remotefile',
      // VM resources.
      'ram', 'cpu', 'battery', 'charging', 'lid', 'add', 'remove',
      'create', 'revert',
      // Output.
      'print', 'abort', 'step',
      // Modifiers.
      'with', 'as', 'expect', 'sizelimit', 'over', 'scale', 'scroll',
      'autoswitch', 'nocheck', 'active-window',
    ),

    // Select expressions: img / imgtag / ui / js
    select_keyword: $ => choice('img', 'imgtag', 'ui', 'js'),

    // Comparison operators.
    comparison_keyword: $ => choice(
      'EQUAL', 'LESS', 'GREATER',
      'STREQUAL', 'STRMATCH', 'STRGREATER', 'STRLESS',
      'DEFINED', 'EXIST',
    ),

    // Boolean / predicate operators.
    logic_keyword: $ => choice('NOT', 'AND', 'OR'),

    operator: $ => choice(
      '&&', '||', '!', '=', '+', '-', '*', '/', '%', '<', '>', '|', '&', '^',
    ),

    punctuation: $ => choice('(', ')', '[', ']', ',', ';', '.', ':'),

    // Identifiers start with a latin letter or `_`; subsequent characters may
    // also be digits or `-` (dash), e.g. `And_even-this233-`.
    identifier: $ => /[A-Za-z_][A-Za-z0-9_-]*/,
  },
});
