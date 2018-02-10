let g:rustfmt_autosave = 1
let g:rustfmt_fail_silently = 1
let g:rust_recommended_style = 1
let g:rust_clip_command = 'pbcopy'
let g:racer_experimental_completer = 1

au FileType rust nmap gd <Plug>(rust-def)
au FileType rust nmap gs <Plug>(rust-def-split)
au FileType rust nmap gx <Plug>(rust-def-vertical)
au FileType rust nmap <leader>gd <Plug>(rust-doc)
au FileType rust nmap <leader>r :RustRun<CR>
