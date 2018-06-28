create table if not exists geoip (
    network cidr primary key,
    lat decimal,
    lon decimal,
    country text,
    subdiv1 text,
    subdiv2 text,
    timezone text
);
create index on geoip using GIST (network inet_ops);
