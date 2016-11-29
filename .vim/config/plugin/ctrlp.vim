let g:ctrlp_cache_dir='~/.vim/.cache/ctrlp'
let g:ctrlp_switch_buffer = '0'
let g:ctrlp_match_func = { 'match': 'pymatcher#PyMatch' }
let g:ctrlp_map = ''
let g:ctrlp_cmd = 'CtrlPMRU'
let g:ctrlp_working_path_mode = 'ra'
let g:ctrlp_switch_buffer = 'et'  " jump to a file if it's open already
let g:ctrlp_mruf_max=450    " number of recently opened files
let g:ctrlp_max_files=0     " do not limit the number of searchable files
let g:ctrlp_use_caching = 1
let g:ctrlp_clear_cache_on_exit = 0
let g:ctrlp_match_window = 'bottom,order:btt,max:10,results:10'
let g:ctrlp_buftag_types = {'go' : '--language-force=go --golang-types=ftv'}

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
