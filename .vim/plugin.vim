" set the runtime path to include Vundle and initialize
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()

" Let Vundle manage Vundle
Plugin 'VundleVim/Vundle.vim'

if has('nvim')"
  " provides an asynchronous keyword completion system in the current buffer
  Plugin 'Shougo/deoplete.nvim'
  " deoplete.nvim source for Golang and gocode or vim-go
  Plugin 'zchee/deoplete-go', { 'do': 'make' }
else
  " Universal set of vim defaults that everyone can agree on
  Plugin 'tpope/vim-sensible'

  " Next generation completion framework after neocomplcache
  Plugin 'Shougo/neocomplete.vim'
end
"
" Syntax checking hacks for vim
Plugin 'benekastah/neomake'

" comment stuff out (via leader-/)
Plugin 'tpope/vim-commentary'

" quoting/parenthesizing made simple; e.g. ysiw) to wrap word in parens
Plugin 'tpope/vim-surround'

" a Git wrapper so awesome, it should be illegal; :Gblame, etc
Plugin 'tpope/vim-fugitive'

" GitHub extension for vim-fugitive
Plugin 'tpope/vim-rhubarb'

" Ends certain structures automatically
Plugin 'tpope/vim-endwise'

" easily search for, substitute, and abbreviate multiple variants of a word
Plugin 'tpope/vim-abolish'

" True Sublime Text style multiple selections for Vim
Plugin 'terryma/vim-multiple-cursors'

" rainbow parentheses improved, shorter code, no level limit, smooth and fast, powerful configuration.
Plugin 'luochen1990/rainbow'

" Kotlin
Plugin 'udalov/kotlin-vim'

" Swift
Plugin 'keith/swift.vim'
Plugin 'mitsuse/autocomplete-swift'

" Ruby specific
Plugin 'tpope/rbenv-ctags',           { 'for': ['ruby', 'rake'] }
Plugin 'tpope/vim-rake',              { 'for': ['ruby', 'rake'] }
Plugin 'tpope/vim-bundler',           { 'for': ['ruby', 'rake'] }
Plugin 'ecomba/vim-ruby-refactoring', { 'for': ['ruby', 'rake'] }
Plugin 'thoughtbot/vim-rspec',        { 'for': ['ruby', 'rake'] }

" Vim sugar for the UNIX shell commands that need it the most; e.g. :Find, :Wall
Plugin 'tpope/vim-eunuch'

" enable repeating supported plugin maps with '.'
Plugin 'tpope/vim-repeat'

" netrw enhancements - because NERDTree is a vim anti-pattern
Plugin 'tpope/vim-vinegar'

" automatically adjusts 'shiftwidth' and 'expandtab' heuristically based on the current file
Plugin 'tpope/vim-sleuth'

" pairs of handy bracket mappings; e.g. [<Space> and ]<Space> add newlines before and after the cursor line
Plugin 'tpope/vim-unimpaired'

" JSON manipulation and pretty printing
Plugin 'tpope/vim-jdaddy'

" JSX support
Plugin 'pangloss/vim-javascript'
Plugin 'mxw/vim-jsx'
Plugin 'moll/vim-node'
Plugin 'Quramy/vim-js-pretty-template'

" Ghetto HTML/XML mappings
Plugin 'tpope/vim-ragtag'

" Displays tags in a window, ordered by scope
Plugin 'majutsushi/tagbar'

" A tree explorer plugin for vim
Plugin 'scrooloose/nerdtree'

" Syntax checking hacks for vim
Plugin 'vim-syntastic/syntastic'

" Fuzzy fast search
Plugin 'junegunn/fzf.vim'

" displays information in echo area from echodoc plugin.
Plugin 'Shougo/echodoc.vim'

 " Vim plugin for the Perl module / CLI script 'ack'
Plugin 'mileszs/ack.vim'
Plugin 'rking/ag.vim'

" Text filtering and alignment
Plugin 'godlygeek/tabular'

" Dash integration
Plugin 'rizzatti/dash.vim'

" Status/tabline
Plugin 'vim-airline/vim-airline'
Plugin 'vim-airline/vim-airline-themes'

" Syntax highlighting, matching rules and mappings for the original Markdown
Plugin 'plasticboy/vim-markdown'
Plugin 'shime/vim-livedown'

" Highlight colours in files
Plugin 'ap/vim-css-color'

" Develop Golang
Plugin 'fatih/vim-go', { 'do': ':GoInstallBinaries' }

" OmniSharp
Plugin 'OmniSharp/omnisharp-vim'

" Develop F#
Plugin 'fsharp/vim-fsharp'

" Install Web API needed by Rust
Plugin 'mattn/webapi-vim'

" Develop Rust
Plugin 'rust-lang/rust.vim'
Plugin 'racer-rust/vim-racer'

" Develop TypeScript
Plugin 'HerringtonDarkholme/yats.vim'
Plugin 'Shougo/vimproc.vim', {'do' : 'make'}
Plugin 'Quramy/tsuquyomi'

" A solid language pack for Vim.
" Adds 70+ languages and optimizes loading and installing.
Plugin 'sheerun/vim-polyglot'

" Syntax detection and highlighting CI pipeline files
Plugin 'luan/vim-concourse'

" Syntax dectection for bosh
Plugin 'luan/vim-bosh'

" Color themes
Plugin 'fatih/molokai'
Plugin 'jpo/vim-railscasts-theme'

" editorconfig.org plugin
Plugin 'editorconfig/editorconfig-vim'

" ansible syntax highlighting
Plugin 'pearofducks/ansible-vim'

" Basic vim/terraform integration
Plugin 'hashivim/vim-terraform.git'

" Apiary Intergration
Plugin 'kylef/apiblueprint.vim'

" Brewfile Support
Plugin 'bfontaine/Brewfile.vim'

" Run any tests
Plugin 'janko-m/vim-test'

" Install PSQL plugin
Plugin 'lifepillar/pgsql.vim'
Plugin 'vim-scripts/dbext.vim'

" Install tmux integration
Plugin 'christoomey/vim-tmux-navigator'
Plugin 'jgdavey/tslime.vim'

call vundle#end()
