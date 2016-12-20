# Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
#
# To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
# or `fdescribe`). Remove the `f` to unfocus the block.

describe "Haskell grammar", ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage("haskell-grammar")

    runs ->
      grammar = atom.grammars.grammarForScopeName("source.hs")

  it "parses the grammar", ->
    expect(grammar).toBeTruthy()
    expect(grammar.scopeName).toBe "source.hs"

  describe "chars", ->
    it 'tokenizes general chars', ->
      chars = ['a', '0', '9', 'z', '@', '0', '"']

      for scope, char of chars
        {tokens} = grammar.tokenizeLine("'" + char + "'")
        expect(tokens[0].value).toEqual "'"
        expect(tokens[0].scopes).toEqual ["source.hs", 'constant.character.hs', "punctuation.definition.character.begin.hs"]
        expect(tokens[1].value).toEqual char
        expect(tokens[1].scopes).toEqual ["source.hs", 'constant.character.hs']
        expect(tokens[2].value).toEqual "'"
        expect(tokens[2].scopes).toEqual ["source.hs", 'constant.character.hs', "punctuation.definition.character.end.hs"]

    it 'tokenizes escape chars', ->
      escapeChars = ['\t', '\n', '\'']
      for scope, char of escapeChars
        {tokens} = grammar.tokenizeLine("'" + char + "'")
        expect(tokens[0].value).toEqual "'"
        expect(tokens[0].scopes).toEqual ["source.hs", 'constant.character.hs', "punctuation.definition.character.begin.hs"]
        expect(tokens[1].value).toEqual char
        expect(tokens[1].scopes).toEqual ["source.hs", 'constant.character.hs', 'constant.character.escape.hs']
        expect(tokens[2].value).toEqual "'"
        expect(tokens[2].scopes).toEqual ["source.hs", 'constant.character.hs', "punctuation.definition.character.end.hs"]

  describe "strings", ->
    it "tokenizes single-line strings", ->
      delimsByScope =
        "string.quoted.double.hs": '"'

      for scope, delim of delimsByScope
        {tokens} = grammar.tokenizeLine(delim + "x" + delim)
        expect(tokens[0].value).toEqual delim
        expect(tokens[0].scopes).toEqual ["source.hs", scope, "punctuation.definition.string.begin.hs"]
        expect(tokens[1].value).toEqual "x"
        expect(tokens[1].scopes).toEqual ["source.hs", scope]
        expect(tokens[2].value).toEqual delim
        expect(tokens[2].scopes).toEqual ["source.hs", scope, "punctuation.definition.string.end.hs"]

  describe "backtick function call", ->
    it "finds backtick function names", ->
      {tokens} = grammar.tokenizeLine("\`func\`")
      expect(tokens[0]).toEqual value: '`', scopes: ['source.hs', 'meta.method.hs']
      expect(tokens[1]).toEqual value: 'func', scopes: ['source.hs', 'meta.method.hs', 'variable.other.hs']
      expect(tokens[2]).toEqual value: '`', scopes: ['source.hs', 'meta.method.hs']

  describe "keywords", ->
    controlKeywords = ['case', 'of', 'in', 'where', 'if', 'then', 'else']

    for scope, keyword of controlKeywords
      it "tokenizes #{keyword} as a keyword", ->
        {tokens} = grammar.tokenizeLine(keyword)
        expect(tokens[0]).toEqual value: keyword, scopes: ['source.hs', 'keyword.control.hs']

  # describe "regular expressions", ->
  #   it "tokenizes regular expressions", ->
  #     {tokens} = grammar.tokenizeLine('/test/')
  #     expect(tokens[0]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
  #     expect(tokens[1]).toEqual value: 'test', scopes: ['source.js', 'string.regexp.js']
  #     expect(tokens[2]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']
  #
  #     {tokens} = grammar.tokenizeLine('foo + /test/')
  #     expect(tokens[0]).toEqual value: 'foo ', scopes: ['source.js']
  #     expect(tokens[1]).toEqual value: '+', scopes: ['source.js', 'keyword.operator.js']
  #     expect(tokens[2]).toEqual value: ' ', scopes: ['source.js', 'string.regexp.js']
  #     expect(tokens[3]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
  #     expect(tokens[4]).toEqual value: 'test', scopes: ['source.js', 'string.regexp.js']
  #     expect(tokens[5]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']
  #
  #   it "tokenizes regular expressions inside arrays", ->
  #     {tokens} = grammar.tokenizeLine('[/test/]')
  #     expect(tokens[0]).toEqual value: '[', scopes: ['source.js', 'meta.brace.square.js']
  #     expect(tokens[1]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
  #     expect(tokens[2]).toEqual value: 'test', scopes: ['source.js', 'string.regexp.js']
  #     expect(tokens[3]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']
  #     expect(tokens[4]).toEqual value: ']', scopes: ['source.js', 'meta.brace.square.js']
  #
  #     {tokens} = grammar.tokenizeLine('[1, /test/]')
  #     expect(tokens[0]).toEqual value: '[', scopes: ['source.js', 'meta.brace.square.js']
  #     expect(tokens[1]).toEqual value: '1', scopes: ['source.js', 'constant.numeric.js']
  #     expect(tokens[2]).toEqual value: ',', scopes: ['source.js', 'meta.delimiter.object.comma.js']
  #     expect(tokens[3]).toEqual value: ' ', scopes: ['source.js', 'string.regexp.js']
  #     expect(tokens[4]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
  #     expect(tokens[5]).toEqual value: 'test', scopes: ['source.js', 'string.regexp.js']
  #     expect(tokens[6]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']
  #     expect(tokens[7]).toEqual value: ']', scopes: ['source.js', 'meta.brace.square.js']
  #
  #     {tokens} = grammar.tokenizeLine('0x1D306')
  #     expect(tokens[0]).toEqual value: '0x1D306', scopes: ['source.js', 'constant.numeric.js']
  #
  #     {tokens} = grammar.tokenizeLine('0X1D306')
  #     expect(tokens[0]).toEqual value: '0X1D306', scopes: ['source.js', 'constant.numeric.js']
  #
  #     {tokens} = grammar.tokenizeLine('0b011101110111010001100110')
  #     expect(tokens[0]).toEqual value: '0b011101110111010001100110', scopes: ['source.js', 'constant.numeric.js']
  #
  #     {tokens} = grammar.tokenizeLine('0B011101110111010001100110')
  #     expect(tokens[0]).toEqual value: '0B011101110111010001100110', scopes: ['source.js', 'constant.numeric.js']
  #
  #     {tokens} = grammar.tokenizeLine('0o1411')
  #     expect(tokens[0]).toEqual value: '0o1411', scopes: ['source.js', 'constant.numeric.js']
  #
  #     {tokens} = grammar.tokenizeLine('0O1411')
  #     expect(tokens[0]).toEqual value: '0O1411', scopes: ['source.js', 'constant.numeric.js']

  describe "operators", ->
    # it "tokenizes void correctly", ->
    #   {tokens} = grammar.tokenizeLine('void')
    #   expect(tokens[0]).toEqual value: 'void', scopes: ['source.js', 'keyword.operator.js']

    it "tokenizes the / arithmetic operator when separated by newlines", ->
      lines = grammar.tokenizeLines """
        1
        / 2
      """

      expect(lines[0][0]).toEqual value: '1', scopes: ['source.hs', 'constant.numeric.hs']
      expect(lines[1][0]).toEqual value: '/ ', scopes: ['source.hs']
      expect(lines[1][1]).toEqual value: '2', scopes: ['source.hs', 'constant.numeric.hs']

  # describe "ES6 string templates", ->
  #   it "tokenizes them as strings", ->
  #     {tokens} = grammar.tokenizeLine('`hey ${name}`')
  #     expect(tokens[0]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.js', 'punctuation.definition.string.begin.js']
  #     expect(tokens[1]).toEqual value: 'hey ', scopes: ['source.js', 'string.quoted.template.js']
  #     expect(tokens[2]).toEqual value: '${', scopes: ['source.js', 'string.quoted.template.js', 'source.js.embedded.source', 'punctuation.section.embedded.js']
  #     expect(tokens[3]).toEqual value: 'name', scopes: ['source.js', 'string.quoted.template.js', 'source.js.embedded.source']
  #     expect(tokens[4]).toEqual value: '}', scopes: ['source.js', 'string.quoted.template.js', 'source.js.embedded.source', 'punctuation.section.embedded.js']
  #     expect(tokens[5]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.js', 'punctuation.definition.string.end.js']

  # describe "default: in a switch statement", ->
  #   it "tokenizes it as a keyword", ->
  #     {tokens} = grammar.tokenizeLine('default: ')
  #     expect(tokens[0]).toEqual value: 'default', scopes: ['source.js', 'keyword.control.js']

  # it "tokenizes comments in function params", ->
  #   {tokens} = grammar.tokenizeLine('foo: function (/**Bar*/bar){')
  #
  #   expect(tokens[4]).toEqual value: '(', scopes: ['source.js', 'meta.function.json.js', 'punctuation.definition.parameters.begin.js']
  #   expect(tokens[5]).toEqual value: '/**', scopes: ['source.js', 'meta.function.json.js', 'comment.block.documentation.js', 'punctuation.definition.comment.js']
  #   expect(tokens[6]).toEqual value: 'Bar', scopes: ['source.js', 'meta.function.json.js', 'comment.block.documentation.js']
  #   expect(tokens[7]).toEqual value: '*/', scopes: ['source.js', 'meta.function.json.js', 'comment.block.documentation.js', 'punctuation.definition.comment.js']
  #   expect(tokens[8]).toEqual value: 'bar', scopes: ['source.js', 'meta.function.json.js', 'variable.parameter.function.js']

  it "tokenizes {-  -} comments", ->
    {tokens} = grammar.tokenizeLine('{--}')

    expect(tokens[0]).toEqual value: '{-', scopes: ['source.hs', 'comment.block.hs', 'punctuation.definition.comment.hs']
    expect(tokens[1]).toEqual value: '-}', scopes: ['source.hs', 'comment.block.hs', 'punctuation.definition.comment.hs']

    {tokens} = grammar.tokenizeLine('{- foo -}')

    expect(tokens[0]).toEqual value: '{-', scopes: ['source.hs', 'comment.block.hs', 'punctuation.definition.comment.hs']
    expect(tokens[1]).toEqual value: ' foo ', scopes: ['source.hs', 'comment.block.hs']
    expect(tokens[2]).toEqual value: '-}', scopes: ['source.hs', 'comment.block.hs', 'punctuation.definition.comment.hs']

  # it "tokenizes /** */ comments", ->
  #   {tokens} = grammar.tokenizeLine('/***/')
  #
  #   expect(tokens[0]).toEqual value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.js']
  #   expect(tokens[1]).toEqual value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.js']
  #
  #   {tokens} = grammar.tokenizeLine('/** foo */')
  #
  #   expect(tokens[0]).toEqual value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.js']
  #   expect(tokens[1]).toEqual value: ' foo ', scopes: ['source.js', 'comment.block.documentation.js']
  #   expect(tokens[2]).toEqual value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.js']

  describe "ids", ->
    it 'handles var_ids', ->
      variableIds = ['a', 'c#', 'c90', 'laueou', 'uohcro\'390', 'coheruoeh\'CntoeuhCHR1neouhsS']

      for scope, id of variableIds
        {tokens} = grammar.tokenizeLine(id)
        expect(tokens[0]).toEqual value: id, scopes: ['source.hs', 'variable.other.hs']

    it 'handles type_ids', ->
      typeIds = ['Char', 'Data', 'List', 'Int#', 'Integral', 'Float', 'Date']

      for scope, id of typeIds
        {tokens} = grammar.tokenizeLine(id)
        expect(tokens[0]).toEqual value: id, scopes: ['source.hs', 'storage.type.hs']
