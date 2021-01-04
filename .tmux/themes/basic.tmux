# vim:ft=tmux

set-option -g visual-activity off
set-option -g visual-bell off
set-option -g visual-silence off
set-window-option -g monitor-activity off
set-option -g bell-action none

# status line
set -g status-justify left
set -g status-interval 1
set -g status-style fg=colour12,bg=default

# messaging
set -g message-style fg=black,bg=yellow
set -g message-style fg=colour232,bg=colour166,bold
set -g message-command-style fg=blue,bg=black

# window mode
setw -g mode-style fg=colour00,bg=colour03,bold

# window status
set -g window-status-separator ''

setw -g window-status-current-style fg=colour81,bg=colour242,bold
setw -g window-status-current-format ' #I#[fg=colour250]:#[fg=colour255]#W#[fg=colour50]#F '

setw -g window-status-style fg=colour138,bg=colour236,none
setw -g window-status-format ' #I#[fg=colour242]:#[fg=colour250]#W#[fg=colour244]#F '

# modes
setw -g clock-mode-colour colour135

# panes
set -g pane-border-style fg=colour238,bg=colour235
set -g pane-active-border-style fg=colour51,bg=colour236

# statusbar
set -g status-position bottom
set -g status-style fg=colour137,bg=colour234,dim

set -g status-left '#{prefix_highlight}'
set -g status-right '#[fg=green,bright]#h#[fg=white](#[fg=blue]#S#[fg=white])'

set -g status-right-length 100
set -g status-left-length 20

setw -g window-status-bell-style fg=colour255,bg=colour1,bold
