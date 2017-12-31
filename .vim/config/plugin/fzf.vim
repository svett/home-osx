set rtp+=/usr/local/opt/fzf

" Prefix to the fzf commands
let g:fzf_command_prefix = 'Fzf'

" [Buffers] Jump to the existing window if possible
let g:fzf_buffers_jump = 1

" [Tags] Command to generate tags file
let g:fzf_tags_command = 'ctags -R'

nnoremap <C-p> :FzfFiles<cr>
nnoremap <leader>a :FzfAg<cr>
nnoremap <leader>f :FzfFiles<cr>
nnoremap <leader>t :FzfBTag<cr>
nnoremap <leader>l :FzfBLines<cr>
nnoremap <leader>b :FzfBuffers<cr>
