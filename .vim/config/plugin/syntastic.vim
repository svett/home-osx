let g:syntastic_python_checkers = ['flake8']
let g:syntastic_go_checkers = ['go', 'govet', 'errcheck']
let g:syntastic_mode_map = { 'mode': 'active', 'passive_filetypes': ['ruby', 'go'] }
let g:syntastic_aggregate_errors = 1
let g:syntastic_always_populate_loc_list = 1
let g:syntastic_check_on_open = 1
let g:syntastic_html_tidy_ignore_errors=[
\'proprietary attribute "ng-',
\'proprietary attribute "marked',
\'proprietary attribute "analytics',
\]
