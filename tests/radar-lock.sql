-- Non-writing concurrency fixture. Briefly locks SONDA to check that review
-- and upload HTTP requests use the same serialization point. No state changes.
begin;
select id from public.radar_prospectos where id=7 for update;
select pg_sleep(12);
rollback;
