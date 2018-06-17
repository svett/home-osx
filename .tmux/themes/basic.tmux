# vim:ft=tmux 

set-option -g visual-activity off
set-option -g visual-bell off
set-option -g visual-silence off
set-window-option -g monitor-activity off
set-option -g bell-action none

# status line
set -g status-justify left
set -g status-bg default
set -g status-fg colour12
set -g status-interval 1

# messaging
set -g message-fg black
set -g message-bg yellow
set -g message-command-fg blue
set -g message-command-bg black

# window mode
setw -g mode-bg colour6
setw -g mode-fg colour0

# window status
set -g window-status-separator ''

setw -g window-status-current-fg colour81
setw -g window-status-current-bg colour242
setw -g window-status-current-attr bold
setw -g window-status-current-format ' #I#[fg=colour250]:#[fg=colour255]#W#[fg=colour50]#F '

setw -g window-status-fg colour138
setw -g window-status-bg colour236
setw -g window-status-attr none
setw -g window-status-format ' #I#[fg=colour242]:#[fg=colour250]#W#[fg=colour244]#F '

# modes
setw -g clock-mode-colour colour135
setw -g mode-attr bold
setw -g mode-fg colour00
setw -g mode-bg colour03

# panes
set -g pane-border-bg colour235
set -g pane-border-fg colour238
set -g pane-active-border-bg colour236
set -g pane-active-border-fg colour51

# statusbar
set -g status-position bottom
set -g status-bg colour234
set -g status-fg colour137
set -g status-attr dim

set -g status-left '#{prefix_highlight}'
set -g status-right '#[fg=green,bright]#h#[fg=white](#[fg=blue]#S#[fg=white])'

set -g status-right-length 100
set -g status-left-length 20

setw -g window-status-bell-attr bold
setw -g window-status-bell-fg colour255
setw -g window-status-bell-bg colour1

# messages
set -g message-attr bold
set -g message-fg colour232
set -g message-bg colour166
