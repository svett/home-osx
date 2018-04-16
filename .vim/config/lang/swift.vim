autocmd BufNewFile,BufRead *.swift set filetype=swift

" Jump to the first placeholder by typing `<C-k>`.
autocmd FileType swift imap <buffer> <C-k> <Plug>(autocomplete_swift_jump_to_placeholder)<Paste>
