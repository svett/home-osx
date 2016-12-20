describe "Swift Grammar", ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage("language-swift")

    runs ->
      grammar = atom.grammars.grammarForScopeName("source.swift")

  it "parses the grammar", ->
    expect(grammar).toBeTruthy()
    expect(grammar.scopeName).toBe "source.swift"

  it "tokenizes classes", ->
    {tokens} = grammar.tokenizeLine "class AppDelegate: UIResponder, UIApplicationDelegate {}"

    expect(tokens[0]).toEqual value: "class", scopes: ["source.swift", "keyword.declaration.swift"]
    expect(tokens[1]).toEqual value: " AppDelegate: UIResponder, UIApplicationDelegate {}", scopes: ["source.swift"]

    {tokens} = grammar.tokenizeLine("class ViewController: UIViewController {}")
    expect(tokens[0]).toEqual value: "class", scopes: ["source.swift", "keyword.declaration.swift"]
    expect(tokens[1]).toEqual value: " ViewController: UIViewController {}", scopes: ["source.swift"]

  it "tokenizes functions", ->
    {tokens} = grammar.tokenizeLine """
      func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
        return true
      }
    """

    expect(tokens[0]).toEqual value: "func", scopes: ["source.swift", "meta.function.swift", "storage.type.function.swift" ]
    expect(tokens[2]).toEqual value: "application", scopes: ["source.swift", "meta.function.swift", "entity.name.function.swift" ]
    expect(tokens[3]).toEqual value: "(", scopes: [ "source.swift", "meta.function.swift", "punctuation.definition.parameters.begin.swift" ]
    expect(tokens[4]).toEqual value: "_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?", scopes: ["source.swift", "meta.function.swift"]
    expect(tokens[5]).toEqual value: ")", scopes: [ "source.swift", "meta.function.swift", "punctuation.definition.parameters.end.swift" ]
    expect(tokens[6]).toEqual value: " ", scopes: ["source.swift", "meta.function.swift"]
    expect(tokens[7]).toEqual value: "->", scopes: ["source.swift", "meta.function.swift", "meta.return-type.swift", "punctuation.function.swift"]
    expect(tokens[8]).toEqual value: " ", scopes: ["source.swift", "meta.function.swift", "meta.return-type.swift"]
    expect(tokens[9]).toEqual value: "Bool", scopes: ["source.swift", "meta.function.swift", "meta.return-type.swift", "entity.name.type.class.swift"]
    expect(tokens[10]).toEqual value: " ", scopes: ["source.swift", "meta.function.swift"]
    expect(tokens[11]).toEqual value: "{\n  ", scopes: ["source.swift"]
    expect(tokens[12]).toEqual value: "return", scopes: ["source.swift", "keyword.statement.swift"]
    expect(tokens[13]).toEqual value: " ", scopes: ["source.swift"]
    expect(tokens[14]).toEqual value: "true", scopes: ["source.swift", "keyword.expressions-and-types.swift"]
    expect(tokens[15]).toEqual value: "\n}", scopes: ["source.swift"]
