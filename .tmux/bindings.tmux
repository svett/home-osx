# vim:ft=tmux 

bind -n C-space run "(tmux display-message -p '#{pane_current_command}' | grep -iq emacs && tmux send-keys C-space) || tmux switch-client -Tprefix"
bind C-space last-window		
bind C-q last-window
bind C-l send-keys 'C-l'
bind v split-window -h -c "#{pane_current_path}"

