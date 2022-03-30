create table retraceduser (
    id text not null primary key,
    created timestamp,
    email text,
    last_login timestamp,
    password_crypt text
);
