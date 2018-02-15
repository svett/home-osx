let g:sql_type_default = 'pgsql'
let g:dbext_default_profile = 'psql'
let g:dbext_default_buffer_lines = 10 
let g:dbext_database_conf = expand('$PWD/.database')

if filereadable(dbext_database_conf)
  " Read the configuration for this database
  let g:dbext_databse_connection = join(readfile(dbext_database_conf, ''))
  " PostgreSQL
  let g:dbext_default_profile_psql = dbext_databse_connection
  " MySQL
  let g:dbext_default_profile_mysql_local = dbext_databse_connection
  " SQLite
  let g:dbext_default_profile_sqlite_for_rails = dbext_databse_connection
  " Microsoft SQL Server
  let g:dbext_default_profile_microsoft_production = dbext_databse_connection
endif


