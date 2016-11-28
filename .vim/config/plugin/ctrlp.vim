let g:ctrlp_match_window = 'bottom,order:ttb,min:1,max:10,results:50'
let g:ctrlp_clear_cache_on_exit = 1
let g:ctrlp_cache_dir='~/.vim/.cache/ctrlp'
let g:ctrlp_switch_buffer = '0'
let g:ctrlp_match_func = { 'match': 'pymatcher#PyMatch' }
let g:ctrlp_map = ''

" Set the user_command option
let expr = '\.final_builds/*\|node_modules/*\|\.o$\|\.obj$\|\.exe$\|\.so$\'
let expr = expr . '|\.dll$\|\.pyc$\|\.svn\|\.hg\|\.bzr\|\.git\|\.sass-cache\'
let expr = expr . '|\.class\|\.scssc\|Godeps/*'
let cmd = 'ag %s -U -l --hidden --nocolor -g ""'
let g:ctrlp_user_command = cmd . ' | grep -v "'.expr .'"'

nnoremap <C-p> :CtrlPCurWD<cr>
nnoremap <leader>f :CtrlPCurWD<cr>
nnoremap <leader>m :CtrlPMRUFiles<cr>
nnoremap <leader>F :CtrlPBufTag<cr>
nnoremap <leader>S :CtrlPTag<cr>
nnoremap <leader>L :CtrlPLine<cr>
nnoremap <leader>b :CtrlPBuffer<cr>
