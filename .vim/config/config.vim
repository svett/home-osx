" ----------------------------------------
" Regular Vim Configuration (No Plugins Needed)
" ----------------------------------------

" We rely on bash for some things, make sure we use that for shelling out
set shell=/bin/bash

" disable backups
set nowritebackup
set noswapfile
set nobackup

" ### UI ###
" Line numbers on
set nu     
" Line wrapping off
set nowrap 
" Make the command area two lines high
set cmdheight=2
" don't need to show mode since we have airline
set noshowmode
" Disable jumping to matching bracket when typing
set noshowmatch
set numberwidth=4
set encoding=utf-8
set guioptions=acg
set guifont=DejaVuSansMono_Nerd_Font:h14
set guicursor=n-v-c:block-Cursor-blinkon0,ve:ver35-Cursor,o:hor50-Cursor,i-ci:ver25-Cursor,r-cr:hor20-Cursor,sm:block-Cursor-blinkwait175-blinkoff150-blinkon175
set cursorline

if !has('nvim')
  set ttyfast
endi

set lazyredraw

" Color the 80th column differently
if exists('+colorcolumn')
  set colorcolumn=80 
endif

if !has('nvim')
  if has("mouse_sgr")
    set ttymouse=sgr
  else
    set ttymouse=xterm2
  end
end

" ### Behavior ###
" equlize split windows
set equalalways
set splitright
" Automatically detect file types. (must turn on after Vundle)
set nocompatible
set modeline
filetype plugin indent on
" use emacs-style tab completion when selecting files, etc
set wildmode=list:longest
" Change buffer - without saving
set hidden
" Writes on make/shell commands
set autowriteall
set foldmethod=syntax
set foldlevel=20
set formatoptions=crql
" Add extra characters that are valid parts of variables
set iskeyword+=$,@,-
set tags=./tags;/,tags;/
set completeopt=noinsert,menuone,noselect

" ### Formatting ###
set tabstop=2
set shiftwidth=2
set expandtab

" ### Searching ###
" Non-case sensitive search
set ignorecase
set smartcase
set hlsearch
set wildignore+=.final_builds/*,*/node_modules/*,*.o,*.obj,*.exe,*.so,*.dll,*.pyc,.svn,.hg,.bzr,.git,.sass-cache,*.class,*.scssc,*/Godeps/*

set grepprg=ag\ --nogroup\ --column\ --smart-case\ --nocolor\ --follow
set grepformat=%f:%l:%c:%m

" ### Sounds ###
set noerrorbells
set novisualbell

" ### Mouse ###
" Hide mouse after chars typed
set mousehide
" Mouse in all modes
set mouse=a
" Show line numbers
set number
" Show me what I'm typing
set showcmd
" Split horizontal windows below to the current windows
set splitbelow
" Automatically save before :next, :make etc.
set autowrite
" Automatically read
set autoread
" Prefer Unix over Windows over OS 9 formats
set fileformats=unix,dos,mac
" speed up syntax highlighting
set nocursorcolumn
set nocursorline
set updatetime=400

" Completion window max size
set pumheight=10

"http://stackoverflow.com/questions/20186975/vim-mac-how-to-copy-to-clipboard-without-pbcopy
set clipboard^=unnamed
set clipboard^=unnamedplus

set viminfo='200

let g:python3_host_prog = '/Users/ralch/.vim/python/v3/bin/python'

if has('nvim')
  set termguicolors
end

autocmd FileType help setlocal nospell
autocmd FileType mail setlocal formatoptions+=aw
