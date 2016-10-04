<a name="v3.2.0"></a>
# v3.2.0 (2015-02-09)

## :sparkles: Features

- Implement stylus hash support ([d37baa8b](https://github.com/abe33/pigments/commit/d37baa8b4ab64b98f8d4192c5d482fd72fa788c1))

## :bug: Bug Fixes

- Fix rgba(var, alpha) expression not marked as invalid ([a2f70f96](https://github.com/abe33/pigments/commit/a2f70f964eccf2d6aca0f8031f8d6b431a2a89f4))

<a name="v3.1.0"></a>
# v3.1.0 (2015-02-03)

## :sparkles: Features

- Add support for color variables in all remaining operations ([fa96e4ba](https://github.com/abe33/pigments/commit/fa96e4ba78e81a2ae659ea535f43c8a985567e9b))
- Add support for variables as color in darken ([d13a6f4c](https://github.com/abe33/pigments/commit/d13a6f4c6e4ea9151da03000f595c7a624b0ece7))
- Add support for variables in gray() definition ([8328553d](https://github.com/abe33/pigments/commit/8328553d575841f2112b47f1869fc34b97b62ae5))
- Add support for rgba(color, alpha) signature ([c883351d](https://github.com/abe33/pigments/commit/c883351dfd5e2c8b6dc687846e0192631f2a2114))
- Add #AARRGGBB color support ([2004c9db](https://github.com/abe33/pigments/commit/2004c9dbd3f45ac4de622a40ad4c1b93f058a086), [abe33/atom-color-highlight#74](https://github.com/abe33/atom-color-highlight/issues/74))

## :bug: Bug Fixes

- Fix variables with !default not parsed properly ([20ff9b37](https://github.com/abe33/pigments/commit/20ff9b373cded1d90a16d423073173d0b3a787de), [abe33/atom-project-palette-finder#23](https://github.com/abe33/atom-project-palette-finder/issues/23))
- Fix stylus variable starting with $ not parsed ([3612240b](https://github.com/abe33/pigments/commit/3612240b7bb549387cb085f6a08e93671696ea50), [abe33/atom-project-palette-finder#19](https://github.com/abe33/atom-project-palette-finder/issues/19))

<a name="v3.0.4"></a>
# v3.0.4 (2014-11-26)

## :bug: Bug Fixes

- Fix published code not in sync with sources.

<a name="v3.0.2"></a>
# v3.0.2 (2014-11-25)

## :bug: Bug Fixes

- Fix color not matched after a (, [ or { ([0792489d](https://github.com/abe33/pigments/commit/0792489d9656be16695d3019eba936ad8aae0eba), [abe33/atom-color-highlight#56](https://github.com/abe33/atom-color-highlight/issues/56))

<a name="v3.0.1"></a>
# v3.0.1 (2014-10-15)

## :bug: Bug Fixes

- Fix invalid match of variable name in longer name ([f5e47cb7](https://github.com/abe33/pigments/commit/f5e47cb7d0e6cc99140a1b3673d4127d3e1e4865), [abe33/atom-color-highlight#50](https://github.com/abe33/atom-color-highlight/issues/50))

<a name="v3.0.0"></a>
# v3.0.0 (2014-10-09)

## :sparkles: Features

- Implement async threshold ([36e41aef](https://github.com/abe33/pigments/commit/36e41aef93a6467be872940bfda6c65ded8ff9c1))  <br>It spans long executions over several frames by measuring the execution
  time and request a new frame when going past the threshold.

## :bug: Bug Fixes

- Fix named colors in strings not matched ([ed455732](https://github.com/abe33/pigments/commit/ed455732419078d165db54217cd4632a0df18c53))
- Fix invalid expression stored in color created from variable ([3b55cb3f](https://github.com/abe33/pigments/commit/3b55cb3f6ea72f802614d8c59447af467745adc5))
- Fix missing pseudo lookbehind on color variables ([5cf1d81c](https://github.com/abe33/pigments/commit/5cf1d81cec656d1db796cbe8d651a8926919c476))
- Fix issue with ignore case and variables/operations ([80171a90](https://github.com/abe33/pigments/commit/80171a903aa510e50a3baa18f61406c081d7d4ec))
- Fix issue with named colors ([04a96030](https://github.com/abe33/pigments/commit/04a960309e2c3bd59d49735fe07f288f10a605a1))
- Fix $color matched in $color_name ([48564258](https://github.com/abe33/pigments/commit/485642580f14d6c7be98c0815bd8b56fb459cd9d))

<a name="v2.1.1"></a>
# v2.1.1 (2014-09-18)

## :bug: Bug Fixes

- Fix infinite loop introduced in latest release ([0f966b2f](https://github.com/abe33/pigments/commit/0f966b2ff70e0a2aa03f062f50e3b97ef36240b6))

<a name="v2.1.0"></a>
# v2.0.1 (2014-09-18)

## :sparkles: Features

- Add support for percents in adjust-hue function ([694c50bf](https://github.com/abe33/pigments/commit/694c50bf2e03c19788fcdc429934d00543f2b5fd))

## :bug: Bug Fixes

- Fix aliased color at level n+2 not detected ([9e0d4fbc](https://github.com/abe33/pigments/commit/9e0d4fbc57d49d424ca6883ce99f0df3d4c568fd), [abe33/atom-color-highlight#40](https://github.com/abe33/atom-color-highlight/issues/40))

<a name="v2.0.0"></a>
# v2.0.0 (2014-08-04)

## :sparkles: Features

- Upgrade to `node-oniguruma@3.x` in order to support Atom v.0.121.0

<a name="v1.11.3"></a>
# v1.11.3 (2014-07-30)

## :bug: Bug Fixes

- Fix missing match when a color variable is followed by a selector ([ea08dde0](https://github.com/abe33/pigments/commit/ea08dde07634218b435e9ff23b7411cef328c373))

<a name="v1.11.2"></a>
# v1.11.2 (2014-07-27)

## :bug: Bug Fixes

- Fix invalid lighten/darken operation for less/sass ([8ac0214d](https://github.com/abe33/pigments/commit/8ac0214dd67ea34b77be21ce03440f9de914f3fe), [abe33/atom-color-highlight#26](https://github.com/abe33/atom-color-highlight/issues/26))
- Fix css color function raising exception when invalid ([a883ccad](https://github.com/abe33/pigments/commit/a883ccadb60a3498d01506ab821ed43e39992fe4), [abe33/atom-color-highlight#27](https://github.com/abe33/atom-color-highlight/issues/27))


<a name="v1.11.1"></a>
# v1.11.1 (2014-07-21)

## :bug: Bug Fixes

- Fix broken variable handling at n+1 ([f34be5b0](https://github.com/abe33/pigments/commit/f34be5b082ce60a11ad3f710604e410b60d5a4e8), [abe33/atom-color-highlight#23](https://github.com/abe33/atom-color-highlight/issues/23))

<a name="v1.11.0"></a>
# v1.11.0 (2014-07-20)

## :sparkles: Features

- Add support for variables in color functions ([ee67434a](https://github.com/abe33/pigments/commit/ee67434acc0ae8542e8cb02235247216561900fc))  
  <br>Includes:
  - Any parameter can now be a variable
  - Any missing variable will mark the color as invalid

## :bug: Bug Fixes

- Fix error raised if the param in sass function is not a number ([fd2f2fd6](https://github.com/abe33/pigments/commit/fd2f2fd678d93d4ed37c23304842d6f89c114950), [#23](https://github.com/abe33/pigments/issues/23))


<a name="v1.10.0"></a>
# v1.10.0 (2014-07-18)

## :sparkles: Features

- Add support for sass `change-color` function ([0869240a](https://github.com/abe33/pigments/commit/0869240a64189c94a0beee9ba7ecab9f3f9d7ef5))
- Add support for sass `scale-color` function ([359ecd63](https://github.com/abe33/pigments/commit/359ecd63c283df00c93d838c988f3862993d1f21))
- Add support for sass `adjust-color` function ([bb6b2d2d](https://github.com/abe33/pigments/commit/bb6b2d2dcb8a3b262a87845edb1358639b944d18))

<a name="v1.9.1"></a>
# v1.9.1 (2014-07-17)

## :bug: Bug Fixes

- Fix expressions order for gray functional notation ([f510f7e6](https://github.com/abe33/pigments/commit/f510f7e6345a8313c0a57fb756ea1b1cddc7cef1))

<a name="v1.9.0"></a>
# v1.9.0 (2014-07-16)

## :sparkles: Features

- Add support for the css4 `gray` functional notation ([f8f0d212](https://github.com/abe33/pigments/commit/f8f0d21223c24b4724c8e0638b4f3b52126160b1))
- Add support for the HWB color model ([b64d9574](https://github.com/abe33/pigments/commit/b64d95749a348cb66e9434c5438eac6afbca0693), [abe33/atom-color-highlight#20](https://github.com/abe33/atom-color-highlight/issues/20))  
  <br>Includes:
  - Conversion from and to rgb and hsv models
  - A `hwb` accessor on colors

## :bug: Bug Fixes

- Fix number followed by = matched as stylus variable ([5e748b2f](https://github.com/abe33/pigments/commit/5e748b2f90c09a7003bf7794aa6e1fbe7067d8b7))

<a name="v1.8.0"></a>
# v1.8.0 (2014-07-10)

## :sparkles: Features

- Add support for css color function ([97c43d37](https://github.com/abe33/pigments/commit/97c43d376b68810c74b41e047405dcbb23918357))

## :bug: Bug Fixes

- Fix parsing of variable with a dash in their name ([6d942263](https://github.com/abe33/pigments/commit/6d9422637b8b11bd42945276c82ddf5edc9bf720), [abe33/atom-color-highlight#15](https://github.com/abe33/atom-color-highlight/issues/15))
- Fix invalid parsing of floats with no content ([6f44b765](https://github.com/abe33/pigments/commit/6f44b7652192d77b0845b367e137b9350238e073))

<a name="v1.7.1"></a>
# v1.7.1 (2014-07-10)

## :bug: Bug Fixes

- Fix invalid positions in variables parsing within range ([1bf366f1](https://github.com/abe33/pigments/commit/1bf366f185546b78cd5ad0236a00eef6a9361483))

<a name="v1.7.0"></a>
# v1.7.0 (2014-07-05)

## :sparkles: Features

- Add buffer range as property of found variables ([1a85a19b](https://github.com/abe33/pigments/commit/1a85a19bd0492a8ec58d4528bd9efe69a31e7f5d))

## Breaking Changes

- due to [1a85a19b](https://github.com/abe33/pigments/commit/1a85a19bd0492a8ec58d4528bd9efe69a31e7f5d), the variables resulting hash format had changed, the
value for a variable is now an object with a `value` and `range`
properties.
To update to the new version replace the following code:
```coffeescript
results[‘@variable’]
```
With:
```coffeescript
results[‘@variable’].value
```

<a name="v1.6.2"></a>
# v1.6.2 (2014-07-01)

## :bug: Bug Fixes

- The variables arguments in color scan was never used ([4220eae4](https://github.com/abe33/pigments/commit/4220eae466ae58475d0ca4561c48acce1aad81ef))


<a name="v1.6.0"></a>
# v1.6.0 (2014-06-03)

## :sparkles: Features

- Implement color expressions priority ([b807897f](https://github.com/abe33/pigments/commit/b807897fb1eab616efd42dafea8404a3c209814c))  <br>Allowing some expression regexp to be evaluated prior any other.

## :bug: Bug Fixes

- Fix unmatched colors from variables ([f0dabc0a](https://github.com/abe33/pigments/commit/f0dabc0ab390555f5e0de519193da29d86415945))
- Fix invalid empty match making extraction fail ([f73ed8b0](https://github.com/abe33/pigments/commit/f73ed8b0c2134596694da68c256f5b727940f8e5))
- Fix missing variables expressions require in index ([b4c35ed7](https://github.com/abe33/pigments/commit/b4c35ed7890e0ef5f5af96610337e9fc2f9c324a))

<a name="v1.5.0"></a>
# v1.5.0 (2014-06-03)

## :sparkles: Features

- Implement variables parsing before searching for colors ([83ab2fcc](https://github.com/abe33/pigments/commit/83ab2fcc0508a845d9e46e894e1332edcce02bb8))
- Add a `color` property in buffer scan results ([ed588a7f](https://github.com/abe33/pigments/commit/ed588a7f2d01a3826ee1e4b7131f79306d13588b))  <br>The `color` property stores a `Color` object corresponding
  to the found color.
- Implement variables search for less, sass, scss and stylus syntax ([9bf60ac2](https://github.com/abe33/pigments/commit/9bf60ac2a5b377c946b3be6b18a9bed99d813c99)), [c484de2a](https://github.com/abe33/pigments/commit/c484de2aed4262c6b13328a39978693fc1b98c12))

## :bug: Bug Fixes

- Fix false positive match in `canHandle` ([5b8a260b](https://github.com/abe33/pigments/commit/5b8a260bc90b4572dd7df1eb173e2bbec123a0e8))

<a name="v1.4.1"></a>
# v1.4.1 (2014-05-29)

## :sparkles: Features

- Add a CHANGELOG file ([81d5107a](https://github.com/abe33/pigments/commit/81d5107a35e81a7c0c6fca379b759b73420e8b60))

## :bug: Bug Fixes

- Fix invalid match with hexa colors ([c3dfbc23](https://github.com/abe33/pigments/commit/c3dfbc23931d38081b3bc9e5040c51d902a8b5c3), Closes [abe33/atom-color-highlight#12](https://github.com/abe33/atom-color-highlight/issues/12))

<a name="v1.4.0"></a>
# v1.4.0 (2014-05-29)

## :sparkles: Features

- Adds luma function to color-model ([f7fa32de](https://github.com/abe33/pigments/commit/f7fa32dee41aadf91aef99d2f224497d4088ba41))

<a name="v1.3.0"></a>
# v1.3.0 (2014-05-29)

## :racehorse: Performances

- Totally revert to previous operation handling ([f90d529](https://github.com/abe33/pigments/commit/f90d52924257309155d89369644468651c4024a7))
  <br>The « smart » version was too expensive, and was using too much
recursion, a simple file with many operations was causing racing
conditions that was causing the search to never end. It also leads the
search process to climb to several Go in RAM.

<a name="v1.2.0"></a>
# v1.2.0 (2014-05-29)

## :sparkles: Features

- Implements a fully asynchrone operation search ([41e9e472](https://github.com/abe33/pigments/commit/41e9e472557d187b9f8c253aca0821e7150071f2))


<a name="v1.1.1"></a>
# v1.1.1 (2014-05-29)

## :bug: Bug Fixes

- Fixes parsing order that was jumping too far in text ([2bd5874d](https://github.com/abe33/pigments/commit/2bd5874d56124b7e3481191d8417924ed56d2493))


<a name="v1.1.0"></a>
# v1.1.0 (2014-05-29)

## :sparkles: Features

- Adds public methods to remove expressions/operations ([dfff95cb](https://github.com/abe33/pigments/commit/dfff95cb639001640d0cd68b79d88db273de6fa2))
- Adds a name to identify expressions and operations ([e8e42ebb](https://github.com/abe33/pigments/commit/e8e42ebb4832db62837e4e35d36600d82d1af8c5))
