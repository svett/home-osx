autocmd FileType go compiler go
autocmd! BufEnter *.go setlocal shiftwidth=2 tabstop=2 softtabstop=2 noexpandtab

nmap <C-g> :GoDecls<cr>
imap <C-g> <esc>:<C-u>GoDecls<cr>

au FileType go nmap <Leader>s <Plug>(go-implements)
au FileType go nmap <Leader>i <Plug>(go-info)
au FileType go nmap <Leader>l <Plug>(go-metalinter)
au FileType go nmap <Leader>t <Plug>(go-test)
au FileType go nmap <Leader>r <Plug>(go-run)
au FileType go nmap <Leader>T :Tmux ginkgo -r<CR>

au FileType go nmap <Leader>gd <Plug>(go-doc)
au FileType go nmap <Leader>gb <Plug>(go-doc-browser)
au FileType go nmap <Leader>b <Plug>(go-build)
au FileType go nmap <Leader>c <Plug>(go-coverage)
au FileType go nmap <Leader>ds <Plug>(go-def-split)
au FileType go nmap <Leader>dv <Plug>(go-def-vertical)
au FileType go nmap <Leader>dt <Plug>(go-def-tab)
au FileType go nmap <Leader>e <Plug>(go-rename)

au Filetype go command! -bang A call go#alternate#Switch(<bang>0, 'edit')
au Filetype go command! -bang AV call go#alternate#Switch(<bang>0, 'vsplit')
au Filetype go command! -bang AS call go#alternate#Switch(<bang>0, 'split')
au Filetype go command! -bang AT call go#alternate#Switch(<bang>0, 'tabe')

" vim-go setup
let g:go_highlight_build_constraints = 1
let g:go_highlight_fields = 1
let g:go_highlight_functions = 1
let g:go_highlight_generate_tags = 1
let g:go_highlight_operators = 1
let g:go_highlight_structs = 1
let g:go_highlight_types = 1
let g:go_highlight_functions = 1
let g:go_highlight_function_calls = 1

let g:go_gocode_propose_source = 1
let g:go_fmt_fail_silently = 0
let g:go_fmt_command = "goimports"
let g:go_snippet_engine = "ultisnips"
let g:go_auto_type_info = 0
let g:go_auto_sameids = 1
let g:go_fmt_autosave = 1
let g:go_bin_path = expand("~/go/bin")
let g:go_term_enabled = 1
let g:go_term_mode = "split"
let g:go_term_height = 15
let g:go_def_mode = 'gopls'
let g:go_info_mode = 'gopls'
let g:go_metalinter_command = 'golangci-lint'
let g:go_metalinter_autosave = 1

let g:ale_go_golangci_lint_package = 1
let g:ale_go_golangci_lint_options = '--fast --enable-all'
let g:ale_linters = {'go': ['gobuild', 'gofmt', 'govet', 'gopls', 'golangci-lint']}

" this breaks folding on vim < 8.0 or neovim
if v:version >= 800 || has('nvim')
  let g:go_fmt_experimental = 1
endif
