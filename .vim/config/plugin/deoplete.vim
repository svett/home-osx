let g:deoplete#enable_at_startup = 1

let g:deoplete#omni_patterns = {}

" autocomplete on just about any character
let g:deoplete#omni_patterns.go = '[a-zA-Z_\.]{3,}'

" autocomplete only on attributes; doesn't seem to complete local vars
let g:deoplete#omni_patterns.elm = '\.'

" tab for cycling through options
inoremap <expr> <TAB> pumvisible() ? "\<C-n>" : "\<TAB>"

" enter closes options if present and inserts linebreak
" apparently this has to be that complicated
inoremap <silent> <CR> <C-r>=<SID>deoplete_cr_function()<CR>
function! s:deoplete_cr_function()
  return pumvisible() ? deoplete#mappings#close_popup() : "\n"
endfunction
