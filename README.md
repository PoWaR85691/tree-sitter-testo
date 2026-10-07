# tree-sitter-testo

Грамматика [tree-sitter](https://tree-sitter.github.io/) для языка **Testo**
(файлы `*.testo`).

Это вспомогательный репозиторий. Zed подключает грамматику по git-ссылке, а не
из бандла расширения, поэтому она лежит отдельно от самого расширения
[`testo-helper-zed`](https://github.com/PoWaR85691/testo-helper-zed).

> Если вы просто хотите пользоваться Testo в Zed — этот репозиторий вам не
> нужен. Устанавливайте расширение
> [`testo-helper-zed`](https://github.com/PoWaR85691/testo-helper-zed).

## Что здесь есть

```
tree-sitter-testo/
├── grammar.js    # описание грамматики
├── package.json
└── src/          # сгенерированный парсер (parser.c, node-types.json, ...)
```

Запросы подсветки, скобок и отступов (`highlights.scm`, `brackets.scm`,
`indents.scm`) лежат **в расширении**, в каталоге `languages/testo/` — оттуда их
читает Zed, а не из этого репозитория.

## Как расширение подключает грамматику

В файле `testo-helper-zed/extension.toml`:

```toml
[grammars.testo]
repository = "https://github.com/PoWaR85691/tree-sitter-testo"
rev = "<commit sha>"
```

`rev` — коммит, в котором уже есть сгенерированный `src/`.

## Сборка

Нужен [tree-sitter CLI](https://tree-sitter.github.io/) (`cargo install
tree-sitter-cli` или `npm i -g tree-sitter-cli`):

```sh
tree-sitter generate      # создаёт src/parser.c и src/node-types.json
```

Сгенерированный каталог `src/` нужно закоммитить: Zed компилирует парсер сам и
команду `tree-sitter generate` за вас не запускает.

## Тесты

Если добавить фикстуры в `test/corpus/*.txt`, их можно прогнать так:

```sh
tree-sitter test
```
