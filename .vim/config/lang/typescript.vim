autocmd FileType typescript setlocal completeopt+=preview
autocmd FileType typescript JsPreTmpl html

let g:tsuquyomi_disable_quickfix = 1
let g:syntastic_typescript_checkers = ['tsuquyomi'] 
